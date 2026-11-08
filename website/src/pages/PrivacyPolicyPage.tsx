import React from 'react';
import { zupifyConfig } from '../config';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div style={{ padding: '60px 0 90px' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div className="badge" style={{ marginBottom: '12px' }}>Legal Document • Play Store Compliant</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '12px', color: '#FFFFFF' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Effective Date: {zupifyConfig.lastUpdated} | Entity: <strong>{zupifyConfig.legalEntityName}</strong> | App: <strong>{zupifyConfig.appName} ({zupifyConfig.packageName})</strong>
          </p>
        </div>

        {/* Content Box */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '0.95rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '12px' }}>1. Introduction & Overview</h2>
            <p>
              {zupifyConfig.legalEntityName} ("Zupify", "we", "our", or "us") operates the {zupifyConfig.appName} mobile software application (Package: <code>{zupifyConfig.packageName}</code>), associated web applications, and backend microservices (collectively referred to as the "Platform"). This Privacy Policy clarifies how we collect, store, safeguard, process, and handle user information when you engage our ride-hailing, food delivery, community bazaar, and essential supplies services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '12px' }}>2. Data Safety & Information We Collect</h2>
            <p style={{ marginBottom: '12px' }}>
              In compliance with Google Play Store Developer Guidelines and the Indian Information Technology Act (2000), we only solicit data essential for service dispatch:
            </p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <li>
                <strong style={{ color: '#FFFFFF' }}>Phone Number & Identity:</strong> Mobile numbers collected during authentication are verified using one-time SMS passwords (OTP). We store your account profile name to personalize communication and driver/restaurant dispatch notes.
              </li>
              <li>
                <strong style={{ color: '#FFFFFF' }}>Location Data (ACCESS_FINE_LOCATION & ACCESS_COARSE_LOCATION):</strong> Foreground GPS data is collected when you book a ride to automatically identify your pickup spot, calculate ride distances, estimate arrival times, and display nearby dining providers. <span style={{ color: '#F87171' }}>We do NOT track background device telemetry when the application is exited or closed.</span>
              </li>
              <li>
                <strong style={{ color: '#FFFFFF' }}>Notifications (POST_NOTIFICATIONS):</strong> Used solely to transmit critical transaction alerts: ride confirmation codes (OTP), live driver transit progress, and food order delivery milestones.
              </li>
              <li>
                <strong style={{ color: '#FFFFFF' }}>Camera & Image Library:</strong> Used only when you intentionally upload a profile image or snap photographs to list pre-owned items on the community Bazaar.
              </li>
              <li>
                <strong style={{ color: '#FFFFFF' }}>Financial & Payment Tokens:</strong> All electronic transactions (UPI, Credit/Debit cards, Net Banking) are processed via RBI-authorized payment aggregators (e.g., Razorpay). We never capture, record, or retain CVV numbers, card PINs, or netbanking passwords on Zupify servers.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '12px' }}>3. Purpose & Use of Data</h2>
            <p style={{ marginBottom: '10px' }}>Your personal information is leveraged strictly to fulfill service operations:</p>
            <ol style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Matching passenger ride requests with licensed driver captains in geographical proximity.</li>
              <li>Transmitting order specs to restaurant chefs and coordinating delivery drop-offs.</li>
              <li>Preventing unauthorized account access via OTP validation and rate-limiting safeguards.</li>
              <li>Delivering responsive customer assistance and grievance investigations.</li>
            </ol>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '12px' }}>4. Data Retention & Deletion Rights</h2>
            <p style={{ marginBottom: '10px' }}>
              We retain user records only as long as necessary to maintain active accounts or satisfy statutory accounting standards under Indian commercial regulations.
            </p>
            <p>
              Users retain full autonomy to purge their personal details at any moment. You can execute an instant account deletion directly from the mobile app settings or through our dedicated web portal:
            </p>
            <div style={{ marginTop: '12px', padding: '16px', background: 'rgba(37, 99, 235, 0.08)', borderRadius: '10px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
              👉 Visit our <strong style={{ color: '#60A5FA' }}>Data Deletion Portal</strong> or mail our privacy officer at <a href={`mailto:${zupifyConfig.supportEmail}`} style={{ color: '#93C5FD' }}>{zupifyConfig.supportEmail}</a>.
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '12px' }}>5. Third-Party Disclosures & Security Safeguards</h2>
            <p style={{ marginBottom: '10px' }}>
              We do NOT sell, rent, or trade your personal information to third-party advertising brokers. Data is exchanged only with strictly necessary infrastructure vendors:
            </p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Mapbox:</strong> For reverse-geocoding, pickup address queries, and vector map display.</li>
              <li><strong>Payment Aggregators (Razorpay / Easebuzz):</strong> For PCI-DSS compliant checkout tokenization.</li>
              <li><strong>SMS Telecom Gateways:</strong> For sending 6-digit authentication OTP codes.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '12px' }}>6. Contact & Grievance Redressal</h2>
            <p>
              In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, the designated Grievance Officer details are published below:
            </p>
            <div style={{ marginTop: '12px', padding: '18px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <p><strong style={{ color: '#FFFFFF' }}>Grievance Officer:</strong> {zupifyConfig.grievanceOfficerName}</p>
              <p><strong style={{ color: '#FFFFFF' }}>Entity:</strong> {zupifyConfig.legalEntityName}</p>
              <p><strong style={{ color: '#FFFFFF' }}>Email:</strong> <a href={`mailto:${zupifyConfig.grievanceOfficerEmail}`} style={{ color: '#60A5FA' }}>{zupifyConfig.grievanceOfficerEmail}</a></p>
              <p><strong style={{ color: '#FFFFFF' }}>Address:</strong> {zupifyConfig.businessAddress}</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};
