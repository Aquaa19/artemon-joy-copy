// Filename: src/pages/shop/ProductDetail.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw, Star } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(res => res.json())
      .then(data => setProduct(data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><div className="animate-spin rounded-full h-12 w-12 border-t-4 border-primary"></div></div>;
  if (!product) return <div className="min-h-screen flex justify-center items-center">Product not found</div>;

  return (
    <div className="min-h-screen bg-surface-muted pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link to="/shop" className="inline-flex items-center text-gray-500 hover:text-primary mb-8 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Collection
        </Link>

        <div className="bg-white rounded-[2.5rem] p-6 lg:p-10 shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          
          {/* Image */}
          <div className="relative aspect-square bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 group">
            <img 
              src={product.image || "https://placehold.co/600x600?text=No+Image"} 
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              onError={(e) => { e.target.onerror = null; e.target.src = "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?auto=format&fit=crop&q=80&w=600"; }}
            />
            {product.isTrending && (
               <span className="absolute top-6 left-6 bg-accent text-white font-bold px-4 py-2 rounded-full shadow-lg">Trending</span>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-bold uppercase tracking-wider">{product.category}</span>
              <div className="flex items-center text-amber-500 text-sm font-bold ml-auto">
                <Star className="w-4 h-4 fill-current mr-1" /> {product.rating || 4.8} (120+ Reviews)
              </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">{product.name}</h1>
            <p className="text-gray-500 text-lg leading-relaxed mb-8">{product.description || "A wonderful toy designed to spark joy."}</p>

            <div className="flex items-center gap-2 mb-8">
              {/* CHANGED: $ -> ₹ */}
              <span className="text-4xl font-extrabold text-gray-900">₹{product.price.toFixed(2)}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mb-10">
              <div className="flex items-center bg-gray-100 rounded-xl p-1">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition font-bold">-</button>
                <span className="w-12 text-center font-bold text-gray-900">{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition font-bold">+</button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                className="shine-effect flex-1 bg-primary hover:bg-primary-hover text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" /> Add to Cart
              </button>
              
              <button className="p-4 border-2 border-gray-100 rounded-xl hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-all">
                <Heart className="w-6 h-6" />
              </button>
            </div>

            {/* Trust Features */}
            <div className="grid grid-cols-2 gap-4">
               {[
                 { icon: ShieldCheck, title: "Safety Certified" },
                 { icon: Truck, title: "2-Day Delivery" },
                 { icon: RotateCcw, title: "30-Day Returns" },
                 { icon: Star, title: "Warranty Included" }
               ].map((feat, i) => (
                 <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                   <feat.icon className="w-5 h-5 text-gray-400" />
                   <span className="text-sm font-semibold text-gray-700">{feat.title}</span>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}