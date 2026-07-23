import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const ShopContext = createContext();

export const ShopProvider = ({ children }) => {
  const [shopSettings, setShopSettings] = useState({
    shop_name: 'SAADO DROP',
    currency: 'LBP',
    is_accepting_orders: 1,
    whatsapp_number: '+96100000000',
    address: 'Beirut, Lebanon',
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const res = await api.getShopSettings();
      if (res.data && Object.keys(res.data).length > 0) {
        setShopSettings(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch shop settings, using default:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <ShopContext.Provider value={{ shopSettings, loading, refreshSettings: fetchSettings }}>
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => useContext(ShopContext);
