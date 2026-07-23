import React, { useState } from 'react';
import { ShopProvider } from './context/ShopContext';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SplashScreen } from './components/SplashScreen';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { MenuView } from './components/MenuView';
import { AtelierStory } from './components/AtelierStory';
import { CartDrawer } from './components/CartDrawer';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminDashboard } from './components/AdminDashboard';

const MainApp = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('menu');
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [adminDashboardOpen, setAdminDashboardOpen] = useState(false);

  const { isAuthenticated } = useAuth();

  const handleOpenAdminPortal = () => {
    if (isAuthenticated) {
      setAdminDashboardOpen(true);
    } else {
      setAdminModalOpen(true);
    }
  };

  const scrollToMenu = () => {
    setActiveTab('menu');
    const el = document.getElementById('menu');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* 1. Initial Splash Screen (First visit / hard refresh only) */}
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="app-root">
        {/* 2. Top Header Navigation */}
        <Navbar
          onOpenAdmin={handleOpenAdminPortal}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* 3. Main Content Views */}
        <main>
          <Hero onExplore={scrollToMenu} />
          <MenuView />
          <AtelierStory />
        </main>

        {/* 4. Slide-Over Cart & Checkout Drawer */}
        <CartDrawer />

        {/* 5. Admin Authentication Modal */}
        <AdminLoginModal
          isOpen={adminModalOpen}
          onClose={() => setAdminModalOpen(false)}
          onSuccess={() => setAdminDashboardOpen(true)}
        />

        {/* 6. Admin SaaS Dashboard (Full Overlay) */}
        {adminDashboardOpen && isAuthenticated && (
          <AdminDashboard onClose={() => setAdminDashboardOpen(false)} />
        )}
      </div>
    </>
  );
};

export function App() {
  return (
    <AuthProvider>
      <ShopProvider>
        <CartProvider>
          <MainApp />
        </CartProvider>
      </ShopProvider>
    </AuthProvider>
  );
}

export default App;
