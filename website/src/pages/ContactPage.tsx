import React from 'react';
import { zupifyConfig } from '../config';

export const ContactPage: React.FC = () => {
  return (
    <div style={{ padding: '60px 0 90px' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div className="badge" style={{ marginBottom: '12px' }}>Support & Grievance</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '12px', color: '#FFFFFF' }}>Customer Support & Grievance Redressal</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            We're here to assist you with order queries, ride concerns, platform issues, or data safety questions.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '40px' }}>
          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📩</div>
            <h3 style={{ color: '#FFFFFF', marginBottom: '8px', fontSize: '1.2rem' }}>Email Support</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
              Direct line for customer inquiries and feedback.
            </p>
            <a href={`mailto:${zupifyConfig.supportEmail}`} style={{ color: '#60A5FA', fontWeight: 600 }}>
              {zupifyConfig.supportEmail}
            </a>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>📞</div>
            <h3 style={{ color: '#FFFFFF', marginBottom: '8px', fontSize: '1.2rem' }}>Helpline</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '12px' }}>
              Available 9:00 AM – 8:00 PM IST (Mon-Sat).
            </p>
            <span style={{ color: '#34D399', fontWeight: 600 }}>
              {zupifyConfig.supportPhone}
            </span>
          </div>

          <div className="card">
            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🏢</div>
            <h3 style={{ color: '#FFFFFF', marginBottom: '8px', fontSize: '1.2rem' }}>Corporate Office</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              {zupifyConfig.legalEntityName}<br />
              {zupifyConfig.businessAddress}
            </p>
          </div>
        </div>

        {/* Statutory Grievance Redressal Card */}
        <div className="card" style={{ border: '1px solid rgba(59, 130, 246, 0.3)', background: 'rgba(30, 58, 138, 0.1)' }}>
          <h2 style={{ fontSize: '1.35rem', color: '#93C5FD', marginBottom: '12px' }}>
            Statutory Grievance Redressal Mechanism
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '16px', lineHeight: '1.6' }}>
            Pursuant to the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and Consumer Protection (E-Commerce) Rules, 2020:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', fontSize: '0.9rem' }}>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.8rem' }}>GRIEVANCE OFFICER</span>
              <strong style={{ color: '#FFFFFF' }}>{zupifyConfig.grievanceOfficerName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.8rem' }}>OFFICIAL EMAIL</span>
              <a href={`mailto:${zupifyConfig.grievanceOfficerEmail}`} style={{ color: '#60A5FA' }}>
                {zupifyConfig.grievanceOfficerEmail}
              </a>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.8rem' }}>ACKNOWLEDGMENT TIMELINE</span>
              <strong style={{ color: '#34D399' }}>Within 24 Hours</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-dim)', display: 'block', fontSize: '0.8rem' }}>RESOLUTION TARGET</span>
              <strong style={{ color: '#34D399' }}>Within 15 Days</strong>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
