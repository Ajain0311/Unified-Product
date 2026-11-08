export interface ZupifyConfig {
  appName: string;
  tagline: string;
  legalEntityName: string;
  packageName: string;
  version: string;
  supportEmail: string;
  supportPhone: string;
  businessAddress: string;
  operatingRegion: string;
  grievanceOfficerName: string;
  grievanceOfficerEmail: string;
  grievanceOfficerPhone: string;
  downloadUrl: string;
  lastUpdated: string;
}

export const zupifyConfig: ZupifyConfig = {
  appName: 'Zupify',
  tagline: 'Your Unified Hyperlocal Super App: Rides, Food, Bazaar & Essential Supplies',
  legalEntityName: 'Zupify Technologies Pvt. Ltd.',
  packageName: 'com.zupify.app',
  version: '1.0.4',
  supportEmail: 'support@zupify.app',
  supportPhone: '+91 98765 43210',
  businessAddress: '102 Tech Square, Business District, Jaipur, Rajasthan 302001, India',
  operatingRegion: 'Rajasthan, Punjab & Expanding Across India',
  grievanceOfficerName: 'Aditya Jain',
  grievanceOfficerEmail: 'grievance@zupify.app',
  grievanceOfficerPhone: '+91 98765 43210',
  downloadUrl: 'https://github.com/Ajain0311/Unified-Product/releases/latest',
  lastUpdated: 'November 08, 2026',
};
