import React, { useState, useEffect } from 'react';
import { Search, Filter, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { ProductCard } from './ProductCard';
import './MenuView.css';

export const MenuView = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useLanguage();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        api.getCategories(),
        api.getProducts({
          category_id: selectedCategory,
          search: searchQuery.trim(),
        }),
      ]);
      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Error fetching menu data:', err);
      setError('Could not load the menu. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, searchQuery]);

  return (
    <section className="menu-section" id="menu">
      <div className="container">
        {/* Menu Section Header */}
        <div className="menu-header">
          <div className="menu-badge">
            <Sparkles size={14} className="text-gold" />
            <span>✦ {t('SIGNATURE COLLECTION')}</span>
          </div>
          <h2 className="menu-title">{t('Menu Title')}</h2>
          <p className="menu-subtitle">
            {t('Menu Subtitle')}
          </p>
        </div>

        {/* Filters & Search Controls */}
        <div className="menu-controls">
          {/* Category Tabs */}
          <div className="category-tabs">
            <button
              className={`cat-tab ${selectedCategory === null ? 'active' : ''}`}
              onClick={() => setSelectedCategory(null)}
            >
              {t('ALL CREATIONS')}
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`cat-tab ${selectedCategory === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="search-box">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder={t('Search placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear" onClick={() => setSearchQuery('')}>
                ×
              </button>
            )}
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="menu-loading-state">
            <div className="loading-spinner"></div>
            <p>{t('Fetching Atelier Collection...')}</p>
          </div>
        ) : error ? (
          <div className="menu-error-state">
            <p>{error}</p>
            <button className="btn-outline" onClick={fetchData}>
              {t('Try Again')}
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="menu-empty-state">
            <Filter size={40} className="text-gold" />
            <h3>{t('No Creations Found')}</h3>
            <p>{t('Try searching for a different creation or select another category.')}</p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
