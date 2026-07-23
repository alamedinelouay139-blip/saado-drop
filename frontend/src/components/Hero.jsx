import React from 'react';
import { ArrowRight, Sparkles, ShieldCheck, Flame, GlassWater } from 'lucide-react';
import heroImage from '../assets/images/hero-saado-drop.jpg';
import './Hero.css';

export const Hero = ({ onExplore }) => {
  return (
    <section className="hero-section">
      {/* Ambient Radial Background Glow */}
      <div className="hero-ambient-glow"></div>

      <div className="container hero-container">
        {/* Main Header Content */}
        <div className="hero-content">
          <div className="hero-pill-tag">
            <Sparkles size={14} className="text-gold" />
            <span>✦ ARTISAN CREPES • BELGIAN CHOCOLATE • SIGNATURE DRINKS</span>
          </div>

          <h1 className="hero-title">
            CRAFTED CREPES <br />
            <span className="hero-title-accent">BELGIAN CHOCOLATE</span> <br />
            SIGNATURE DRINKS
          </h1>

          <p className="hero-description">
            Every order is prepared fresh using premium Belgian chocolate, handcrafted crepes, seasonal fruits, signature milkshakes, refreshing cocktails, and carefully selected ingredients—crafted to deliver an exceptional dessert experience.
          </p>

          <div className="hero-actions">
            <button className="btn-gold" onClick={onExplore}>
              <span>Explore Menu</span>
              <ArrowRight size={18} />
            </button>
            <a href="#about" className="btn-outline">
              Our Atelier
            </a>
          </div>

          {/* Value Badges */}
          <div className="hero-badges">
            <div className="hero-badge-item">
              <Flame size={16} className="text-gold" />
              <span>Made Fresh To Order</span>
            </div>
            <div className="hero-badge-divider"></div>
            <div className="hero-badge-item">
              <ShieldCheck size={16} className="text-gold" />
              <span>Premium Belgian Chocolate</span>
            </div>
            <div className="hero-badge-divider"></div>
            <div className="hero-badge-item">
              <GlassWater size={16} className="text-gold" />
              <span>Fresh Signature Drinks</span>
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
