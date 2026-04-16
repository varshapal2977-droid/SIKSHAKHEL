import { useState } from 'react';
import { submitContactForm } from '../services/contactService';
import { setupRecaptcha, sendOTP, verifyOTP } from '../phoneAuth';

function BackendTest() {
  const [contactResult, setContactResult] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [authResult, setAuthResult] = useState('');

  const testContactForm = async () => {
    try {
      const id = await submitContactForm({
        name: 'Test User',
        email: 'test@example.com',
        projectType: 'Testing',
        message: 'Backend test message'
      });
      setContactResult(`✅ Contact form works! Document ID: ${id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setContactResult(`❌ Contact form failed: ${message}`);
    }
  };

  const testSendOTP = async () => {
    try {
      setupRecaptcha();
      await sendOTP(phone);
      setAuthResult('✅ OTP sent successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAuthResult(`❌ OTP send failed: ${message}`);
    }
  };

  const testVerifyOTP = async () => {
    try {
      const user = await verifyOTP(otp);
      setAuthResult(`✅ OTP verified! User: ${user.phoneNumber}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setAuthResult(`❌ OTP verification failed: ${message}`);
    }
  };

  return (
    <div style={{ padding: '20px', background: '#000', color: '#fff', minHeight: '100vh' }}>
      <h1>🔧 Backend Test Suite</h1>

      <div style={{ margin: '20px 0' }}>
        <h2>Test Contact Form (Firestore)</h2>
        <button onClick={testContactForm} style={{ padding: '10px 20px', margin: '10px 0' }}>
          Test Contact Form
        </button>
        <p>{contactResult}</p>
      </div>

      <div style={{ margin: '20px 0' }}>
        <h2>Test Phone Authentication</h2>
        <input
          type="tel"
          placeholder="Phone number (e.g., +91XXXXXXXXXX)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          style={{ padding: '10px', margin: '10px 0', width: '300px' }}
        />
        <br />
        <button onClick={testSendOTP} style={{ padding: '10px 20px', margin: '10px 0' }}>
          Send OTP
        </button>
        <br />
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          style={{ padding: '10px', margin: '10px 0', width: '300px' }}
        />
        <br />
        <button onClick={testVerifyOTP} style={{ padding: '10px 20px', margin: '10px 0' }}>
          Verify OTP
        </button>
        <p>{authResult}</p>
      </div>

      <div id="recaptcha-container"></div>

      <div style={{ margin: '20px 0', padding: '20px', background: '#111', borderRadius: '8px' }}>
        <h3>📋 Testing Checklist</h3>
        <ul>
          <li>✅ Firebase config in .env</li>
          <li>✅ Firestore database created</li>
          <li>✅ Authentication {'>'} Phone enabled</li>
          <li>✅ Contact form submits to Firestore</li>
          <li>✅ OTP sends and verifies</li>
        </ul>
      </div>
    </div>
  );
}

export default BackendTest;