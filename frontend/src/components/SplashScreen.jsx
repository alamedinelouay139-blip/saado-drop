import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

export const SplashScreen = ({ onFinish }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Check if splash has already played in this session
    const hasSeenSplash = sessionStorage.getItem('saado_has_seen_splash');
    if (hasSeenSplash) {
      onFinish();
      return;
    }

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 1800);

    const finishTimer = setTimeout(() => {
      sessionStorage.setItem('saado_has_seen_splash', 'true');
      onFinish();
    }, 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div className={`splash-screen ${fading ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="logo-glow-wrapper">
          <div className="logo-emblem">
            <span className="logo-text-top">SAADO</span>
            <span className="logo-text-bottom">DROP</span>
          </div>
          <div className="logo-halo"></div>
        </div>

        <div className="splash-tagline">HAUTE CREPERIE & ARTISAN CHOCOLATE</div>

        <div className="splash-progress-container">
          <div className="splash-progress-bar"></div>
        </div>
      </div>
    </div>
  );
};
