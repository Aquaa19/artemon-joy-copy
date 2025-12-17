// Filename: src/context/ProductModalContext.jsx
import { createContext, useContext, useState } from 'react';

const ProductModalContext = createContext();

export function useProductModal() {
  return useContext(ProductModalContext);
}

export function ProductModalProvider({ children }) {
  const [modalProduct, setModalProduct] = useState(null);

  const openModal = (product) => {
    setModalProduct(product);
    // Optional: Add class to body to prevent scrolling when modal is open
    document.body.style.overflow = 'hidden'; 
  };

  const closeModal = () => {
    setModalProduct(null);
    document.body.style.overflow = 'auto';
  };

  return (
    <ProductModalContext.Provider value={{ modalProduct, openModal, closeModal }}>
      {children}
    </ProductModalContext.Provider>
  );
}