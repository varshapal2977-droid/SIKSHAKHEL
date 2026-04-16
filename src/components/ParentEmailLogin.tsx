import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2, Users, Eye, EyeOff } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';

interface ParentEmailLoginProps {
  onComplete: (user: FirebaseUser, parentData: ParentData) => void;
  onBack: () => void;
}

interface ParentData {
  fullName: string;
  email: string;
  childName: string;
  childClass: string;
}

export function ParentEmailLogin({ onComplete, onBack }: ParentEmailLoginProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'details'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [parentData, setParentData] = useState<ParentData>({
    fullName: '',
    email: '',
    childName: '',
    childClass: ''
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (mode === 'login') {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;

        // Fetch parent details
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          onComplete(user, {
            fullName: data.fullName || '',
            email: data.email || user.email || '',
            childName: data.childName || '',
            childClass: data.childClass || ''
          });
        } else {
          // Logged in but details missing? Go to details
          setParentData(prev => ({ ...prev, email: user.email || email }));
          setMode('details');
        }
      } else {
        // Signup mode
        const result = await createUserWithEmailAndPassword(auth, email, password);
        setParentData(prev => ({ ...prev, email: result.user.email || email }));
        setMode('details');
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up!');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account already exists with this email.');
      } else {
        setError(err.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDetails = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (!parentData.fullName || !parentData.childName) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Save to Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName: parentData.fullName,
        email: parentData.email,
        childName: parentData.childName,
        childClass: parentData.childClass,
        role: 'parent',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }, { merge: true });

      // Create/Update child profile
      await setDoc(doc(db, "children", `${user.uid}_child`), {
        parentId: user.uid,
        name: parentData.childName,
        grade: parentData.childClass || 'Class 1',
        progress: 0,
        streak: 0,
        lastActive: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Local persistence for auto-login
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
            {mode === 'login' && 'Parent Login'}
            {mode === 'signup' && 'Parent Sign Up'}
            {mode === 'details' && 'Child Details'}
          </h2>
          <p className="text-slate-400 mt-2">
            {mode === 'login' && 'Enter your email to access dashboard'}
            {mode === 'signup' && 'Create an account to track progress'}
            {mode === 'details' && 'Tell us about your child'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="space-y-6">
          {(mode === 'login' || mode === 'signup') && (
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-4 py-4 text-white outline-none transition-all focus:border-purple-400/50 focus:bg-white/10 placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-12 pr-12 py-4 text-white outline-none transition-all focus:border-purple-400/50 focus:bg-white/10 placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-4 font-bold text-black shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : mode === 'login' ? 'Login' : 'Sign Up'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError('');
                }}
                className="w-full text-slate-400 hover:text-white text-sm transition-colors"
              >
                {mode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
              </button>
            </form>
          )}

          {mode === 'details' && (
            <div className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Your Name *</label>
                  <input
                    type="text"
                    placeholder="Parent's full name"
                    value={parentData.fullName}
                    onChange={(e) => setParentData({...parentData, fullName: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-purple-400/50 focus:bg-white/10 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Child's Name *</label>
                  <input
                    type="text"
                    placeholder="Your child's name"
                    value={parentData.childName}
                    onChange={(e) => setParentData({...parentData, childName: e.target.value})}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-purple-400/50 focus:bg-white/10 placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 block ml-1">Child's Class</label>
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
                onClick={handleSaveDetails}
                disabled={loading || !parentData.fullName || !parentData.childName}
                className="w-full rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-4 font-bold text-black shadow-lg shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Complete Setup'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
