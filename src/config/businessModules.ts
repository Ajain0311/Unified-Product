export interface BusinessModuleConfig {
  id: string;
  key: string;
  nameEn: string;
  nameHi: string;
  badgeEn?: string;
  badgeHi?: string;
  icon: string; // Ionicons icon name
  route: string;
  gradient: [string, string];
  descriptionEn: string;
  descriptionHi: string;
  isReady: boolean;
}

export const BUSINESS_MODULES: BusinessModuleConfig[] = [
  {
    id: 'mod-hotels',
    key: 'hotels',
    nameEn: 'Hotels & Stays',
    nameHi: 'होटल और विश्राम',
    badgeEn: 'Live',
    badgeHi: 'लाइव',
    icon: 'bed',
    route: 'HotelHome',
    gradient: ['#047857', '#10B981'],
    descriptionEn: 'Luxury resorts, boutique stays, anti-no-show booking',
    descriptionHi: 'शानदार रिसॉर्ट्स, बुटीक होटल और सुरक्षित बुकिंग',
    isReady: true,
  },
  {
    id: 'mod-food',
    key: 'food',
    nameEn: 'Food Delivery',
    nameHi: 'खाना डिलीवरी',
    badgeEn: 'Popular',
    badgeHi: 'लोकप्रिय',
    icon: 'fast-food',
    route: 'Food',
    gradient: ['#DC2626', '#EF4444'],
    descriptionEn: 'Top restaurants, hot meals & snacks delivered fast',
    descriptionHi: 'शीर्ष रेस्तरां, गरमा-गरम भोजन और त्वरित डिलीवरी',
    isReady: true,
  },
  {
    id: 'mod-rides',
    key: 'rides',
    nameEn: 'Cabs & Rides',
    nameHi: 'कैब और राइड्स',
    badgeEn: 'Instant',
    badgeHi: 'तुरंत',
    icon: 'car',
    route: 'Rides',
    gradient: ['#2563EB', '#3B82F6'],
    descriptionEn: 'City rides, auto, bike & outstation cabs at transparent fares',
    descriptionHi: 'किफायती और सुरक्षित ऑटो, बाइक एवं कैब राइड्स',
    isReady: true,
  },
  {
    id: 'mod-bazaar',
    key: 'bazaar',
    nameEn: 'City Bazaar',
    nameHi: 'सिटी बाज़ार',
    badgeEn: 'Shop',
    badgeHi: 'खरीदें',
    icon: 'cart',
    route: 'Bazaar',
    gradient: ['#D97706', '#F59E0B'],
    descriptionEn: 'Local sellers, electronics, fashion and verified pre-owned items',
    descriptionHi: 'स्थानीय विक्रेता, इलेक्ट्रॉनिक्स, फैशन और सत्यापित वस्तुएं',
    isReady: true,
  },
  {
    id: 'mod-bars',
    key: 'bars',
    nameEn: 'Bars & Lounges',
    nameHi: 'बार्स और लाउंज',
    badgeEn: 'New',
    badgeHi: 'नया',
    icon: 'wine',
    route: 'BarHub',
    gradient: ['#7C3AED', '#8B5CF6'],
    descriptionEn: 'Nightlife, cocktail bars, craft breweries & VIP table reservations',
    descriptionHi: 'नाइटलाइफ़, कॉकटेल बार्स, क्राफ्ट ब्रुअरीज एवं वीआईपी टेबल बुकिंग',
    isReady: true,
  },
  {
    id: 'mod-beverages',
    key: 'beverages',
    nameEn: 'Beverages & Cafe',
    nameHi: 'कैफे और पेय',
    badgeEn: 'Fresh',
    badgeHi: 'ताज़ा',
    icon: 'cafe',
    route: 'BeverageHub',
    gradient: ['#0891B2', '#06B6D4'],
    descriptionEn: 'Artisan coffee, bubble tea, fresh juices, and specialty brews',
    descriptionHi: 'स्पेशलिटी कॉफी, बबल टी, ताज़ा जूस एवं शेक्स',
    isReady: true,
  },
  {
    id: 'mod-supplies',
    key: 'supplies',
    nameEn: 'B2B Water Supplies',
    nameHi: 'थोक पानी आपूर्ति',
    badgeEn: 'B2B',
    badgeHi: 'थोक',
    icon: 'water',
    route: 'B2BWaterSupplies',
    gradient: ['#0284C7', '#38BDF8'],
    descriptionEn: 'Wholesale mineral water crates, glass bottles & bar soda for hotels & restaurants',
    descriptionHi: 'होटलों, बार्स और रेस्तरां के लिए थोक पानी की बोतलें एवं आपूर्ति',
    isReady: true,
  },
];
