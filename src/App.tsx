import React, { useState, useEffect, type ChangeEvent } from "react";
import { 
  LayoutDashboard, 
  Search, 
  ShoppingCart, 
  User, 
  Store, 
  Plus, 
  Package, 
  LogOut,
  Menu,
  X,
  Filter,
  Tag,
  Sprout,
  MessageSquare,
  MapPin,
  MessageCircle,
  ChevronRight,
  Send,
  IndianRupee,
  TrendingUp
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { User as UserType, Product, CartItem } from "./types";
import ReactMarkdown from "react-markdown";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const MarkdownComponents = {
  h1: ({...props}) => <h1 className="text-xl font-bold mb-2 text-slate-900" {...props} />,
  h2: ({...props}) => <h2 className="text-lg font-bold mb-2 text-slate-900" {...props} />,
  h3: ({...props}) => <h3 className="text-md font-bold mb-1 text-slate-900" {...props} />,
  p: ({...props}) => <p className="mb-3 text-slate-700 leading-relaxed" {...props} />,
  ul: ({...props}) => <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-700" {...props} />,
  ol: ({...props}) => <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-700" {...props} />,
  li: ({...props}) => <li className="" {...props} />,
  a: ({...props}) => <a className="text-emerald-600 hover:underline font-medium" {...props} />,
  strong: ({...props}) => <strong className="font-semibold text-slate-900" {...props} />,
};

function NearbyStoresModal({ onClose }: { onClose: () => void }) {
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ text: string; places: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/stores/nearby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, query })
      });
      const data = await res.json();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
          <div className="flex items-center gap-2 text-emerald-800">
            <MapPin className="w-5 h-5" />
            <h3 className="font-bold">Find Nearby Suppliers</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-100 rounded-full text-emerald-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Your Location</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g., Fresno, CA or 93721"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Looking For (Optional)</label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., Organic Fertilizer, Tractor Parts"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Searching Maps...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Find Stores
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <ReactMarkdown components={MarkdownComponents}>{result.text}</ReactMarkdown>
              </div>
              
              {result.places && result.places.length > 0 && (
                <div className="grid gap-4">
                  <h4 className="font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Locations Found
                  </h4>
                  {result.places.map((chunk: any, i: number) => {
                    if (!chunk.web?.uri) return null;
                    return (
                      <a 
                        key={i} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-4 border border-slate-200 rounded-xl hover:bg-white hover:shadow-md transition-all group bg-white"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h5 className="font-semibold text-emerald-700 group-hover:underline text-lg">
                              {chunk.web.title}
                            </h5>
                            <p className="text-xs text-slate-400 mt-1 truncate max-w-md">{chunk.web.uri}</p>
                          </div>
                          <div className="p-2 bg-slate-100 rounded-full group-hover:bg-emerald-50 transition-colors">
                            <MapPin className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )}

              <button 
                onClick={() => setResult(null)}
                className="w-full py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
              >
                Search Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AskAgronomistModal({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question })
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch (e) {
      setAnswer("Sorry, I couldn't get an answer right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
          <div className="flex items-center gap-2 text-emerald-800">
            <Sprout className="w-5 h-5" />
            <h3 className="font-bold">Ask the Agronomist</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-emerald-100 rounded-full text-emerald-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {answer ? (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg text-slate-700 border border-slate-100">
                <p className="font-medium text-xs text-slate-400 uppercase mb-1">You Asked</p>
                {question}
              </div>
              <div className="mt-4">
                <p className="font-medium text-xs text-emerald-600 uppercase mb-2">Agronomist Answer</p>
                <div className="text-slate-800">
                  <ReactMarkdown components={MarkdownComponents}>{answer}</ReactMarkdown>
                </div>
              </div>
              <button 
                onClick={() => { setAnswer(""); setQuestion(""); }}
                className="w-full py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 mt-4"
              >
                Ask Another Question
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                What's on your mind?
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="E.g., How do I treat aphids on my tomato plants?"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none min-h-[120px] mb-4 resize-none"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Consulting AI...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Get Advice
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Navbar({ 
  user, 
  cartCount, 
  onLogout, 
  onCartClick,
  onSearch,
  onAskAgronomist,
  onFindStores
}: { 
  user: UserType | null, 
  cartCount: number, 
  onLogout: () => void, 
  onCartClick: () => void,
  onSearch: (q: string) => void,
  onAskAgronomist: () => void,
  onFindStores: () => void
}) {
  return (
    <nav className="bg-slate-900 text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">AgriMarket</span>
          </div>

          {/* Search Bar (Consumer Only) */}
          {user?.role !== "seller" && (
            <div className="flex-1 max-w-2xl mx-8 hidden md:block">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-transparent rounded-lg leading-5 bg-slate-800 text-slate-300 placeholder-slate-400 focus:outline-none focus:bg-white focus:text-slate-900 sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Search for seeds, fertilizers, equipment..."
                  onChange={(e) => onSearch(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <button
                  onClick={onFindStores}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-full text-sm font-medium hover:bg-slate-700 transition-colors"
                >
                  <MapPin className="w-4 h-4" />
                  Find Stores
                </button>

                <button
                  onClick={onAskAgronomist}
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                >
                  <Sprout className="w-4 h-4" />
                  Ask AI
                </button>

                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {user.role === "seller" ? user.storeName : `Hello, ${user.name}`}
                  </span>
                </div>
                
                {user.role === "consumer" && (
                  <button 
                    onClick={onCartClick}
                    className="relative p-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <ShoppingCart className="w-6 h-6" />
                    {cartCount > 0 && (
                      <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-emerald-500 rounded-full">
                        {cartCount}
                      </span>
                    )}
                  </button>
                )}

                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-300 hover:text-white transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <span className="text-sm text-slate-400">Guest</span>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

const ProductCard: React.FC<{ product: Product; onAddToCart?: (p: Product) => void }> = ({ product, onAddToCart }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group flex flex-col h-full">
      <div className="aspect-[4/3] relative overflow-hidden">
        <img 
          src={product.image} 
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-slate-800 px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider shadow-sm">
          {product.category}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-slate-900 mb-1 line-clamp-1">{product.title}</h3>
        
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Prices starting from</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-slate-900">
                  ₹{product.price.toFixed(0)}
                </span>
                {product.originalPrice && (
                  <span className="text-slate-400 text-sm line-through decoration-slate-400">
                    ₹{product.originalPrice.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {onAddToCart && (
            <button 
              onClick={() => onAddToCart(product)}
              className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Buy Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthScreen({ onLogin }: { onLogin: (user: UserType) => void }) {
  const [role, setRole] = useState<"consumer" | "seller">("consumer");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role })
      });
      const user = await res.json();
      localStorage.setItem("agri_user", JSON.stringify(user));
      onLogin(user);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Store className="w-7 h-7 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-900 mb-2">Welcome to AgriMarket</h2>
          <p className="text-center text-slate-500 mb-8">The premier marketplace for agricultural goods.</p>

          {/* Role Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex mb-8">
            <button
              onClick={() => setRole("consumer")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                role === "consumer" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              I'm a Buyer
            </button>
            <button
              onClick={() => setRole("seller")}
              className={cn(
                "flex-1 py-2 text-sm font-medium rounded-lg transition-all",
                role === "seller" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              )}
            >
              I'm a Seller
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                placeholder="name@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : `Sign in as ${role === "seller" ? "Seller" : "Buyer"}`}
            </button>
          </form>
        </div>
        <div className="bg-slate-50 p-4 text-center text-xs text-slate-400">
          By signing in, you agree to our Terms of Service.
        </div>
      </div>
    </div>
  );
}

function SellerDashboard({ user }: { user: UserType }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const fetchProducts = async () => {
    const res = await fetch(`/api/products?sellerId=${user.id}`);
    const json = await res.json();
    setProducts(json);
  };

  useEffect(() => {
    fetchProducts();
  }, [user.id]);

  const handleAddProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      sellerId: user.id,
      title: formData.get("title"),
      description: formData.get("description"),
      price: Number(formData.get("price")),
      category: formData.get("category"),
      stock: Number(formData.get("stock")),
    };

    await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    
    setIsAdding(false);
    fetchProducts();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Seller Dashboard</h1>
          <p className="text-slate-500">Manage your inventory and listings.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Products Sold</p>
            <h3 className="text-2xl font-bold text-slate-900">1,248</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Revenue</p>
            <h3 className="text-2xl font-bold text-slate-900">₹45,200</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Average Order Value</p>
            <h3 className="text-2xl font-bold text-slate-900">₹3,200</h3>
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="mb-8 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">New Listing</h2>
          <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Product Title</label>
              <input name="title" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea name="description" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Price ($)</label>
              <input name="price" type="number" step="0.01" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Stock Quantity</label>
              <input name="stock" type="number" required className="w-full px-3 py-2 border border-slate-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select name="category" className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white">
                <option>Seeds</option>
                <option>Fertilizers</option>
                <option>Equipment</option>
                <option>Pesticides</option>
              </select>
            </div>
            <div className="col-span-2 flex justify-end gap-3 mt-2">
              <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">Publish Listing</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(p => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}

function CategoriesSection() {
  const categories = [
    { name: "Nutrients", image: "https://picsum.photos/seed/nutrients/100/100" },
    { name: "Fungicides", image: "https://picsum.photos/seed/fungicides/100/100" },
    { name: "Insecticides", image: "https://picsum.photos/seed/insecticides/100/100" },
    { name: "Seeds", image: "https://picsum.photos/seed/seeds/100/100" },
    { name: "Weedicides", image: "https://picsum.photos/seed/weedicides/100/100" },
    { name: "Tissue Culture", image: "https://picsum.photos/seed/tissue/100/100" },
  ];

  return (
    <div className="mb-12">
      <div className="flex flex-wrap justify-center gap-8 md:gap-12">
        {categories.map((cat, idx) => (
          <div key={idx} className="flex flex-col items-center gap-3 cursor-pointer group">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden shadow-sm group-hover:shadow-md transition-all bg-emerald-50 relative">
              <img 
                src={cat.image} 
                alt={cat.name} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {cat.name === "Tissue Culture" && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-white rounded-full p-1 shadow-md z-10 hidden md:block">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>
            <span className="text-slate-700 font-medium text-sm md:text-base">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BannerSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
      {/* WhatsApp Community Banner */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-center min-h-[240px]">
        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            Join our whatsapp community for expert agronomy updates
          </h2>
          <button className="bg-[#65D46E] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-[#5bc263] transition-colors w-fit">
            Join Now
          </button>
        </div>
        {/* Abstract phone mockup placeholder */}
        <div className="absolute right-[-20px] bottom-[-40px] w-48 h-64 bg-slate-800 rounded-3xl border-4 border-slate-700 transform rotate-[-10deg] opacity-50 md:opacity-100"></div>
      </div>

      {/* App Download Banner */}
      <div className="bg-[#65D46E] rounded-2xl p-8 text-white relative overflow-hidden flex flex-col justify-center min-h-[240px]">
        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            Access more features and products through Farmkart app
          </h2>
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-slate-800 transition-colors w-fit">
            Download Now
          </button>
        </div>
        {/* Abstract phone mockup placeholder */}
        <div className="absolute right-[-20px] bottom-[-40px] w-48 h-64 bg-emerald-600 rounded-3xl border-4 border-emerald-500 transform rotate-[-10deg] opacity-50 md:opacity-100"></div>
      </div>
    </div>
  );
}

function KisanChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Namaste! I am Kisan, your farming assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Ref for auto-scrolling
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMsg })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.answer }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', text: "Sorry, I am having trouble connecting right now." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-all hover:scale-110 flex items-center gap-2 group"
        >
          <MessageSquare className="w-6 h-6" />
          <span className="font-bold hidden group-hover:inline max-w-0 group-hover:max-w-xs overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap">Ask Kisan</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[90vw] md:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[600px] h-[500px] animate-in slide-in-from-bottom-10 fade-in duration-300">
          {/* Header */}
          <div className="bg-emerald-600 p-4 flex justify-between items-center text-white shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/30">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Kisan Assistant</h3>
                <p className="text-xs text-emerald-100 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] p-3 rounded-2xl text-sm shadow-sm",
                  msg.role === 'user'
                    ? "bg-emerald-600 text-white rounded-tr-none"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                )}>
                  <ReactMarkdown components={{
                    ...MarkdownComponents,
                    p: ({...props}) => <p className="mb-1 last:mb-0 leading-relaxed" {...props} />,
                    ul: ({...props}) => <ul className="list-disc pl-4 mb-1 space-y-1" {...props} />,
                    li: ({...props}) => <li className="" {...props} />,
                  }}>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1.5 items-center">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-75" />
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce delay-150" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about crops, weather..."
              className="flex-1 px-4 py-3 border border-slate-200 rounded-full focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 shadow-sm"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function ConsumerStorefront({ user, onAddToCart }: { user: UserType, onAddToCart: (p: Product) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      const res = await fetch(`/api/products?search=${search}`);
      const json = await res.json();
      setProducts(json);
    };
    // Debounce could be added here
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Customer Marketplace</h1>
        <p className="text-slate-500">Buy fresh produce, vegetables, and grains directly from farmers at wholesale prices.</p>
      </div>

      <div className="relative rounded-2xl overflow-hidden mb-12 h-[300px]">
        <img 
          src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?q=80&w=2070&auto=format&fit=crop" 
          alt="Wholesale Savings" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 flex flex-col justify-center p-12">
          <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full w-fit mb-4 uppercase tracking-wider">Super Saver Deals</span>
          <h2 className="text-5xl font-bold text-white mb-4">Wholesale Savings</h2>
          <p className="text-xl text-white/90">Compare farmer deals & save money</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-medium whitespace-nowrap">All</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 whitespace-nowrap">Vegetables</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 whitespace-nowrap">Fruits</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 whitespace-nowrap">Grains</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-full text-sm font-medium hover:bg-slate-50 whitespace-nowrap">Staples</button>
        </div>
        <div className="relative hidden md:block w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search products..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {products.map(p => (
          <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
        ))}
      </div>

      <KisanChatbot />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [isStoresOpen, setIsStoresOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("agri_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch (e) {
        localStorage.removeItem("agri_user");
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("agri_user");
    setUser(null);
  };

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar 
        user={user} 
        cartCount={cart.reduce((a, b) => a + b.quantity, 0)} 
        onLogout={handleLogout}
        onCartClick={() => setIsCartOpen(true)}
        onSearch={() => {}} // Handled inside storefront for now
        onAskAgronomist={() => setIsAskOpen(true)}
        onFindStores={() => setIsStoresOpen(true)}
      />

      {user.role === "seller" ? (
        <SellerDashboard user={user} />
      ) : (
        <ConsumerStorefront user={user} onAddToCart={handleAddToCart} />
      )}

      {isAskOpen && <AskAgronomistModal onClose={() => setIsAskOpen(false)} />}
      {isStoresOpen && <NearbyStoresModal onClose={() => setIsStoresOpen(false)} />}

      {/* Cart Sidebar (Consumer) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-bold text-lg">Your Cart</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center text-slate-500 mt-10">Your cart is empty.</div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex gap-4">
                    <img src={item.image} className="w-20 h-20 object-cover rounded-lg bg-slate-100" />
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-500">${item.price.toFixed(2)}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm bg-slate-100 px-2 py-1 rounded">Qty: {item.quantity}</span>
                        <button onClick={() => removeFromCart(item.id)} className="text-red-500 text-xs font-medium">Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50">
              <div className="flex justify-between mb-4 font-bold text-lg">
                <span>Total</span>
                <span>${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
              </div>
              <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">
                Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
