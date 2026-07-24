import React from 'react';
import { Sparkles, HeartHandshake, Award, Leaf, Coffee, MessageSquare } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { useLanguage } from '../context/LanguageContext';
import atelierImage from '../assets/images/haute-dessert-craftsmanship.jpg';
import './AtelierStory.css';

export const AtelierStory = () => {
  const { shopSettings } = useShop();
  const { t } = useLanguage();

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
              <span>✦ {t('ABOUT US Label')}</span>
            </div>
            <h2 className="story-title" style={{ whiteSpace: 'pre-line' }}>{t('About Title')}</h2>
            <p className="story-text">
              {t('About Description')}
            </p>

            <div className="story-features">
              <div className="feature-card surface-card">
                <HeartHandshake size={24} className="text-gold" />
                <h4>{t('Feature 1 Title')}</h4>
                <p>{t('Feature 1 Desc')}</p>
              </div>
              <div className="feature-card surface-card">
                <Award size={24} className="text-gold" />
                <h4>{t('Feature 2 Title')}</h4>
                <p>{t('Feature 2 Desc')}</p>
              </div>
              <div className="feature-card surface-card">
                <Coffee size={24} className="text-gold" />
                <h4>{t('Feature 3 Title')}</h4>
                <p>{t('Feature 3 Desc')}</p>
              </div>
              <div className="feature-card surface-card">
                <Leaf size={24} className="text-gold" />
                <h4>{t('Feature 4 Title')}</h4>
                <p>{t('Feature 4 Desc')}</p>
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

        {/* Footer */}
        <footer className="footer-bar">
          <div className="footer-col" style={{ maxWidth: '320px' }}>
            <span className="footer-brand">SAADO <span>DROP</span></span>
            <p className="footer-copy" style={{ color: 'var(--text-almond)', marginTop: '8px', lineHeight: '1.5' }}>
              {t('Hero Description')}
            </p>
            <p className="footer-copy" style={{ marginTop: '16px' }}>© {new Date().getFullYear()} SAADO DROP. All Rights Reserved.</p>
          </div>

          <div className="footer-col" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              <a href="#menu" className="footer-item" style={{ textDecoration: 'none' }}>{t('Menu')}</a>
              <a href="#about" className="footer-item" style={{ textDecoration: 'none' }}>{t('About')}</a>
            </div>
            
            <a 
              href="https://www.instagram.com/saado_drop?igsh=MWpocmthYTZ2NHB3Mg==" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn-outline instagram-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', marginTop: '8px' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '0.8rem', lineHeight: '1', marginBottom: '2px' }}>{t('Follow us on Instagram')}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', lineHeight: '1' }}>@saado_drop</span>
              </div>
            </a>
          </div>
        </footer>
      </div>
    </section>
  );
};
