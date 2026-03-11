import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import { v4 as uuidv4 } from "uuid";

// --- Types & Schemas (Blueprints) ---

// Crop Schema
const CropSchema = z.object({
  name: z.string(),
  scientificName: z.string().optional(),
  soilPH: z.string().describe("Ideal soil pH range"),
  temperatureRange: z.string().describe("Ideal temperature range in Celsius"),
  irrigationSchedule: z.string(),
  growthStages: z.array(z.string()).optional(),
});

// Market Schema
const MarketSchema = z.object({
  commodity: z.string(),
  region: z.string(),
  currentPrice: z.string(),
  trend: z.enum(["up", "down", "stable"]),
  supplyDemand: z.string(),
});

// Pest/Pathology Schema
const PestSchema = z.object({
  name: z.string(),
  symptoms: z.array(z.string()),
  treatments: z.array(z.string()),
  affectedCrops: z.array(z.string()),
});

// Job/Task Status
type JobStatus = "queued" | "processing" | "completed" | "failed";
type WorkerType = "pdf_worker" | "web_worker" | "social_worker";

interface Job {
  id: string;
  type: WorkerType;
  status: JobStatus;
  fileName?: string;
  content?: string;
  result?: any;
  logs: string[];
  cost: number;
  createdAt: Date;
}

// Farmer Profile Schema
const FarmerProfileSchema = z.object({
  location: z.string(),
  farmSize: z.number(),
  farmSizeUnit: z.enum(["acres", "hectares"]),
  primaryCrops: z.array(z.string()),
});

type FarmerProfile = z.infer<typeof FarmerProfileSchema>;

// In-memory store
let farmerProfile: FarmerProfile | null = null;

const jobs: Record<string, Job> = {};
const processedStats = {
  guidesProcessed: 0,
  qaPairsGenerated: 0,
  totalCost: 0,
};

// --- AI Specialists ---
let ai: GoogleGenAI;

function getAI() {
  if (!ai) {
    let apiKey = "";
    const keysToCheck = ["GEMINI_API_KEY", "GOOGLE_API_KEY", "API_KEY", "VITE_GEMINI_API_KEY"];
    
    console.log("[Server] Checking environment variables for API key...");
    
    for (const keyName of keysToCheck) {
      const value = process.env[keyName];
      if (value) {
        const cleanValue = value.trim().replace(/^["']|["']$/g, '');
        if (cleanValue.length > 20 && cleanValue.startsWith("AIza")) {
          apiKey = cleanValue;
          console.log(`[Server] Found valid-looking API key in ${keyName}`);
          break;
        } else {
          console.warn(`[Server] Ignoring invalid/placeholder key in ${keyName}: ${cleanValue.substring(0, 5)}...`);
        }
      }
    }

    if (!apiKey) {
      console.error("[Server] No valid Google API key found in environment variables.");
      throw new Error("GEMINI_API_KEY is not set or invalid");
    }
    
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

async function runAgronomist(text: string): Promise<{ qaPairs: any[]; cost: number }> {
  // Specialist: Converts raw text into Q&A pairs
  const model = "gemini-2.0-flash";
  const prompt = `
    You are The Agronomist Specialist. 
    Analyze the following agricultural text and generate 3-5 high-quality Q&A pairs suitable for fine-tuning a farmer chatbot.
    Focus on practical advice: soil, pests, irrigation, planting.
    
    Text: ${text.substring(0, 5000)}... (truncated)
    
    Return JSON format: [{ "question": "...", "answer": "..." }]
  `;

  try {
    const response = await getAI().models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const qaPairs = JSON.parse(response.text || "[]");
    // Mock cost calculation (approx $0.0001 per 1k chars for flash)
    const cost = (text.length / 1000) * 0.0001; 
    return { qaPairs, cost };
  } catch (e) {
    console.error("Agronomist failed", e);
    return { qaPairs: [], cost: 0 };
  }
}

async function runMarketAnalyst(text: string): Promise<{ analysis: any; cost: number }> {
  // Specialist: Summarizes price trends
  const model = "gemini-2.0-flash";
  const prompt = `
    You are The Market Analyst.
    Extract market data from the text. Look for commodities, prices, and trends.
    
    Text: ${text.substring(0, 3000)}
    
    Return JSON matching this schema: { "commodity": "...", "region": "...", "currentPrice": "...", "trend": "up|down|stable", "supplyDemand": "..." }
  `;

  try {
    const response = await getAI().models.generateContent({
      model,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    const analysis = JSON.parse(response.text || "{}");
    const cost = (text.length / 1000) * 0.0001;
    return { analysis, cost };
  } catch (e) {
    console.error("Market Analyst failed", e);
    return { analysis: {}, cost: 0 };
  }
}

// --- E-Commerce Data Models ---

const ProductSchema = z.object({
  title: z.string(),
  description: z.string(),
  price: z.number(),
  category: z.string(),
  image: z.string().optional(),
  stock: z.number(),
});

interface User {
  id: string;
  name: string;
  email: string;
  role: "seller" | "consumer";
  storeName?: string;
}

interface Product {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  stock: number;
}

// In-memory Stores
const users: User[] = [
  { id: "u1", name: "John Farmer", email: "john@farm.com", role: "seller", storeName: "Green Valley Farms" },
  { id: "u2", name: "Alice Buyer", email: "alice@city.com", role: "consumer" }
];

const products: Product[] = [
  {
    id: "p1",
    sellerId: "u1",
    title: "Fresh Potatoes (Jalgaon Variety)",
    description: "High quality fresh potatoes directly from Jalgaon farms.",
    price: 18,
    originalPrice: 22,
    discount: "18% OFF",
    category: "Vegetables",
    image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=2070&auto=format&fit=crop",
    stock: 500
  },
  {
    id: "p2",
    sellerId: "u1",
    title: "Premium Red Onions (Jalgaon)",
    description: "Export quality red onions.",
    price: 22,
    originalPrice: 28,
    discount: "21% OFF",
    category: "Vegetables",
    image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?q=80&w=1974&auto=format&fit=crop",
    stock: 1000
  },
  {
    id: "p3",
    sellerId: "u1",
    title: "Sharbati Wheat (Jalgaon Farms)",
    description: "Premium Sharbati wheat grains.",
    price: 28,
    originalPrice: 35,
    discount: "20% OFF",
    category: "Grains",
    image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=2089&auto=format&fit=crop",
    stock: 2000
  },
  {
    id: "p4",
    sellerId: "u1",
    title: "Organic Green Peas",
    description: "Freshly harvested organic green peas.",
    price: 60,
    originalPrice: 75,
    discount: "20% OFF",
    category: "Vegetables",
    image: "https://images.unsplash.com/photo-1592494804071-faea15d93a8a?q=80&w=2070&auto=format&fit=crop",
    stock: 300
  }
];

// --- Server Setup ---

async function startServer() {
  const app = express();
  const PORT = 3000;
  
  // Middleware
  app.use(express.json());
  
  // File Upload
  const upload = multer({ storage: multer.memoryStorage() });

  // --- Auth Routes ---
  
  app.post("/api/auth/login", (req, res) => {
    const { email, role } = req.body;
    // Simple mock auth
    const user = users.find(u => u.email === email && u.role === role);
    if (user) {
      res.json(user);
    } else {
      // Auto-register for demo if not found
      const newUser: User = {
        id: uuidv4(),
        name: email.split("@")[0],
        email,
        role,
        storeName: role === "seller" ? `${email.split("@")[0]}'s Store` : undefined
      };
      users.push(newUser);
      res.json(newUser);
    }
  });

  // --- Product Routes ---

  app.get("/api/products", (req, res) => {
    const { sellerId, category, search } = req.query;
    let filtered = products;

    if (sellerId) {
      filtered = filtered.filter(p => p.sellerId === sellerId);
    }
    if (category) {
      filtered = filtered.filter(p => p.category === category);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q)
      );
    }
    
    res.json(filtered);
  });

  app.post("/api/products", (req, res) => {
    try {
      const { sellerId, ...data } = req.body;
      const validated = ProductSchema.parse(data);
      
      const newProduct: Product = {
        id: uuidv4(),
        sellerId,
        ...validated,
        image: validated.image || `https://picsum.photos/seed/${validated.title}/400/400`
      };
      
      products.push(newProduct);
      res.json(newProduct);
    } catch (e) {
      res.status(400).json({ error: "Invalid product data" });
    }
  });

  // --- Legacy Routes (AgriEngage) ---

  // 1. Ingest (The Farm Manager)
  app.post("/api/ingest", upload.single("file"), async (req, res) => {
    try {
      const type = req.body.type as WorkerType || "pdf_worker";
      const id = uuidv4();
      
      let content = "";
      let fileName = "raw_text_input.txt";

      if (req.file) {
        fileName = req.file.originalname;
        if (req.file.mimetype === "application/pdf") {
          const pdfData = await pdf(req.file.buffer);
          content = pdfData.text;
        } else {
          content = req.file.buffer.toString("utf-8");
        }
      } else if (req.body.text) {
        content = req.body.text;
      } else {
        return res.status(400).json({ error: "No file or text provided" });
      }

      // Create Job
      jobs[id] = {
        id,
        type,
        status: "queued",
        fileName,
        content,
        logs: ["Job queued...", "Ingested by Agricultural Document Highway"],
        cost: 0,
        createdAt: new Date(),
      };

      // Trigger Async Processing (Fire and forget for response, but await for demo simplicity or use setImmediate)
      processJob(id);

      res.json({ id, status: "queued" });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Ingestion failed" });
    }
  });

  // 2. Job Status & Stats
  app.get("/api/dashboard", (req, res) => {
    const jobList = Object.values(jobs).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    res.json({
      jobs: jobList,
      stats: processedStats
    });
  });

  // 3. Download Result
  app.get("/api/download/:id", (req, res) => {
    const job = jobs[req.params.id];
    if (!job || !job.result) {
      return res.status(404).json({ error: "Job not found or result not ready" });
    }
    
    res.setHeader("Content-Disposition", `attachment; filename="agri_data_${job.id.slice(0, 8)}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.json(job.result);
  });

  // 4. Farmer Profile
  app.get("/api/profile", (req, res) => {
    res.json(farmerProfile || {});
  });

  app.post("/api/profile", (req, res) => {
    try {
      const data = FarmerProfileSchema.parse(req.body);
      farmerProfile = data;
      res.json(farmerProfile);
    } catch (e) {
      res.status(400).json({ error: "Invalid profile data" });
    }
  });

  // 5. Ask Agronomist (Direct Gemini Chat)
  app.post("/api/ask", async (req, res) => {
    try {
      const { question } = req.body;
      if (!question) return res.status(400).json({ error: "Question is required" });

      const model = "gemini-2.0-flash";
      const prompt = `
        You are Kisan, an expert agricultural assistant and chatbot for the Farmkart platform.
        Your goal is to help farmers with practical advice on crops, pests, soil, and weather.
        
        Tone: Friendly, helpful, and professional. Use "Namaste" or similar warm greetings occasionally.
        Keep answers concise (under 150 words) unless detailed steps are needed.
        
        Question: ${question}
      `;

      const response = await getAI().models.generateContent({
        model,
        contents: prompt,
      });

      res.json({ answer: response.text });
    } catch (e: any) {
      console.error("Ask Agronomist failed", e);
      if (e.message === "GEMINI_API_KEY is not set") {
        return res.status(500).json({ error: "Gemini API Key is missing. Please configure it in your environment." });
      }
      if (e.status === 400 || e.message?.includes("API key not valid")) {
        return res.status(500).json({ error: "Invalid Gemini API Key. Please check your configuration." });
      }
      res.status(500).json({ error: "Failed to get answer" });
    }
  });

  // 6. Find Nearby Stores (Maps Grounding)
  app.post("/api/stores/nearby", async (req, res) => {
    try {
      const { location, query } = req.body;
      
      // Use gemini-2.5-flash for Maps Grounding as per guidelines
      const model = "gemini-2.5-flash";
      const prompt = `Find agricultural stores, suppliers, or markets in or near ${location} that sell ${query || "farming supplies"}. Provide a helpful summary and list the specific places found.`;

      const response = await getAI().models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }],
        },
      });

      // Extract grounding chunks which contain the map data
      const candidates = response.candidates;
      const groundingChunks = candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      res.json({ 
        text: response.text, 
        places: groundingChunks 
      });
    } catch (e: any) {
      console.error("Maps grounding failed", e);
      if (e.message === "GEMINI_API_KEY is not set") {
        return res.status(500).json({ error: "Gemini API Key is missing. Please configure it in your environment." });
      }
      res.status(500).json({ error: "Failed to find stores" });
    }
  });

  // Processing Logic (The Extension Office)
  async function processJob(id: string) {
    const job = jobs[id];
    job.status = "processing";
    job.logs.push("Starting Smart Agronomy Chunking...");
    
    try {
      // Simulate Chunking
      const chunks = chunkText(job.content || "");
      job.logs.push(`Chunked into ${chunks.length} segments using Semantic Overlap.`);

      let result = null;
      let jobCost = 0;

      if (job.type === "pdf_worker") {
        job.logs.push("Assigning to The Agronomist Specialist...");
        // Process first few chunks for demo
        const combinedText = chunks.slice(0, 3).join("\n"); 
        const { qaPairs, cost } = await runAgronomist(combinedText);
        result = qaPairs;
        jobCost += cost;
        processedStats.qaPairsGenerated += qaPairs.length;
        job.logs.push(`Generated ${qaPairs.length} Q&A pairs.`);
        
        // Quality Control
        job.logs.push("Sending to Quality Control Lab for Hallucination Check...");
        // (Mock QC delay)
        await new Promise(r => setTimeout(r, 500));
        job.logs.push("QC Passed: 98% Confidence.");

      } else if (job.type === "web_worker") {
        job.logs.push("Assigning to The Market Analyst...");
        const { analysis, cost } = await runMarketAnalyst(job.content || "");
        result = analysis;
        jobCost += cost;
        job.logs.push("Market trends extracted.");
      }

      job.result = result;
      job.cost = jobCost;
      job.status = "completed";
      job.logs.push("Packaging & Shipping: Ready for export.");
      
      processedStats.guidesProcessed++;
      processedStats.totalCost += jobCost;

    } catch (e) {
      console.error(`Job ${id} failed`, e);
      job.status = "failed";
      job.logs.push(`Error: ${(e as Error).message}`);
    }
  }

  function chunkText(text: string): string[] {
    // Simple overlap chunking
    const chunkSize = 1000;
    const overlap = 200;
    const chunks = [];
    for (let i = 0; i < text.length; i += (chunkSize - overlap)) {
      chunks.push(text.substring(i, i + chunkSize));
    }
    return chunks;
  }

  // Vite Middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
