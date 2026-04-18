import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, Lock, ArrowRight, Loader2, Users } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import type { ConfirmationResult, User as FirebaseUser } from 'firebase/auth';

interface ParentPhoneLoginProps {
  onComplete: (user: FirebaseUser, parentData: ParentData) => void;
  onBack: () => void;
}

interface ParentData {
  fullName: string;
  phone: string;
  childName: string;
  childClass: string;
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export function ParentPhoneLogin({ onComplete, onBack }: ParentPhoneLoginProps) {
  const [step, setStep] = useState<'phone' | 'otp' | 'details'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parentData, setParentData] = useState<ParentData>({
    fullName: '',
    phone: '',
    childName: '',
    childClass: ''
  });

  useEffect(() => {
    const container = document.getElementById('recaptcha-container');
    if (container && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {}
      });
    }

    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
        window.recaptchaVerifier = undefined;
      }
    };
  }, []);

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      
      if (!window.recaptchaVerifier) {
        throw new Error('Recaptcha not initialized');
      }

      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formattedPhone,
        window.recaptchaVerifier
      );

      window.confirmationResult = confirmationResult;
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length < 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (!window.confirmationResult) {
        throw new Error('OTP session expired. Please request a new OTP.');
      }

      const result = await window.confirmationResult.confirm(otp);
      const user = result.user;

      // Check if parent already exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        // Returning parent - get their data
        const data = userDoc.data();
        onComplete(user, {
          fullName: data.fullName || '',
          phone: data.phone || user.phoneNumber || '',
          childName: data.childName || '',
          childClass: data.childClass || ''
        });
      } else {
        // New parent - need to collect details
        setParentData(prev => ({ ...prev, phone: user.phoneNumber || phone }));
        setStep('details');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async (user: FirebaseUser) => {
    if (!parentData.fullName || !parentData.childName) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save parent and child data to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName: parentData.fullName,
        phone: parentData.phone,
        childName: parentData.childName,
        childClass: parentData.childClass,
        role: 'parent',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }, { merge: true });

      // Create child profile
      await setDoc(doc(db, "children", `${user.uid}_child`), {
        parentId: user.uid,
        name: parentData.childName,
        grade: parentData.childClass || 'Class 1',
        progress: 0,
        streak: 0,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Store child info locally for auto-login
      localStorage.setItem('parentChildName', parentData.childName);
      localStorage.setItem('parentChildClass', parentData.childClass);
      localStorage.setItem('childHasVisited', 'true');

      onComplete(user, parentData);
    } catch (err: any) {
      setError(err.message || 'Failed to save details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-4">
      <div id="recaptcha-container"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-slate-900/90 rounded-[2rem] border border-white/10 p-10 shadow-2xl backdrop-blur-2xl"
      >
        <button
          onClick={onBack}
          className="mb-6 text-slate-400 hover:text-white text-sm flex items-center gap-2 transition-colors"
        >
          ← Back to role selection
        </button>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
            <Users className="w-10 h-10 text-purple-400" />
          </div>
          <h2 className="text-3xl font-black text-white">
            {step === 'phone' && 'Parent Login'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'details' && 'Child Details'}
          </h2>
          <p className="text-slate-400 mt-2">
            {step === 'phone' && 'Enter your phone number to continue'}
            {step === 'otp' && `OTP sent to ${phone}`}
            {step === 'details' && 'Tell us about your child'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {step === 'phone' && (
            <>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="tel"
                  placeholder="Phone Number (e.g. 9876543210)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-white outline-none transition-all focus:border-purple-400/50 focus:bg-white/10 placeholder:text-slate-500"
                />
              </div>

              <button
                onClick={handleSendOTP}
                disabled={loading || phone.length < 10}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-4 font-bold text-black shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="w-full rounded-xl border border-purple-400/30 bg-white/5 pl-12 pr-4 py-4 text-white text-center text-2xl tracking-widest outline-none transition-all focus:border-purple-400 focus:bg-white/10 placeholder:text-slate-500"
                />
              </div>

              <button
                onClick={handleVerifyOTP}
                disabled={loading || otp.length < 6}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-4 font-bold text-black shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>

              <button
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                  setError('');
                }}
                className="w-full text-slate-400 hover:text-white text-sm transition-colors"
              >
                Change phone number
              </button>
            </>
          )}

          {step === 'details' && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Your Name *</label>
                  <input
                    type="text"
                    placeholder="Parent's full name"
                    value={parentData.fullName}
                    onChange={(e) => setParentData({...parentData, fullName: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-purple-400/50 focus:bg-white/10 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Child's Name *</label>
                  <input
                    type="text"
                    placeholder="Your child's name"
                    value={parentData.childName}
                    onChange={(e) => setParentData({...parentData, childName: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-purple-400/50 focus:bg-white/10 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block">Child's Class</label>
                  <select
                    value={parentData.childClass}
                    onChange={(e) => setParentData({...parentData, childClass: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-purple-400/50 focus:bg-white/10"
                  >
                    <option value="" className="bg-slate-900">Select Class</option>
                    <option value="Class 1" className="bg-slate-900">Class 1</option>
                    <option value="Class 2" className="bg-slate-900">Class 2</option>
                    <option value="Class 3" className="bg-slate-900">Class 3</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => {
                  const user = auth.currentUser;
                  if (user) {
                    handleSaveDetails(user);
                  }
                }}
                disabled={loading || !parentData.fullName || !parentData.childName}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-4 font-bold text-black shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
