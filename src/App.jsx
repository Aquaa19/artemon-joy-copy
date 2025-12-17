// Filename: src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import ScrollToTop from './components/layout/ScrollToTop'; 
import AdminLayout from './layouts/AdminLayout';

// Shop Pages
import Home from './pages/shop/Home';
import Shop from './pages/shop/Shop'; 
import ProductDetail from './pages/shop/ProductDetail';
import Cart from './pages/shop/Cart';
import Checkout from './pages/shop/Checkout'; 			
import OrderSuccess from './pages/shop/OrderSuccess'; 
import Favorites from './pages/shop/Favorites'; // <--- NEW IMPORT: Import the Favorites page

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Profile from './pages/auth/Profile';

// Support Pages
import { TrackOrder, ShippingInfo, Returns, FAQ, Privacy } from './pages/support/SupportPages'; 

// Admin Pages
import Dashboard from './pages/admin/Dashboard';
import Inventory from './pages/admin/Inventory';
import Orders from './pages/admin/Orders';
import Users from './pages/admin/Users';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            
            {/* PUBLIC ROUTES */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/trending" element={<Shop trendingOnly={true} />} />
              <Route path="/new-arrivals" element={<Shop newArrivalsOnly={true} />} />
              
              {/* FIXED ROUTE: Use the dedicated Favorites component */}
              <Route path="/favorites" element={<Favorites />} /> 

              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order-success" element={<OrderSuccess />} />
              
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />

              {/* Support Routes */}
              <Route path="/track-order" element={<TrackOrder />} />
              <Route path="/shipping" element={<ShippingInfo />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/privacy" element={<Privacy />} />
            </Route>

            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<Inventory />} />
              <Route path="orders" element={<Orders />} />
              <Route path="users" element={<Users />} />
            </Route>

          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;