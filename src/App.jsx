// Filename: src/App.jsx
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ProductModalProvider } from './context/ProductModalContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import AdminLayout from './layouts/AdminLayout';

// Pages
import Home from './pages/shop/Home';
import Shop from './pages/shop/Shop';
import ProductDetail from './pages/shop/ProductDetail';
import Cart from './pages/shop/Cart';
import Checkout from './pages/shop/Checkout';
import OrderSuccess from './pages/shop/OrderSuccess';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/auth/Profile';
import Dashboard from './pages/admin/Dashboard';
import Inventory from './pages/admin/Inventory';
import Orders from './pages/admin/Orders';
import Users from './pages/admin/Users';
import Favorites from './pages/shop/Favorites';

// Support Pages
import { TrackOrder, ShippingInfo, Returns, FAQ, Privacy } from './pages/support/SupportPages';

// Components
import ScrollToTop from './components/layout/ScrollToTop';
import ProductQuickViewModal from './components/product/ProductQuickViewModal';
import LoadingScreen from './components/layout/LoadingScreen';

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      try {
        if (document.readyState !== 'complete') {
          await new Promise(resolve => {
             const handler = () => {
                window.removeEventListener('load', handler);
                resolve();
             };
             window.addEventListener('load', handler);
             setTimeout(resolve, 3000); 
          });
        }

        const preloadImages = [
          '/artemon_joy_banner.png', 
          '/artemon_joy_logo.png'
        ];

        const imagePromises = preloadImages.map(src => {
          return new Promise((resolve) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = resolve; 
          });
        });

        await Promise.all([
          ...imagePromises,
          new Promise(resolve => setTimeout(resolve, 1500)) 
        ]);

      } catch (err) {
        console.error("Loading error:", err);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <AuthProvider>
      <CartProvider>
        <ProductModalProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                
                {/* --- RESTORED MISSING ROUTES --- */}
                <Route path="trending" element={<Shop trendingOnly={true} />} />
                <Route path="new-arrivals" element={<Shop newArrivalsOnly={true} />} />

                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="cart" element={<Cart />} />
                <Route path="favorites" element={<Favorites />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="profile" element={<Profile />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="order-success" element={<OrderSuccess />} />
                
                {/* Support Routes */}
                <Route path="track-order" element={<TrackOrder />} />
                <Route path="shipping" element={<ShippingInfo />} />
                <Route path="returns" element={<Returns />} />
                <Route path="faq" element={<FAQ />} />
                <Route path="privacy" element={<Privacy />} />
              </Route>

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="orders" element={<Orders />} />
                <Route path="users" element={<Users />} />
              </Route>
            </Routes>

            {/* Global Modal */}
            <ProductQuickViewModal />
          </Router>
        </ProductModalProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;