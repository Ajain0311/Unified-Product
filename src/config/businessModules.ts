/**
 * Centralized Ecosystem Module Registry
 *
 * Future-ready architectural catalogue supporting dynamic module registration,
 * role-based filtering, and category-driven presentation.
 */

export type ModuleCategory =
  | 'hospitality'
  | 'delivery'
  | 'mobility'
  | 'commerce'
  | 'nightlife'
  | 'lifestyle'
  | 'b2b'
  | 'services';

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
  isEnabled: boolean;
  category: ModuleCategory;
  rolesAllowed?: Array<'CUSTOMER' | 'DRIVER' | 'VENDOR' | 'SELLER' | 'ADMIN'>;
  layoutVariant?: 'grid' | 'featured' | 'compact';
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
    isEnabled: true,
    category: 'hospitality',
    rolesAllowed: ['CUSTOMER', 'ADMIN'],
    layoutVariant: 'featured',
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
    gradient: ['#FF5A1F', '#FF7A45'],
    descriptionEn: 'Top restaurants, hot meals & snacks delivered fast',
    descriptionHi: 'शीर्ष रेस्तरां, गरमा-गरम भोजन और त्वरित डिलीवरी',
    isReady: true,
    isEnabled: true,
    category: 'delivery',
    rolesAllowed: ['CUSTOMER', 'VENDOR', 'ADMIN'],
    layoutVariant: 'featured',
  },
  {
    id: 'mod-rides',
    key: 'rides',
    nameEn: 'Cabs & Rides',
    nameHi: 'कैब और राइड्स',
    badgeEn: 'Instant',
    badgeHi: 'तुरंत',
    icon: 'car-sport',
    route: 'Rides',
    gradient: ['#2563EB', '#3B82F6'],
    descriptionEn: 'City rides, auto, bike & outstation cabs at transparent fares',
    descriptionHi: 'किफायती और सुरक्षित ऑटो, बाइक एवं कैब राइड्स',
    isReady: true,
    isEnabled: true,
    category: 'mobility',
    rolesAllowed: ['CUSTOMER', 'DRIVER', 'ADMIN'],
    layoutVariant: 'featured',
  },
  {
    id: 'mod-bazaar',
    key: 'bazaar',
    nameEn: 'City Bazaar',
    nameHi: 'सिटी बाज़ार',
    badgeEn: 'Shop',
    badgeHi: 'खरीदें',
    icon: 'bag-handle',
    route: 'Bazaar',
    gradient: ['#D97706', '#F59E0B'],
    descriptionEn: 'Local sellers, electronics, fashion and verified pre-owned items',
    descriptionHi: 'स्थानीय विक्रेता, इलेक्ट्रॉनिक्स, फैशन और सत्यापित वस्तुएं',
    isReady: true,
    isEnabled: true,
    category: 'commerce',
    rolesAllowed: ['CUSTOMER', 'SELLER', 'ADMIN'],
    layoutVariant: 'grid',
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
    isEnabled: true,
    category: 'nightlife',
    rolesAllowed: ['CUSTOMER', 'ADMIN'],
    layoutVariant: 'grid',
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
    isEnabled: true,
    category: 'lifestyle',
    rolesAllowed: ['CUSTOMER', 'ADMIN'],
    layoutVariant: 'grid',
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
    isEnabled: true,
    category: 'b2b',
    rolesAllowed: ['CUSTOMER', 'VENDOR', 'ADMIN'],
    layoutVariant: 'grid',
  },
];

/**
 * Filter enabled modules for active user role
 */
export function getAvailableModules(
  activeRole: string = 'CUSTOMER'
): BusinessModuleConfig[] {
  return BUSINESS_MODULES.filter((m) => {
    if (!m.isEnabled || !m.isReady) return false;
    if (!m.rolesAllowed) return true;
    return m.rolesAllowed.includes(activeRole as any);
  });
}

/**
 * Retrieve module by key
 */
export function getModuleByKey(key: string): BusinessModuleConfig | undefined {
  return BUSINESS_MODULES.find((m) => m.key.toLowerCase() === key.toLowerCase());
}
