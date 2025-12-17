// Filename: src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext'; // <-- NEW IMPORT

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

// Helper to fetch wishlist from server
const fetchServerWishlist = async (email) => {
    try {
        const res = await fetch(`/api/favorites/${email}`);
        if (!res.ok) throw new Error('Failed to fetch server wishlist');
        const json = await res.json();
        return json.data || [];
    } catch (e) {
        console.error("Error fetching server wishlist:", e);
        return [];
    }
};

// Helper to sync wishlist to server (used on login/logout)
const syncWishlistToServer = async (email, wishlist) => {
    try {
        const product_ids = wishlist.map(p => p.id);
        const res = await fetch('/api/favorites/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_email: email, product_ids }),
        });
        if (!res.ok) throw new Error('Failed to sync wishlist to server');
    } catch (e) {
        console.error("Error syncing wishlist to server:", e);
    }
};

// Helper for guest persistence
const getGuestWishlist = () => {
    try {
        const stored = localStorage.getItem('wishlist_guest');
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
};

const saveGuestWishlist = (wishlist) => {
    localStorage.setItem('wishlist_guest', JSON.stringify(wishlist));
};


export function CartProvider({ children }) {
  const { user, loading: authLoading } = useAuth(); // <-- USE AUTH HOOK
  
  const [cartItems, setCartItems] = useState(() => {
    // Keep cart logic the same (localStorage)
    try {
      const stored = localStorage.getItem('cart');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  });

  // NEW: Wishlist state initialized to empty, loaded in useEffect
  const [wishlist, setWishlist] = useState([]);
  const [wishlistLoading, setWishlistLoading] = useState(true);

  // Cart persistence (unmodified)
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);


  // Wishlist Synchronization Effect: Loads/Syncs data based on user status
  useEffect(() => {
    if (authLoading) return;

    const loadWishlist = async () => {
        setWishlistLoading(true);
        if (user) {
            // 1. Logged-in user: Fetch from server and check for guest data
            const serverList = await fetchServerWishlist(user.email);
            const guestList = getGuestWishlist();

            if (guestList.length > 0) {
                // Merge: combine unique products from server and guest
                const serverIds = new Set(serverList.map(p => p.id));
                const mergedList = [...serverList];
                
                guestList.forEach(guestProduct => {
                    if (!serverIds.has(guestProduct.id)) {
                        mergedList.push(guestProduct);
                    }
                });

                setWishlist(mergedList);
                // Save the merged list back to the server, clearing guest storage
                await syncWishlistToServer(user.email, mergedList);
                localStorage.removeItem('wishlist_guest');
            } else {
                setWishlist(serverList);
            }
        } else {
            // 2. Guest user: Load from local storage
            setWishlist(getGuestWishlist());
        }
        setWishlistLoading(false);
    };

    loadWishlist();

  }, [user, authLoading]); 

  // Guest Wishlist Persistence: Only update local storage if user is not logged in
  useEffect(() => {
    // Save to local storage only if it's a guest user (or initial load is done)
    if (!user && !wishlistLoading) {
      saveGuestWishlist(wishlist);
    }
  }, [wishlist, user, wishlistLoading]);


  // --- CART FUNCTIONS (Unmodified) ---
  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return;
    setCartItems(prev => prev.map(item => (item.id === id ? { ...item, quantity } : item)));
  };

  const getCartCount = () => cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('cart');
  };

  // --- WISHLIST FUNCTIONS (MODIFIED) ---
  const toggleWishlist = async (product) => {
    const isCurrentlyInList = isInWishlist(product.id);
    const newWishlist = isCurrentlyInList 
        ? wishlist.filter(item => item.id !== product.id)
        : [...wishlist, product];

    setWishlist(newWishlist);

    if (user) {
        // Logged-in: Call server API
        const endpoint = isCurrentlyInList ? '/api/favorites' : '/api/favorites';
        const method = isCurrentlyInList ? 'DELETE' : 'POST';
        
        try {
            await fetch(endpoint, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_email: user.email, product_id: product.id }),
            });
        } catch (e) {
            console.error(`Failed to sync favorite change to server: ${e.message}`);
        }
    } 
    // Guest: persistence happens via the useEffect hook
  };

  const isInWishlist = (id) => {
    return wishlist.some(item => item.id === id);
  };

  return (
    <CartContext.Provider value={{ 
      cartItems, addToCart, removeFromCart, updateQuantity, getCartCount, getCartTotal, clearCart,
      wishlist, toggleWishlist, isInWishlist, wishlistLoading
    }}>
      {children}
    </CartContext.Provider>
  );
}