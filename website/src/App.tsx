import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsPage } from './pages/TermsPage';
import { DeleteAccountPage } from './pages/DeleteAccountPage';
import { ContactPage } from './pages/ContactPage';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');

  useEffect(() => {
    // Handle simple hash routing or initial location
    const hash = window.location.hash.replace('#', '');
    if (['privacy', 'terms', 'deletion', 'contact'].includes(hash)) {
      setCurrentTab(hash);
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    window.location.hash = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar currentTab={currentTab} setCurrentTab={handleTabChange} />
      
      <main style={{ flex: 1 }}>
        {currentTab === 'home' && <HomePage setCurrentTab={handleTabChange} />}
        {currentTab === 'privacy' && <PrivacyPolicyPage />}
        {currentTab === 'terms' && <TermsPage />}
        {currentTab === 'deletion' && <DeleteAccountPage />}
        {currentTab === 'contact' && <ContactPage />}
      </main>

      <Footer setCurrentTab={handleTabChange} />
    </div>
  );
};
