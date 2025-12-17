// Filename: src/components/product/ProductQuickViewModal.jsx (NEW FILE)
import { X, ShoppingCart, Heart, ShieldCheck, Truck, RotateCcw, Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { useProductModal } from '../../context/ProductModalContext';
import { useCart } from '../../context/CartContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function ProductQuickViewModal() {
  const { modalProduct, closeModal } = useProductModal();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  // Reset quantity when a new product is opened
  useEffect(() => {
    setQuantity(1);
  }, [modalProduct]);

  if (!modalProduct) return null;
  
  const product = modalProduct;
  const isFavorite = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    closeModal(); // Close modal after adding to cart
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product);
  };
  
  // Dummy data for the pop-up card's "Reviews, Likes, Comments"
  const dummyActivity = {
      reviews: 45,
      likes: 120,
      comments: 25,
      rating: product.rating || 4.8
  };


  return (
    <div 
      className="fixed inset-0 z-[100] bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity duration-300"
      onClick={closeModal} // Close modal when clicking outside
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform scale-100 transition-transform duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="p-4 lg:p-6 sticky top-0 bg-white z-10 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 line-clamp-1">{product.name}</h2>
            <button 
                onClick={closeModal} 
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition"
            >
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 lg:p-10">
          
          {/* Left Column: Image and Activity */}
          <div className="flex flex-col gap-6">
            
            {/* Full Image */}
            <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                <img 
                    src={product.image || "https://placehold.co/800x800?text=No+Image"} 
                    alt={product.name}
                    className="w-full h-full object-contain"
                />
            </div>

            {/* Reviews, Likes, Comments Panel (As requested in screenshot) */}
            <div className="bg-gray-50 p-4 rounded-2xl shadow-inner border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Community Activity</h3>
                <div className="flex justify-between items-center">
                    
                    {/* Rating */}
                    <div className="flex items-center text-amber-500 font-extrabold text-xl">
                        <Star className="w-5 h-5 fill-current mr-1" /> {dummyActivity.rating}
                    </div>

                    {/* Likes (using ThumbsUp icon) */}
                    <div className="flex items-center gap-1 text-gray-600">
                        <ThumbsUp className="w-4 h-4" />
                        <span className="font-semibold text-sm">{dummyActivity.likes} Likes</span>
                    </div>

                    {/* Comments (using MessageSquare icon) */}
                    <div className="flex items-center gap-1 text-gray-600">
                        <MessageSquare className="w-4 h-4" />
                        <span className="font-semibold text-sm">{dummyActivity.comments} Comments</span>
                    </div>
                </div>
                <Link to={`/product/${product.id}`} className="mt-4 text-primary text-sm font-semibold hover:underline block text-right">
                    Read Full Reviews →
                </Link>
            </div>
          </div>

          {/* Right Column: Product Info and Actions (Simplified Detail) */}
          <div className="flex flex-col justify-between">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-primary-light text-primary text-xs font-bold uppercase tracking-wider">{product.category}</span>
                </div>
                
                <p className="text-gray-500 text-md leading-relaxed mb-6">{product.description || "A wonderful toy designed to spark joy."}</p>
                
                <div className="mb-6 border-b border-gray-100 pb-6">
                    <span className="text-4xl font-extrabold text-gray-900">₹{product.price.toFixed(2)}</span>
                </div>
                
                {/* Trust Features (Copied from ProductDetail) */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    {[
                        { icon: ShieldCheck, title: "Safety Certified" },
                        { icon: Truck, title: "2-Day Delivery" },
                        { icon: RotateCcw, title: "30-Day Returns" },
                        { icon: Star, title: "Warranty Included" }
                    ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-gray-100 rounded-xl">
                            <feat.icon className="w-5 h-5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700">{feat.title}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 items-center pt-4 border-t border-gray-100">
                <div className="flex items-center bg-gray-100 rounded-xl p-1 shrink-0">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition font-bold">-</button>
                    <span className="w-10 text-center font-bold text-gray-900">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-white rounded-lg transition font-bold">+</button>
                </div>
                
                <button 
                    onClick={handleAddToCart}
                    className="shine-effect flex-1 bg-primary hover:bg-primary-hover text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 py-3"
                >
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                </button>
                
                <button 
                    onClick={handleToggleWishlist}
                    className={`p-3 rounded-xl transition-all shadow-md shrink-0
                        ${isFavorite 
                        ? 'bg-red-500 text-white hover:bg-red-600' 
                        : 'border-2 border-gray-100 hover:border-red-200 hover:bg-red-50 hover:text-red-500'
                        }`}
                >
                    <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}