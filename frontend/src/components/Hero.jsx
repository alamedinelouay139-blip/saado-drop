import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Flame, GlassWater } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import heroImage from '../assets/images/hero-saado-drop.jpg';
import './Hero.css';

export const Hero = ({ onExplore }) => {
  const { t } = useLanguage();
  return (
    <section className="hero-section">
      {/* Ambient Radial Background Glow */}
      <div className="hero-ambient-glow"></div>

      <div className="container hero-container">
        {/* Main Header Content */}
        <div className="hero-content">
          <div className="hero-pill-tag">
            <Sparkles size={14} className="text-gold" />
            <span>✦ {t('Hero Badge')}</span>
          </div>

          <h1 className="hero-title">
            {t('Hero Title Line 1')} <br />
            <span className="hero-title-accent">{t('Hero Title Line 2')}</span> <br />
            {t('Hero Title Line 3')}
          </h1>

          <p className="hero-description">
            {t('Hero Description')}
          </p>

          <div className="hero-actions">
            <button className="btn-gold" onClick={onExplore}>
              <span>{t('Explore Menu')}</span>
              <ArrowRight size={18} />
            </button>
            <a href="#about" className="btn-outline">
              {t('About Us')}
            </a>
          </div>

          {/* Value Badges */}
          <div className="hero-badges">
            <div className="hero-badge-item">
              <Flame size={16} className="text-gold" />
              <span>{t('Hero Feature 1')}</span>
            </div>
            <div className="hero-badge-divider"></div>
            <div className="hero-badge-item">
              <ShieldCheck size={16} className="text-gold" />
              <span>{t('Hero Feature 2')}</span>
            </div>
            <div className="hero-badge-divider"></div>
            <div className="hero-badge-item">
              <GlassWater size={16} className="text-gold" />
              <span>{t('Hero Feature 3')}</span>
            </div>
          </div>
        </div>

        {/* Hero Visual Showcase */}
        <div className="hero-showcase">
          <div className="showcase-card surface-card">
            <div className="showcase-image-wrapper">
              <img
                src={heroImage}
                alt="SAADO DROP luxury signature dessert"
                className="showcase-img"
                fetchPriority="high"
              />
              <div className="showcase-badge">
                <span className="badge-title">SIGNATURE DROP</span>
                <span className="badge-price">GOLD DUST CREPE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
