import React from 'react';
import { zupifyConfig } from '../config';

export const TermsPage: React.FC = () => {
  return (
    <div style={{ padding: '60px 0 90px' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        <div style={{ marginBottom: '40px' }}>
          <div className="badge" style={{ marginBottom: '12px' }}>Platform Agreement</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '12px', color: '#FFFFFF' }}>Terms and Conditions</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Effective: {zupifyConfig.lastUpdated} | Publisher: {zupifyConfig.legalEntityName}
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '30px', color: 'var(--text-muted)', lineHeight: '1.7', fontSize: '0.95rem' }}>
          
          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '10px' }}>1. Agreement to Terms</h2>
            <p>
              By accessing, installing, downloading, or engaging with the {zupifyConfig.appName} mobile application or web portal, you acknowledge and agree to comply with these terms. If you do not accept these terms, you are prohibited from utilizing the platform.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '10px' }}>2. Multi-Service Operations</h2>
            <p style={{ marginBottom: '8px' }}>Zupify operates as an integrated technological intermediary facilitating:</p>
            <ul style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Hyperlocal Passenger Transport:</strong> Connecting riders with independent verified driver captains.</li>
              <li><strong>Food Ordering & Delivery:</strong> Interfacing customers with independent restaurants, cafes, and delivery agents.</li>
              <li><strong>P2P Bazaar:</strong> Permitting peer-to-peer advertising of lawful secondary merchandise.</li>
              <li><strong>Water Supply Matching:</strong> Routing water tanker and container logistics to neighborhood suppliers.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '10px' }}>3. User Conduct & Security</h2>
            <p>
              Users agree to provide accurate mobile phone details and complete SMS verification. Any malicious manipulation of ride fare calculations, fraudulent payment chargebacks, or abusive behavior toward drivers, restaurant personnel, or delivery executives will result in immediate permanent account termination.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '10px' }}>4. Payments & Refunds</h2>
            <p>
              All online payments are settled via PCI-DSS compliant RBI authorized gateways. Cancellations of orders or trips are subject to the specific policy windows visible before order dispatch.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.35rem', color: '#FFFFFF', marginBottom: '10px' }}>5. Limitation of Liability</h2>
            <p>
              Zupify Technologies Pvt. Ltd. acts as an intermediary technology aggregator. We do not manufacture culinary products or own the commercial transport vehicles directly, except where explicitly stated under fleet operations.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};
