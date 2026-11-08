import React from 'react';
import { zupifyConfig } from '../config';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  return (
    <footer style={{
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      padding: '60px 0 30px',
      marginTop: '80px',
      fontSize: '0.9rem',
      color: 'var(--text-muted)'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '40px',
          marginBottom: '50px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#FFF'
              }}>
                Z
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF' }}>{zupifyConfig.appName}</span>
            </div>
            <p style={{ lineHeight: '1.6', marginBottom: '16px' }}>
              {zupifyConfig.tagline}
            </p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Package: <span style={{ color: '#93C5FD' }}>{zupifyConfig.packageName}</span>
            </div>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', marginBottom: '16px', fontSize: '1rem' }}>Ecosystem Services</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>🚗 Hyperlocal Cab & Bike Hailing (Point-to-Point)</li>
              <li>🍔 Gourmet & Street Food Ordering</li>
              <li>🛍️ Community P2P Marketplace (Bazaar)</li>
              <li>💧 Essential Water Tanker & Can Supply</li>
              <li>⚡ Real-Time Tracking with SignalR Hub</li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', marginBottom: '16px', fontSize: '1rem' }}>Data Safety & Compliance</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <button 
                  onClick={() => { setCurrentTab('privacy'); window.scrollTo(0,0); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Privacy Policy (Google Play Compliant)
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setCurrentTab('deletion'); window.scrollTo(0,0); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  User Account & Data Deletion
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setCurrentTab('terms'); window.scrollTo(0,0); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Terms & Conditions
                </button>
              </li>
              <li>
                <button 
                  onClick={() => { setCurrentTab('contact'); window.scrollTo(0,0); }}
                  style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Grievance Redressal (IT Act 2000)
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: '#FFFFFF', marginBottom: '16px', fontSize: '1rem' }}>Registered Office</h4>
            <p style={{ lineHeight: '1.6', marginBottom: '10px' }}>
              {zupifyConfig.legalEntityName}<br />
              {zupifyConfig.businessAddress}
            </p>
            <p style={{ fontSize: '0.85rem' }}>
              Email: <a href={`mailto:${zupifyConfig.supportEmail}`} style={{ color: '#60A5FA' }}>{zupifyConfig.supportEmail}</a>
            </p>
          </div>
        </div>

        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          fontSize: '0.8rem',
          color: 'var(--text-dim)'
        }}>
          <div>
            © {new Date().getFullYear()} {zupifyConfig.legalEntityName}. All rights reserved.
          </div>
          <div>
            Play Store Target SDK: Android 15 (API 35) • Certified Secure • End-to-End SSL Enforced
          </div>
        </div>
      </div>
    </footer>
  );
};
