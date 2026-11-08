import React from 'react';
import { zupifyConfig } from '../config';

interface HomePageProps {
  setCurrentTab: (tab: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ setCurrentTab }) => {
  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="glow-bg" />

      {/* Hero Section */}
      <section style={{ padding: '80px 0 60px', position: 'relative', zIndex: 1 }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: '860px' }}>
          <div className="badge" style={{ marginBottom: '20px' }}>
            ✨ Multi-Role Hyperlocal Super Ecosystem
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 5vw, 4rem)',
            lineHeight: 1.15,
            marginBottom: '24px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #CBD5E1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            One Unified App.<br />Every Daily Essential Fulfilled.
          </h1>
          <p style={{
            fontSize: '1.2rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '36px',
            maxWidth: '680px',
            margin: '0 auto 36px'
          }}>
            From point-to-point ride bookings and kitchen-fresh food ordering to local marketplace peer-to-peer trading and water supply tankers—experience true convenience with Zupify.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <a 
              href={zupifyConfig.downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              style={{ padding: '14px 28px', fontSize: '1rem' }}
            >
              📥 Download Zupify APK ({zupifyConfig.version})
            </a>
            <button 
              onClick={() => setCurrentTab('privacy')} 
              className="btn btn-outline"
              style={{ padding: '14px 28px', fontSize: '1rem' }}
            >
              🛡️ Data Safety & Policies
            </button>
          </div>

          <div style={{ marginTop: '30px', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            Google Play Package: <code style={{ color: '#93C5FD' }}>{zupifyConfig.packageName}</code> • SHA-256 Verified
          </div>
        </div>
      </section>

      {/* 4 Core Pillars */}
      <section style={{ padding: '40px 0 60px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '14px', color: '#FFFFFF' }}>Our Core Pillars</h2>
            <p style={{ color: 'var(--text-muted)' }}>Tailored multi-role flows seamlessly operating under a single reactive infrastructure.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px'
          }}>
            {[
              {
                icon: '🚕',
                title: 'Rides & Micro-Mobility',
                desc: 'Real-time GPS ride hailing with Mapbox route telemetry, live driver pairing, OTP-verified trip dispatch, and cashless settling.',
                color: '#3B82F6'
              },
              {
                icon: '🍲',
                title: 'Food & Culinary Hub',
                desc: 'Explore curated menus from regional kitchens and dining bars. Real-time preparation tracker and contactless delivery handoff.',
                color: '#10B981'
              },
              {
                icon: '🛒',
                title: 'Local Bazaar (P2P)',
                desc: 'Community marketplace to sell used vehicles, tech gadgets, furniture, and tools directly to local verified citizens.',
                color: '#F59E0B'
              },
              {
                icon: '💧',
                title: 'Water Supplies & Logistics',
                desc: 'Commercial and domestic water delivery matching. Request emergency water tankers or scheduled 20L jar subscriptions.',
                color: '#06B6D4'
              }
            ].map((col, idx) => (
              <div key={idx} className="card" style={{ position: 'relative' }}>
                <div style={{
                  fontSize: '2.2rem',
                  marginBottom: '16px',
                  width: '60px',
                  height: '60px',
                  borderRadius: '16px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {col.icon}
                </div>
                <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', marginBottom: '10px' }}>{col.title}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>{col.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust & Data Safety Section */}
      <section style={{ padding: '60px 0', background: 'rgba(17, 24, 39, 0.4)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container" style={{ maxWidth: '960px' }}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="badge" style={{ marginBottom: '12px' }}>Google Play Standards</span>
            <h2 style={{ fontSize: '2rem', color: '#FFFFFF' }}>Privacy-First Engineering Architecture</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="card">
              <h4 style={{ color: '#60A5FA', marginBottom: '8px', fontSize: '1.1rem' }}>📍 Location When In Use</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                GPS coordinates are queried solely while actively booking a ride or browsing nearby restaurants. We never track background location when the app is closed.
              </p>
            </div>
            <div className="card">
              <h4 style={{ color: '#34D399', marginBottom: '8px', fontSize: '1.1rem' }}>🔐 Financial Safeguards</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Zero storage of sensitive debit/credit card numbers or UPI MPINs. All transactions are securely routed through PCI-DSS certified payment aggregators.
              </p>
            </div>
            <div className="card">
              <h4 style={{ color: '#F472B6', marginBottom: '8px', fontSize: '1.1rem' }}>🗑️ Full Deletion Rights</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Every user retains full autonomy. Request total account purge and historical log deletion directly inside the app or via our 1-click web deletion form.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
