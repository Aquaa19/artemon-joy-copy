// Filename: src/pages/shop/Home.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Truck, Star, Gift, Sparkles } from 'lucide-react';
import ProductCard from '../../components/product/ProductCard';

export default function Home() {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trendingRes, newArrivalsRes] = await Promise.all([
          fetch('/api/products?trending=true'),
          fetch('/api/products?newArrivals=true')
        ]);

        if (trendingRes.ok) {
          const json = await trendingRes.json();
          setTrendingProducts(json.data.slice(0, 4));
        }
        
        if (newArrivalsRes.ok) {
          const json = await newArrivalsRes.json();
          setNewArrivals(json.data.slice(0, 4));
        }

      } catch (error) {
        console.error("Failed to load products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-surface-muted">
      
      {/* Hero Section */}
      <div className="relative bg-primary overflow-hidden pt-20 pb-40 lg:pt-32 lg:pb-56 rounded-b-[3rem] lg:rounded-b-[5rem] shadow-2xl z-10">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light"></div>
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-accent/30 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col-reverse lg:flex-row items-center gap-12">
          
          {/* Text Content */}
          <div className="flex-1 text-center lg:text-left">
            
            {/* New Arrivals Interactive Badge */}
            <Link 
              to="/new-arrivals" 
              className="inline-flex items-center px-4 py-2 rounded-full bg-white/10 text-white text-sm font-bold mb-6 border border-white/20 backdrop-blur-md shadow-lg hover:bg-white/20 hover:scale-105 transition-all cursor-pointer group"
            >
              <Gift className="w-4 h-4 mr-2" /> 
              <span>New Arrivals for 2025</span>
              <ArrowRight className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
            </Link>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
              Playtime Reimagined <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-light to-secondary">With Wonder.</span>
            </h1>
            <p className="mt-4 text-lg text-white/90 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Discover a world of imagination with our curated collection of safe, educational, and wildly fun toys for children of all ages.
            </p>
            
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/shop" className="shine-effect px-8 py-4 rounded-full bg-white text-primary font-bold text-lg shadow-lg hover:shadow-white/20 hover:scale-105 transition-all">
                Shop Collection
              </Link>
              <Link to="/trending" className="px-8 py-4 rounded-full bg-black/20 text-white font-bold text-lg border border-white/30 backdrop-blur-sm hover:bg-black/30 transition-all flex items-center justify-center gap-2">
                View Trending <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Hero Image with Wobble Animation */}
          <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
            <div className="relative z-10 animate-tilt">
              <img
                src="/artemon_joy_banner.png" 
                alt="Artemon Joy Banner"
                // FIXED: Added rounded corners, shadow, and border here!
                className="w-full h-auto object-cover rounded-[2.5rem] shadow-2xl border-4 border-white/30"
                onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=2070&auto=format&fit=crop"; }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <div className="max-w-5xl mx-auto px-4 relative -mt-24 z-20">
        <div className="bg-white rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] p-8 md:p-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center animate-pop-in border border-white/50">
          {[
            { icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50", title: "Safety Certified", desc: "100% Non-toxic materials" },
            { icon: Truck, color: "text-blue-600", bg: "bg-blue-50", title: "Fast Delivery", desc: "Free shipping over $50" },
            { icon: Star, color: "text-amber-500", bg: "bg-amber-50", title: "Parents' Choice", desc: "Trusted by 10k+ families" }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center text-center group cursor-default">
              <div className={`w-16 h-16 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm`}>
                <item.icon className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm font-medium">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-secondary rounded-[3rem] p-8 lg:p-16 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-black/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
                <div className="text-white">
                  <span className="font-bold uppercase tracking-widest text-xs opacity-90">Don't Miss Out</span>
                  <h2 className="text-3xl md:text-5xl font-extrabold mt-2 drop-shadow-sm">Trending Now</h2>
                </div>
                <Link to="/trending" className="group flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-3 rounded-full text-white font-bold hover:bg-white hover:text-secondary transition-all shadow-sm">
                    View all products <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-96 bg-white/20 animate-pulse rounded-3xl"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {trendingProducts.map((product) => (
                      <ProductCard key={product.id} product={product} />
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Arrivals Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
            <div>
              <span className="text-primary font-bold uppercase tracking-widest text-xs flex items-center gap-1">
                <Sparkles className="w-4 h-4" /> Fresh In
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mt-2">New Arrivals</h2>
            </div>
            <Link to="/new-arrivals" className="group flex items-center gap-2 text-gray-500 font-bold hover:text-primary transition-colors">
                View all new toys <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
        </div>

        {loading ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
             {[1,2,3,4].map(i => (
               <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-3xl"></div>
             ))}
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
              ))}
          </div>
        )}
      </div>

    </div>
  );
}