import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useShop } from '../context/ShopContext';
import { formatPrice } from '../utils/formatPrice';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { getImageUrl } from '../utils/imageUrl';
import './CartDrawer.css';

export const CartDrawer = () => {
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, isCartOpen, setIsCartOpen } = useCart();
  const { shopSettings } = useShop();
  const { t } = useLanguage();

  const [orderType, setOrderType] = useState('delivery');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);

  const currency = shopSettings?.currency || 'LBP';

  if (!isCartOpen) return null;

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError(null);

    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      setError('Please enter your name and phone number');
      return;
    }

    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setError('Please enter your delivery address');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        order_type: orderType,
        delivery_address: orderType === 'delivery' ? deliveryAddress.trim() : '',
        customer_notes: customerNotes.trim(),
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
      };

      const res = await api.createOrder(payload);
      setCompletedOrder(res.data);
      clearCart();
    } catch (err) {
      console.error('Order creation error:', err);
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsCartOpen(false);
    setCompletedOrder(null);
    setError(null);
  };

  return (
    <div className="cart-drawer-overlay animate-fade-in">
      <div className="cart-drawer-backdrop" onClick={handleClose}></div>

      <div className="cart-drawer-panel surface-card">
        {/* Drawer Header */}
        <div className="cart-drawer-header">
          <div className="drawer-title-group">
            <h2 className="drawer-title">{t('YOUR SELECTION')}</h2>
            <span className="drawer-item-count">{cart.length} {t('ITEMS')}</span>
          </div>
          <button className="drawer-close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Successful Order State */}
        {completedOrder ? (
          <div className="cart-success-view">
            <CheckCircle2 size={54} className="text-gold" />
            <h3 className="success-title">{t('ORDER PLACED!')}</h3>
            <p className="success-subtitle">{t('Order Number:')} <strong>#{completedOrder.order_number}</strong></p>
            <p className="success-text">
              {t('Order success text')}
            </p>

            <div className="delivery-disclaimer-card">
              <span>{t('Delivery fee disclaimer', { subtotal: `${formatPrice(completedOrder.subtotal)} ${currency}` })}</span>
            </div>

            <a
              href={completedOrder.whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gold whatsapp-submit-btn"
            >
              <Send size={18} />
              <span>{t('CONTINUE TO WHATSAPP')}</span>
            </a>

            <button className="btn-outline" onClick={handleClose} style={{ marginTop: '12px' }}>
              {t('Back to Menu')}
            </button>
          </div>
        ) : (
          /* Normal Cart & Checkout Flow */
          <div className="cart-drawer-body">
            {/* Cart Items List */}
            <div className="cart-items-section">
              {cart.length === 0 ? (
                <div className="empty-cart-state">
                  <p>{t('Empty cart text')}</p>
                  <span>{t('Empty cart subtext')}</span>
                </div>
              ) : (
                cart.map(({ product, quantity }) => (
                  <div key={product.id} className="cart-item-row">
                    <img
                      src={getImageUrl(product.image_url)}
                      alt={product.name}
                      className="cart-item-img"
                    />
                    <div className="cart-item-info">
                      <h4 className="cart-item-title">{product.name}</h4>
                      <span className="cart-item-price">
                        {formatPrice(product.price)} {currency}
                      </span>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="cart-item-stepper">
                      <button onClick={() => updateQuantity(product.id, quantity - 1)}>
                        <Minus size={12} />
                      </button>
                      <span>{quantity}</span>
                      <button onClick={() => updateQuantity(product.id, quantity + 1)}>
                        <Plus size={12} />
                      </button>
                    </div>

                    <button
                      className="cart-item-remove"
                      onClick={() => removeFromCart(product.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <form onSubmit={handleSubmitOrder} className="checkout-form-section">
                <div className="delivery-fee-disclaimer">
                  <span>{t('Delivery fee note')}</span>
                </div>

                {error && (
                  <div className="cart-error-banner">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {/* Order Type Toggle */}
                <div className="order-type-selector">
                  <button
                    type="button"
                    className={`type-btn ${orderType === 'delivery' ? 'active' : ''}`}
                    onClick={() => setOrderType('delivery')}
                  >
                    {t('Delivery')}
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${orderType === 'pickup' ? 'active' : ''}`}
                    onClick={() => setOrderType('pickup')}
                  >
                    {t('Pickup')}
                  </button>
                </div>

                <div className="form-group">
                  <label>{t('Full Name *')}</label>
                  <input
                    type="text"
                    required
                    placeholder={t('Enter your full name')}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{t('Phone Number *')}</label>
                  <input
                    type="tel"
                    required
                    placeholder={t('Enter your phone number')}
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                {orderType === 'delivery' && (
                  <div className="form-group">
                    <label>{t('Delivery Address *')}</label>
                    <textarea
                      required
                      placeholder={t('Address placeholder')}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    ></textarea>
                  </div>
                )}

                <div className="form-group">
                  <label>{t('Special Instructions (Optional)')}</label>
                  <input
                    type="text"
                    placeholder={t('Instructions placeholder')}
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                  />
                </div>

                {/* Subtotal & Submit */}
                <div className="checkout-summary">
                  <div className="summary-row">
                    <span>{t('Subtotal')}</span>
                    <span className="summary-subtotal">
                      {formatPrice(subtotal)} {currency}
                    </span>
                  </div>

                  <button type="submit" className="btn-gold submit-order-btn" disabled={loading}>
                    {loading ? t('PROCESSING...') : `${t('PLACE ORDER')} • ${formatPrice(subtotal)} ${currency}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
