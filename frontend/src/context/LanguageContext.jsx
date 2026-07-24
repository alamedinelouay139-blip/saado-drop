import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navbar
    'Accepting Orders': 'Accepting Orders',
    'Currently Closed': 'Currently Closed',
    'Admin Portal': 'Admin Portal',
    
    // Hero
    'Hero Badge': 'CREPES • COCKTAILS • MILKSHAKES',
    'Hero Title Line 1': 'CREPES',
    'Hero Title Line 2': 'COCKTAILS',
    'Hero Title Line 3': 'MILKSHAKES',
    'Hero Description': 'Freshly prepared crepes, cocktails, milkshakes, and desserts.',
    'Explore Menu': 'Explore Menu',
    'About Us': 'About Us',
    'Made Fresh To Order': 'Made Fresh To Order',
    'Premium Belgian Chocolate': 'Premium Belgian Chocolate',
    'Fresh Signature Drinks': 'Fresh Signature Drinks',
    'Hero Feature 1': 'Fresh To Order',
    'Hero Feature 2': 'Quality Ingredients',
    'Hero Feature 3': 'Fresh Drinks',
    
    // Atelier / About Us
    'ABOUT US Label': 'ABOUT US',
    'About Title': 'MADE FRESH\nFOR EVERY ORDER',
    'About Description': 'We serve crepes, cocktails, milkshakes, and desserts prepared fresh with carefully selected ingredients.',
    
    'Feature 1 Title': 'Fresh To Order',
    'Feature 1 Desc': 'Prepared after every order is confirmed.',
    'Feature 2 Title': 'Quality Ingredients',
    'Feature 2 Desc': 'Selected ingredients used in every item.',
    'Feature 3 Title': 'Fresh Drinks',
    'Feature 3 Desc': 'Cocktails, milkshakes, and refreshing drinks.',
    'Feature 4 Title': 'Fast Service',
    'Feature 4 Desc': 'Quick preparation and easy ordering.',
    
    // Menu
    'SIGNATURE COLLECTION': 'SIGNATURE COLLECTION',
    'Menu Title': 'A MENU CRAFTED TO INDULGE',
    'Menu Subtitle': 'Discover artisan crepes, premium chocolate creations, refreshing drinks, handcrafted milkshakes, and carefully curated desserts made fresh for every order.',
    'ALL CREATIONS': 'ALL CREATIONS',
    'Search placeholder': 'Search crepes or ingredients...',
    'Fetching Atelier Collection...': 'Fetching Atelier Collection...',
    'Try Again': 'Try Again',
    'No Creations Found': 'No Creations Found',
    'Try searching for a different creation or select another category.': 'Try searching for a different creation or select another category.',
    
    // Product Card
    'Sold Out': 'Sold Out',
    'Add to Order': 'Add to Order',
    'Added to Bag': 'Added to Bag',
    
    // Cart Drawer
    'YOUR SELECTION': 'YOUR SELECTION',
    'ITEMS': 'ITEMS',
    'ORDER PLACED!': 'ORDER PLACED!',
    'Order Number:': 'Order Number:',
    'Order success text': 'Your order has been recorded successfully. Please notify our team via WhatsApp to finalize delivery details.',
    'Delivery fee disclaimer': '⚠️ Delivery fee is not included in the subtotal ({subtotal}) and will be added via WhatsApp.',
    'CONTINUE TO WHATSAPP': 'CONTINUE TO WHATSAPP',
    'Back to Menu': 'Back to Menu',
    'Empty cart text': 'Your bag is currently empty.',
    'Empty cart subtext': 'Explore our luxury crepe collection to add items.',
    'Delivery fee note': 'ℹ️ Delivery fee is not included in the subtotal and will be confirmed via WhatsApp.',
    'Delivery': 'Delivery',
    'Pickup': 'Pickup',
    'Full Name *': 'Full Name *',
    'Enter your full name': 'Enter your full name',
    'Phone Number *': 'Phone Number *',
    'Enter your phone number': 'Enter your phone number',
    'Delivery Address *': 'Delivery Address *',
    'Address placeholder': 'Street name, building, apartment, city',
    'Special Instructions (Optional)': 'Special Instructions (Optional)',
    'Instructions placeholder': 'Extra chocolate, no nuts, etc.',
    'Subtotal': 'Subtotal',
    'PROCESSING...': 'PROCESSING...',
    'PLACE ORDER': 'PLACE ORDER',
    
    // Footer / General
    'Follow us on Instagram': 'Follow us on Instagram',
    'Menu': 'Menu',
    'About': 'About',
    'Contact': 'Contact',
    'Instagram': 'Instagram'
  },
  ar: {
    // Navbar
    'Accepting Orders': 'نستقبل الطلبات',
    'Currently Closed': 'مغلق حالياً',
    'Admin Portal': 'لوحة الإدارة',
    
    // Hero
    'Hero Badge': 'كريب • كوكتيلات • ميلك شيك',
    'Hero Title Line 1': 'كريب',
    'Hero Title Line 2': 'كوكتيلات',
    'Hero Title Line 3': 'ميلك شيك',
    'Hero Description': 'كريب، كوكتيلات، ميلك شيك، وحلويات تُحضّر طازجة.',
    'Explore Menu': 'استكشف القائمة',
    'About Us': 'من نحن',
    'Made Fresh To Order': 'طازج عند الطلب',
    'Premium Belgian Chocolate': 'مكونات مختارة',
    'Fresh Signature Drinks': 'مشروبات طازجة',
    'Hero Feature 1': 'طازج عند الطلب',
    'Hero Feature 2': 'مكونات مختارة',
    'Hero Feature 3': 'مشروبات طازجة',
    
    // Atelier / About Us
    'ABOUT US Label': 'من نحن',
    'About Title': 'نحضّر كل طلب\nطازجًا',
    'About Description': 'نقدّم كريب، كوكتيلات، ميلك شيك، وحلويات تُحضّر طازجة بمكونات مختارة بعناية.',
    
    'Feature 1 Title': 'طازج عند الطلب',
    'Feature 1 Desc': 'يُحضّر بعد تأكيد كل طلب.',
    'Feature 2 Title': 'مكونات مختارة',
    'Feature 2 Desc': 'نستخدم مكونات مختارة في كل صنف.',
    'Feature 3 Title': 'مشروبات طازجة',
    'Feature 3 Desc': 'كوكتيلات، ميلك شيك، ومشروبات منعشة.',
    'Feature 4 Title': 'خدمة سريعة',
    'Feature 4 Desc': 'تحضير سريع وطلب بسهولة.',
    
    // Menu
    'SIGNATURE COLLECTION': 'مجموعتنا المميزة',
    'Menu Title': 'قائمة مُحضرة لتستمتع',
    'Menu Subtitle': 'اكتشف كريب احترافي، إبداعات شوكولاتة فاخرة، مشروبات منعشة، ميلك شيك، وحلويات محضرة طازجة لكل طلب.',
    'ALL CREATIONS': 'كل الأصناف',
    'Search placeholder': 'ابحث عن كريب أو مكونات...',
    'Fetching Atelier Collection...': 'جاري تحميل القائمة...',
    'Try Again': 'حاول مرة أخرى',
    'No Creations Found': 'لم يتم العثور على أصناف',
    'Try searching for a different creation or select another category.': 'حاول البحث عن صنف آخر أو اختر فئة مختلفة.',
    
    // Product Card
    'Sold Out': 'نفذت الكمية',
    'Add to Order': 'أضف للطلب',
    'Added to Bag': 'تمت الإضافة',
    
    // Cart Drawer
    'YOUR SELECTION': 'طلبك',
    'ITEMS': 'عناصر',
    'ORDER PLACED!': 'تم الطلب بنجاح!',
    'Order Number:': 'رقم الطلب:',
    'Order success text': 'تم تسجيل طلبك بنجاح. يرجى إرسال رسالة لفريقنا عبر واتساب لتأكيد تفاصيل التوصيل.',
    'Delivery fee disclaimer': '⚠️ رسوم التوصيل غير مشمولة في المجموع الفرعي ({subtotal}) وسيتم إضافتها عبر واتساب.',
    'CONTINUE TO WHATSAPP': 'المتابعة عبر واتساب',
    'Back to Menu': 'العودة للقائمة',
    'Empty cart text': 'سلة الطلبات فارغة حالياً.',
    'Empty cart subtext': 'استكشف قائمة الكريب الفاخرة لإضافة طلبات.',
    'Delivery fee note': 'ℹ️ رسوم التوصيل غير مشمولة في المجموع الفرعي وسيتم تأكيدها عبر واتساب.',
    'Delivery': 'توصيل',
    'Pickup': 'استلام',
    'Full Name *': 'الاسم الكامل *',
    'Enter your full name': 'أدخل اسمك الكامل',
    'Phone Number *': 'رقم الهاتف *',
    'Enter your phone number': 'أدخل رقم هاتفك',
    'Delivery Address *': 'عنوان التوصيل *',
    'Address placeholder': 'اسم الشارع، البناية، الشقة، المدينة',
    'Special Instructions (Optional)': 'ملاحظات إضافية (اختياري)',
    'Instructions placeholder': 'شوكولاتة إضافية، بدون مكسرات، إلخ.',
    'Subtotal': 'المجموع الفرعي',
    'PROCESSING...': 'جاري المعالجة...',
    'PLACE ORDER': 'إتمام الطلب',
    
    // Footer / General
    'Follow us on Instagram': 'تابعنا على إنستغرام',
    'Menu': 'القائمة',
    'About': 'من نحن',
    'Contact': 'تواصل معنا',
    'Instagram': 'إنستغرام'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('saado_language');
    if (savedLang === 'en' || savedLang === 'ar') {
      setLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('saado_language', language);
    const dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language]);

  const t = (key, params = {}) => {
    let text = translations[language][key] || translations['en'][key] || key;
    
    // Basic interpolation for parameters like {subtotal}
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t, isRtl: language === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
