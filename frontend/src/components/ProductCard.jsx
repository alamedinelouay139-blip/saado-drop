import React, { useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useShop } from '../context/ShopContext';
import { formatPrice } from '../utils/formatPrice';
import { getImageUrl } from '../utils/imageUrl';
import './ProductCard.css';

export const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { shopSettings } = useShop();
  const [added, setAdded] = useState(false);

  const currency = shopSettings?.currency || 'LBP';
  const isAvailable = product.is_available === 1;

  const handleAdd = () => {
    if (!isAvailable) return;
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className={`product-card surface-card ${!isAvailable ? 'unavailable' : ''}`}>
      {/* Product Image Showcase (75% height) */}
      <div className="product-image-container">
        <img
          src={getImageUrl(product.image_url)}
          alt={product.name}
          className="product-img"
          loading="lazy"
        />

        {/* Availability Badge */}
        {!isAvailable && (
          <div className="sold-out-badge">
            <span>Sold Out</span>
          </div>
        )}
      </div>

      {/* Card Content & Ordering Footer */}
      <div className="product-details">
        <div className="product-header">
          <h3 className="product-title">{product.name}</h3>
          <span className="product-price">
            {formatPrice(product.price)} <small>{currency}</small>
          </span>
        </div>

        {product.description && (
          <p className="product-description">{product.description}</p>
        )}

        <div className="product-action-bar">
          <button
            className={`add-cart-btn ${added ? 'btn-success' : ''}`}
            onClick={handleAdd}
            disabled={!isAvailable}
          >
            {added ? (
              <>
                <Check size={16} />
                <span>Added to Bag</span>
              </>
            ) : (
              <>
                <Plus size={16} />
                <span>Add to Order</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
