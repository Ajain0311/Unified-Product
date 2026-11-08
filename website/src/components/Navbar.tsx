import React from 'react';
import { zupifyConfig } from '../config';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab }) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backgroundColor: 'rgba(11, 15, 25, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '76px',
      }}>
        <div 
          onClick={() => setCurrentTab('home')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--primary-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '1.25rem',
            color: '#FFFFFF'
          }}>
            Z
          </div>
          <div>
            <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
              {zupifyConfig.appName}
            </span>
            <span style={{
              marginLeft: '8px',
              fontSize: '0.65rem',
              padding: '2px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(37, 99, 235, 0.2)',
              color: '#93C5FD',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}>
              v{zupifyConfig.version}
            </span>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {[
            { id: 'home', label: 'Ecosystem' },
            { id: 'privacy', label: 'Privacy Policy' },
            { id: 'terms', label: 'Terms' },
            { id: 'deletion', label: 'Data Deletion' },
            { id: 'contact', label: 'Contact & Grievance' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              style={{
                background: currentTab === item.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                color: currentTab === item.id ? '#FFFFFF' : 'var(--text-muted)',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: currentTab === item.id ? 600 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <a 
          href={zupifyConfig.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
          style={{ padding: '9px 18px', fontSize: '0.85rem' }}
        >
          Download App
        </a>
      </div>
    </header>
  );
};
