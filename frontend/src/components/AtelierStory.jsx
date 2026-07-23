import React from 'react';
import { Sparkles, HeartHandshake, Award, Leaf, Coffee, MessageSquare } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import atelierImage from '../assets/images/haute-dessert-craftsmanship.jpg';
import './AtelierStory.css';

export const AtelierStory = () => {
  const { shopSettings } = useShop();

  const whatsapp = shopSettings?.whatsapp_number || '+96100000000';
  const cleanPhone = whatsapp.replace(/[^0-9]/g, '');

  return (
    <section className="atelier-section" id="about">
      <div className="container">
        {/* Story Section */}
        <div className="story-grid">
          <div className="story-content">
            <div className="story-badge">
              <Sparkles size={14} className="text-gold" />
              <span>✦ OUR PHILOSOPHY</span>
            </div>
            <h2 className="story-title">CRAFTED FOR EVERY MOMENT</h2>
            <p className="story-text">
              We believe exceptional desserts begin with exceptional ingredients.
            </p>
            <p className="story-text">
              From handcrafted crepes and rich Belgian chocolate to refreshing cocktails, milkshakes, and fresh fruits, every creation is prepared with precision, passion, and attention to every detail.
            </p>

            <div className="story-features">
              <div className="feature-card surface-card">
                <Award size={24} className="text-gold" />
                <h4>Premium Belgian Chocolate</h4>
                <p>Crafted with authentic Belgian chocolate for a rich, smooth, and luxurious taste.</p>
              </div>
              <div className="feature-card surface-card">
                <HeartHandshake size={24} className="text-gold" />
                <h4>Fresh To Order</h4>
                <p>Prepared individually for every guest to ensure the perfect texture and freshness.</p>
              </div>
              <div className="feature-card surface-card">
                <Leaf size={24} className="text-gold" />
                <h4>Fresh Ingredients</h4>
                <p>Selected fruits, premium toppings, and quality ingredients in every creation.</p>
              </div>
              <div className="feature-card surface-card">
                <Coffee size={24} className="text-gold" />
                <h4>Signature Drinks</h4>
                <p>Refreshing cocktails, handcrafted milkshakes, and beverages designed to complement every dessert.</p>
              </div>
            </div>
          </div>

          <div className="story-visual surface-card">
            <img
              src={atelierImage}
              alt="SAADO DROP haute dessert craftsmanship"
              className="story-img"
              loading="lazy"
            />
          </div>
        </div>

        {/* WhatsApp & Contact Banner */}
        <div className="contact-banner surface-card">
          <div className="contact-info">
            <h3 className="contact-title">CATERING & PRIVATE EVENTS</h3>
            <p className="contact-subtitle">From birthdays and celebrations to corporate gatherings and private events, SAADO DROP brings handcrafted desserts and signature drinks to every occasion with elegance and attention to detail.</p>
          </div>
          <a
            href={`https://wa.me/${cleanPhone}?text=Hello%20SAADO%20DROP!%20I%20have%20an%20inquiry%20about%20a%20custom%20order.`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold"
          >
            <MessageSquare size={18} />
            <span>Contact Us</span>
          </a>
        </div>

        {/* Footer */}
        <footer className="footer-bar">
          <div className="footer-col" style={{ maxWidth: '320px' }}>
            <span className="footer-brand">SAADO <span>DROP</span></span>
            <p className="footer-copy" style={{ color: 'var(--text-almond)', marginTop: '8px', lineHeight: '1.5' }}>
              Luxury artisan crepes, premium Belgian chocolate, handcrafted drinks, and unforgettable dessert experiences—prepared fresh, every day.
            </p>
            <p className="footer-copy" style={{ marginTop: '16px' }}>© {new Date().getFullYear()} SAADO DROP. All Rights Reserved.</p>
          </div>

          <div className="footer-col" style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            <a href="#menu" className="footer-item" style={{ textDecoration: 'none' }}>Menu</a>
            <a href="#about" className="footer-item" style={{ textDecoration: 'none' }}>About</a>
            <a href="#contact" className="footer-item" style={{ textDecoration: 'none' }}>Contact</a>
            <a href="#" className="footer-item" style={{ textDecoration: 'none' }}>Instagram</a>
          </div>
        </footer>
      </div>
    </section>
  );
};
