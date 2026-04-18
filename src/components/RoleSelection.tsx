import React, { useState } from 'react';
import { User, Users, ShieldCheck, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { ParentEmailLogin } from './ParentEmailLogin';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User as FirebaseUser } from 'firebase/auth';
import type { ChildProfile } from '../types/childProgress';

export type UserRole = 'child' | 'parent' | 'admin';

interface ParentData {
  fullName: string;
  email: string;
  childName: string;
  childClass: string;
  childAge: string;
  schoolName: string;
  learningGoal: string;
}

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void;
  onParentLogin?: (user: FirebaseUser, parentData: ParentData, childProfile?: ChildProfile | null) => void;
  canAutoOpenParentDashboard?: boolean;
}

export function RoleSelection({ onSelect, onParentLogin, canAutoOpenParentDashboard = false }: RoleSelectionProps) {
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [error, setError] = useState('');
  const [showChildName, setShowChildName] = useState(false);
  const [childName, setChildName] = useState('');
  const [showParentLogin, setShowParentLogin] = useState(false);

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123') {
      onSelect('admin');
    } else {
      setError('Incorrect admin password');
    }
  };

  const handleChildStart = () => {
    // If child name is already in localStorage (from previous session or parent login), skip name entry
    const existingName = localStorage.getItem('guestChildName');
    if (existingName) {
      onSelect('child');
    } else {
      setShowChildName(true);
    }
  };

  const handleChildNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (childName.trim()) {
      localStorage.setItem('guestChildName', childName.trim());
      localStorage.setItem('childHasVisited', 'true');
      onSelect('child');
    }
  };

  const handleParentComplete = async (user: FirebaseUser, pData: ParentData) => {
    let fetchedChildProfile: ChildProfile | null = null;

    // Try to fetch child profile
    try {
      const childRef = doc(db, "children", `${user.uid}_child`);
      const childSnap = await getDoc(childRef);
      if (childSnap.exists()) {
        fetchedChildProfile = { id: childSnap.id, parentId: user.uid, ...childSnap.data() } as ChildProfile;
      }
    } catch (err) {
      console.warn("Could not fetch child profile:", err);
    }

    // Store in localStorage for returning parent detection
    localStorage.setItem('parentHasVisited', 'true');
    localStorage.setItem('parentChildName', pData.childName);

    if (onParentLogin) {
      onParentLogin(user, pData, fetchedChildProfile);
    }

    setShowParentLogin(false);
    onSelect('parent');
  };

  // Parent Login Flow
  if (showParentLogin) {
    return (
      <ParentEmailLogin 
        onComplete={handleParentComplete}
        onBack={() => setShowParentLogin(false)}
      />
    );
  }

  if (showChildName) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/90 rounded-[2rem] border border-white/10 p-10 shadow-2xl backdrop-blur-2xl text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-24 h-24 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30"
          >
            <Sparkles className="w-12 h-12 text-black" />
          </motion.div>
          
          <h2 className="text-3xl font-black text-white mb-2">What's your name?</h2>
          <p className="text-slate-400 mb-8">Tell us your name so we can cheer you on!</p>

          <form onSubmit={handleChildNameSubmit} className="space-y-6">
            <input
              type="text"
              placeholder="Enter your name"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              autoFocus
              maxLength={20}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-white text-center text-xl font-bold outline-none transition-all focus:border-cyan-400/50 focus:bg-white/10 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={!childName.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-4 font-bold text-black shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              Let's Play! <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <button
            type="button"
            onClick={() => setShowChildName(false)}
            className="mt-4 text-slate-500 text-sm hover:text-slate-300 transition-colors"
          >
            Back to role selection
          </button>
        </motion.div>
      </div>
    );
  }

  if (showAdminLogin) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-slate-900/90 rounded-[2rem] border border-white/10 p-10 shadow-2xl backdrop-blur-2xl"
        >
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <Lock className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white">Admin Login</h2>
            <p className="text-slate-400 mt-2">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleAdminSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  value="admin"
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white/50 outline-none cursor-not-allowed"
                />
              </div>
              <div className="relative group">
                <input
                  type="password"
                  placeholder="Enter Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white outline-none transition-all focus:border-emerald-400/50 focus:bg-white/10 placeholder:text-slate-500"
                />
              </div>
            </div>

            {error && <p className="text-rose-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 px-4 py-4 font-bold text-black shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] hover:brightness-110 flex items-center justify-center gap-2"
            >
              Access Dashboard <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => setShowAdminLogin(false)}
              className="w-full text-slate-400 text-sm hover:text-white transition-colors"
            >
              Go Back
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  const roles = [
    {
      id: 'child' as UserRole,
      title: 'I am a Child',
      description: 'Learn and play fun educational games!',
      icon: <User className="w-12 h-12" />,
      color: 'from-cyan-400 to-blue-500',
      shadow: 'shadow-cyan-500/20'
    },
    {
      id: 'parent' as UserRole,
      title: 'I am a Parent',
      description: 'Track progress and manage learning paths.',
      icon: <Users className="w-12 h-12" />,
      color: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/20'
    },
    {
      id: 'admin' as UserRole,
      title: 'Administrator',
      description: 'Manage website content and users.',
      icon: <ShieldCheck className="w-12 h-12" />,
      color: 'from-emerald-400 to-teal-500',
      shadow: 'shadow-emerald-500/20'
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black p-6 overflow-y-auto">
      {/* Background accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12 max-w-2xl"
      >
        <h1 className="text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50 mb-4">
          Welcome to <span className="text-cyan-400">Sikshakhel</span>
        </h1>
        <p className="text-xl text-slate-400">Please select your role to continue your journey</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
        {roles.map((role, i) => (
          <motion.button
            key={role.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => {
              if (role.id === 'admin') {
                setShowAdminLogin(true);
              } else if (role.id === 'child') {
                handleChildStart();
              } else if (role.id === 'parent') {
                if (canAutoOpenParentDashboard) {
                  onSelect('parent');
                } else {
                  setShowParentLogin(true);
                }
              }
            }}
            className="group relative flex flex-col items-center p-10 rounded-[2.5rem] bg-white/5 border border-white/10 transition-all hover:bg-white/10 hover:border-white/20 hover:scale-[1.05] active:scale-[0.98] text-center"
          >
            <div className={`w-24 h-24 bg-gradient-to-br ${role.color} rounded-3xl flex items-center justify-center mb-6 shadow-2xl ${role.shadow} group-hover:scale-110 transition-transform`}>
              <div className="text-black">{role.icon}</div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
              {role.title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              {role.description}
            </p>

            <div className="mt-8 flex items-center gap-2 text-cyan-400 font-bold text-sm opacity-0 group-hover:opacity-100 transition-all">
              Continue <ArrowRight className="w-4 h-4" />
            </div>
          </motion.button>
        ))}
      </div>

      <p className="mt-16 text-slate-500 text-sm">
        Fun Learning for Classes 1-3 | NCERT Aligned
      </p>
    </div>
  );
}
