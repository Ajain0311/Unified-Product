import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type LanguageCode = 'en' | 'hi';

export interface Translations {
  [key: string]: string;
}

export const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    explore: 'Explore',
    hotels: 'Hotels & Stays',
    food: 'Food Delivery',
    rides: 'City Rides',
    bazaar: 'Bazaar Market',
    bars: 'Bars & Pubs',
    beverages: 'Beverage Mart',
    profile: 'Profile',
    bookings: 'My Bookings',
    searchPlaceholder: 'Search stays, restaurants, rides & deals...',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    languageName: 'English',
    switchLanguage: 'हिन्दी',
    hotelDiscoveryTitle: 'Luxury Stays & Boutique Resorts',
    hotelDiscoverySub: 'Handpicked properties with flexible cancellation',
    checkIn: 'CHECK-IN',
    checkOut: 'CHECK-OUT',
    reserveRoom: 'Reserve Room',
    payToken: 'Pay ₹500 Token & Hold Room',
    payAtHotel: 'Pay at Hotel (6 PM Cutoff)',
    payOnline: 'Pay 100% Online',
    adminRestaurantComm: 'Restaurant Commission & Settlements',
    adminHotelComm: 'Hotel Commission & Settlements',
    registerBusiness: 'Partner With Us / Self-Registration',
    applyAsHotelier: 'Register Hotel / Resort',
    applyAsDriver: 'Register as Driver Captain',
    applyAsRestaurant: 'Register Restaurant / Kitchen',
  },
  hi: {
    explore: 'एक्सप्लोर',
    hotels: 'होटल और स्टे',
    food: 'फूड डिलीवरी',
    rides: 'सिटी राइड्स',
    bazaar: 'बाज़ार मार्केट',
    bars: 'बार और पब्स',
    beverages: 'पेय पदार्थ',
    profile: 'प्रोफाइल',
    bookings: 'मेरी बुकिंग्स',
    searchPlaceholder: 'होटल, रेस्टोरेंट, कैब और डील्स खोजें...',
    lightMode: 'लाइट मोड',
    darkMode: 'डार्क मोड',
    languageName: 'हिन्दी',
    switchLanguage: 'English',
    hotelDiscoveryTitle: 'लक्ज़री होटल और रिसॉर्ट्स',
    hotelDiscoverySub: 'आसान कैंसिलेशन और वेरिफाइड प्रॉपर्टीज',
    checkIn: 'चेक-इन',
    checkOut: 'चेक-आउट',
    reserveRoom: 'कमरा बुक करें',
    payToken: '₹500 टोकन देकर कमरा रोकें',
    payAtHotel: 'होटल पर भुगतान (शाम 6 बजे तक)',
    payOnline: 'ऑनलाइन पूरा भुगतान',
    adminRestaurantComm: 'रेस्टोरेंट कमीशन और सेटलमेंट',
    adminHotelComm: 'होटल कमीशन और सेटलमेंट',
    registerBusiness: 'बिजनेस पार्टनर बनें / स्वयं पंजीकरण',
    applyAsHotelier: 'होटल / रिसॉर्ट रजिस्टर करें',
    applyAsDriver: 'ड्राइवर कैप्टन के रूप में जुड़ें',
    applyAsRestaurant: 'रेस्टोरेंट / किचन रजिस्टर करें',
  },
};

export interface LanguageState {
  currentLanguage: LanguageCode;
  language: LanguageCode;
  t: (key: string, fallback?: string) => string;
  translations: Record<string, string>;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  toggleLanguage: () => Promise<void>;
  initLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set, get) => {
  const getTranslator = (lang: LanguageCode) => {
    return (key: string, fallback?: string): string => {
      return TRANSLATIONS[lang]?.[key] || fallback || key;
    };
  };

  return {
    currentLanguage: 'en',
    language: 'en',
    translations: TRANSLATIONS.en,
    t: getTranslator('en'),

    setLanguage: async (lang: LanguageCode) => {
      await AsyncStorage.setItem('superapp_language', lang);
      set({
        currentLanguage: lang,
        language: lang,
        translations: TRANSLATIONS[lang] || TRANSLATIONS.en,
        t: getTranslator(lang),
      });
    },

    toggleLanguage: async () => {
      const next: LanguageCode = get().currentLanguage === 'en' ? 'hi' : 'en';
      await get().setLanguage(next);
    },

    initLanguage: async () => {
      const saved = await AsyncStorage.getItem('superapp_language');
      if (saved === 'hi' || saved === 'en') {
        set({
          currentLanguage: saved,
          language: saved,
          translations: TRANSLATIONS[saved] || TRANSLATIONS.en,
          t: getTranslator(saved),
        });
      }
    },
  };
});
