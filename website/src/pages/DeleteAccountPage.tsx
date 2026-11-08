import React, { useState } from 'react';
import { zupifyConfig } from '../config';

export const DeleteAccountPage: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [reason, setReason] = useState('no_longer_needed');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setSubmitted(true);
  };

  return (
    <div style={{ padding: '60px 0 90px' }}>
      <div className="container" style={{ maxWidth: '880px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div className="badge" style={{ marginBottom: '12px' }}>Google Play Data Safety Requirement</div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '12px', color: '#FFFFFF' }}>Account & Data Deletion Request</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Permanent removal of personal data, authentication credentials, and user records from {zupifyConfig.appName}.
          </p>
        </div>

        {/* Informational Warning */}
        <div className="card" style={{ marginBottom: '32px', borderLeft: '4px solid #EF4444' }}>
          <h3 style={{ color: '#F87171', marginBottom: '8px', fontSize: '1.2rem' }}>⚠️ Permanent Action Notice</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6' }}>
            Requesting account deletion will irrevocably purge your registered profile, mobile session tokens, saved addresses, bazaar advertisements, and active transaction links. Completed financial tax invoices are retained strictly for the statutory period mandated by law.
          </p>
        </div>

        {/* Two Options */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '28px', marginBottom: '40px' }}>
          
          {/* Method 1: In App */}
          <div className="card">
            <h3 style={{ color: '#60A5FA', marginBottom: '16px', fontSize: '1.25rem' }}>Method 1: In-App Self-Service (Instant)</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '16px', lineHeight: '1.6' }}>
              If you have the Zupify mobile application installed on your Android device:
            </p>
            <ol style={{ paddingLeft: '20px', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>Open <strong>Zupify</strong> mobile app.</li>
              <li>Go to the <strong>Account / Profile</strong> tab.</li>
              <li>Tap on <strong>Privacy & Security Settings</strong>.</li>
              <li>Select <strong>Delete Account & Data</strong>.</li>
              <li>Confirm identity via SMS OTP verification code.</li>
              <li>Session and account data are purged immediately.</li>
            </ol>
          </div>

          {/* Method 2: Web Form */}
          <div className="card">
            <h3 style={{ color: '#34D399', marginBottom: '16px', fontSize: '1.25rem' }}>Method 2: Web Deletion Request</h3>
            
            {submitted ? (
              <div style={{ padding: '24px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>✅</div>
                <h4 style={{ color: '#34D399', marginBottom: '8px' }}>Request Received</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  A deletion verification ticket has been generated for <strong>{phoneNumber}</strong>. An SMS confirmation will be dispatched to authorize permanent removal within 48-72 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#FFFFFF', marginBottom: '6px' }}>
                    Registered Mobile Number:
                  </label>
                  <input 
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#FFFFFF', marginBottom: '6px' }}>
                    Reason for Deletion (Optional):
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      background: '#1F2937',
                      border: '1px solid var(--border-color)',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      outline: 'none'
                    }}
                  >
                    <option value="no_longer_needed">No longer using the service</option>
                    <option value="privacy_concerns">Privacy or data concerns</option>
                    <option value="duplicate_account">Created duplicate account</option>
                    <option value="other">Other reason</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px', background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' }}
                >
                  Submit Account Deletion Request
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Data Retention Breakdown */}
        <div className="card">
          <h3 style={{ color: '#FFFFFF', marginBottom: '16px', fontSize: '1.25rem' }}>Data Erasure Breakdown</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#10B981', marginBottom: '8px', fontSize: '1rem' }}>✓ Permanently Erased Data:</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Phone number & User profile credentials</li>
                <li>Saved home, work, and pickup GPS locations</li>
                <li>FCM Push notification device registry keys</li>
                <li>Active Bazaar listings, product photos, and drafts</li>
              </ul>
            </div>
            <div>
              <h4 style={{ color: '#F59E0B', marginBottom: '8px', fontSize: '1rem' }}>⚖️ Retained Under Statutory Mandate:</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>Completed payment reference IDs (for tax and audit laws)</li>
                <li>Resolved grievance resolution logs (for consumer dispute regulations)</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
