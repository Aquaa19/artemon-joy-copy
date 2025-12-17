// Filename: src/components/layout/Navbar.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingCart, LogOut, Heart, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // State to track if navbar is over the footer
  const [isFooterOverlap, setIsFooterOverlap] = useState(false);
  
  const { user, logout } = useAuth();
  const { getCartCount, wishlist } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === '/';
  const showWhiteNav = scrolled; 

  useEffect(() => {
    const handleScroll = () => {
      // 1. Handle background glass effect
      setScrolled(window.scrollY > 20);

      // 2. Handle Footer Overlap Detection
      const footer = document.querySelector('footer');
      if (footer) {
        const footerRect = footer.getBoundingClientRect();
        // If footer is roughly near the top (navbar height is ~70px)
        if (footerRect.top < 70) { 
           setIsFooterOverlap(true);
        } else {
           setIsFooterOverlap(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setScrolled(window.scrollY > 20);
    setIsFooterOverlap(false); // Reset on route change
  }, [location]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
      setIsOpen(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  // --- DYNAMIC COLOR LOGIC ---
  // If Over Footer OR At Top: Text is White
  // If Scrolled (Middle of page): Text is Black
  const textColor = (isFooterOverlap || !showWhiteNav) ? 'text-white drop-shadow-sm' : 'text-gray-900';
  
  // "Joy" Text Color logic
  const brandColor = (isFooterOverlap || !showWhiteNav) ? 'text-white' : 'text-primary';

  const hoverColor = showWhiteNav ? 'hover:text-primary' : 'hover:text-white/80';
  const iconColor = (isFooterOverlap || !showWhiteNav) ? 'text-white' : 'text-gray-600';
  
  // Search Bar logic
  const searchBg = (showWhiteNav && !isFooterOverlap) 
    ? 'bg-gray-100 focus-within:bg-white border-transparent focus-within:border-primary/50' 
    : 'bg-white/20 text-white placeholder-white/70 focus-within:bg-white/30 border-transparent';

  return (
    <nav className={`fixed w-full top-0 z-50 transition-all duration-300 
      ${showWhiteNav 
        ? 'glass-prism py-2 shadow-sm' 
        : `${isHome ? 'bg-transparent' : 'bg-primary'} py-5`
      }`
    }>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-primary rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity"></div>
              <img src="/artemon_joy_logo.png" alt="Artemon Joy" className="relative h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm" />
            </div>
            
            <span className={`font-bold text-xl tracking-tight transition-colors hidden sm:block ${textColor}`}>
              Artemon <span className={brandColor}>Joy</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex space-x-6 lg:space-x-8 items-center">
            {[
              { label: 'Home', path: '/' },
              { label: 'Shop', path: '/shop' },
              { label: 'Trending', path: '/shop?category=trending' },
              { label: 'New Arrivals', path: '/new-arrivals' }
            ].map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link 
                  key={item.label} 
                  to={item.path} 
                  className={`text-sm font-medium transition-colors relative group ${isActive ? 'text-secondary font-extrabold' : `${textColor} ${hoverColor}`}`}
                >
                  {item.label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-secondary transition-all duration-300 ${isActive ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </Link>
              );
            })}
          </div>

          {/* Search Bar (Desktop) */}
          <div className="hidden md:block flex-1 max-w-xs mx-4">
             <form onSubmit={handleSearch} className={`relative rounded-full transition-all border ${searchBg}`}>
               {/* MODIFIED INPUT CLASS: Sets both text color and placeholder color dynamically */}
                <input 
                  type="text" 
                  placeholder="Search toys..." 
                  className={`w-full pl-4 pr-10 py-1.5 bg-transparent rounded-full text-sm outline-none 
                    ${isFooterOverlap || !showWhiteNav 
                      ? 'text-white placeholder-white/70' 
                      : 'text-gray-900 placeholder-gray-500'
                    }`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-2 top-1.5 p-0.5 hover:text-primary transition-colors">
                  <Search className={`w-4 h-4 ${isFooterOverlap || !showWhiteNav ? 'text-white' : 'text-gray-500'}`} />
                </button>
             </form>
          </div>

          {/* Icons & Actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            
            <Link to="/favorites" className={`p-2 rounded-full transition-all relative group ${iconColor} hover:bg-black/5`}>
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-[10px] font-bold text-white flex items-center justify-center rounded-full shadow-sm">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <Link to="/cart" className={`p-2 rounded-full transition-all relative group ${iconColor} hover:bg-black/5`}>
              <ShoppingCart className="h-5 w-5" />
              {getCartCount() > 0 && (
                <span className="absolute top-0 right-0 h-4 w-4 bg-secondary text-[10px] font-bold text-white flex items-center justify-center rounded-full shadow-sm animate-bounce">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {user ? (
              <div className={`flex items-center gap-2 pl-2 border-l ${showWhiteNav && !isFooterOverlap ? 'border-gray-200' : 'border-white/30'}`}>
                {user.role === 'admin' && (
                   <Link to="/admin" className={`text-sm font-bold hover:underline mr-2 ${textColor}`}>Admin</Link>
                )}
                <Link to="/profile" className={`text-sm font-medium hover:underline ${textColor}`}>
                  {user.displayName?.split(' ')[0] || 'Account'}
                </Link>
                <button onClick={handleLogout} className={`p-2 rounded-full hover:text-red-500 transition-colors ${iconColor}`}>
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link to="/login" className={`ml-2 font-semibold px-5 py-2 rounded-full text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all active:scale-95 ${showWhiteNav && !isFooterOverlap ? 'bg-primary text-white' : 'bg-white text-primary'}`}>
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <Link to="/cart" className={`relative ${iconColor}`}>
               <ShoppingCart className="h-6 w-6" />
               {getCartCount() > 0 && (
                 <span className="absolute top-0 right-0 h-4 w-4 bg-secondary text-[10px] font-bold text-white flex items-center justify-center rounded-full">
                   {getCartCount()}
                 </span>
               )}
            </Link>
            <button onClick={() => setIsOpen(!isOpen)} className={`p-2 rounded-md focus:outline-none ${iconColor}`}>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden bg-white/95 backdrop-blur-md border-t border-gray-100 absolute w-full transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[30rem] opacity-100 shadow-xl' : 'max-h-0 opacity-0 overflow-hidden'}`}>
        <div className="px-4 py-4 space-y-2">
          
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="mb-4">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-full pl-4 pr-10 py-2 bg-gray-100 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="absolute right-3 top-2 text-gray-400"><Search className="w-4 h-4"/></button>
             </div>
          </form>

          <Link to="/" className="block px-3 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-primary-light/50 hover:text-primary">Home</Link>
          <Link to="/shop" className="block px-3 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-primary-light/50 hover:text-primary">Shop</Link>
          <Link to="/new-arrivals" className="block px-3 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-primary-light/50 hover:text-primary">New Arrivals</Link>
          <Link to="/favorites" className="block px-3 py-2 rounded-lg text-base font-medium text-gray-900 hover:bg-primary-light/50 hover:text-primary">Favorites ({wishlist.length})</Link>
          
          <div className="border-t border-gray-100 my-2 pt-2">
            {user ? (
              <>
                {user.role === 'admin' && <Link to="/admin" className="block px-3 py-2 font-bold text-primary">Admin Dashboard</Link>}
                <Link to="/profile" className="block px-3 py-2 text-gray-600">My Profile</Link>
                <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-500">Sign Out</button>
              </>
            ) : (
              <Link to="/login" className="block text-center px-3 py-3 rounded-lg text-base font-bold bg-primary text-white shadow-md">Sign In</Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}