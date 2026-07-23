import React, { useState } from 'react';
import { ShoppingBag, Lock, Menu as MenuIcon, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useShop } from '../context/ShopContext';
import './Navbar.css';

export const Navbar = ({ onOpenAdmin, activeTab, setActiveTab }) => {
  const { totalItems, subtotal, setIsCartOpen } = useCart();
  const { shopSettings } = useShop();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAccepting = shopSettings?.is_accepting_orders === 1;
  const currency = shopSettings?.currency || 'LBP';

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand Logo */}
        <a href="#home" className="navbar-brand" onClick={() => setActiveTab('menu')}>
          <div className="brand-badge">
            <span className="brand-title">SAADO</span>
            <span className="brand-accent">DROP</span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="navbar-nav">


          {/* Shop Acceptance Status */}
          <div className={`status-pill ${isAccepting ? 'status-open' : 'status-closed'}`}>
            <span className="status-dot"></span>
            <span className="status-text">
              {isAccepting ? 'Accepting Orders' : 'Currently Closed'}
            </span>
          </div>
        </nav>

        {/* Action Controls */}
        <div className="navbar-actions">
          {/* Cart Button */}
          <button
            className="cart-pill-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label="Open Shopping Bag"
          >
            <ShoppingBag size={18} />
            <span className="cart-count">{totalItems}</span>
            {totalItems > 0 && (
              <span className="cart-total-badge">
                {subtotal.toFixed(2)} {currency}
              </span>
            )}
          </button>

          {/* Admin Portal Toggle Button */}
          <button
            className="admin-lock-btn"
            onClick={onOpenAdmin}
            title="Admin Dashboard Portal"
          >
            <Lock size={16} />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-toggle-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay animate-fade-in">

          <button
            className="mobile-nav-link"
            onClick={() => {
              onOpenAdmin();
              setMobileMenuOpen(false);
            }}
          >
            Admin Portal
          </button>
        </div>
      )}
    </header>
  );
};
