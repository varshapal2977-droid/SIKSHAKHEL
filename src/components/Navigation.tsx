import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Menu, X, User as UserIcon } from 'lucide-react';
import { navigationConfig } from '../config';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

gsap.registerPlugin(ScrollTrigger);

import type { UserRole } from "./RoleSelection";

interface NavigationProps {
  onLoginClick?: () => void;
  isGuestChild?: boolean;
  parentChildName?: string;
  onSwitchRole?: () => void;
  onOpenLearningHub?: () => void;
  selectedRole?: UserRole | null;
}

export function Navigation({ onLoginClick, isGuestChild: _isGuestChild, parentChildName, onSwitchRole, onOpenLearningHub, selectedRole }: NavigationProps) {
  const navRef = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string | null>(null);

  useEffect(() => {
    // Check for returning guest child name
    const storedGuestName = localStorage.getItem('guestChildName') || parentChildName;
    if (storedGuestName) {
      setGuestName(storedGuestName);
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch user's name from Firestore
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserName(userDoc.data().fullName || userDoc.data().email?.split('@')[0] || "User");
        } else {
          setUserName(user.email?.split('@')[0] || "User");
        }
      } else {
        setUserName(null);
      }
    });

    return () => unsubscribe();
  }, [parentChildName]);

  useEffect(() => {
    const trigger = ScrollTrigger.create({
      start: '100px top',
      end: 'max',
      onUpdate: (self) => {
        setIsScrolled(self.progress > 0);
      },
    });

    return () => {
      trigger.kill();
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const childProfileName = guestName || parentChildName || localStorage.getItem('parentChildName') || null;
  const isChildMode = selectedRole === 'child';
  const profileLabel = isChildMode && childProfileName
    ? `${childProfileName.split(' ')[0]}'s Profile`
    : userName
      ? `Welcome, ${userName.split(' ')[0]}`
      : childProfileName
        ? `${childProfileName.split(' ')[0]}'s Profile`
        : 'Parent Access';

  const handleProfileClick = () => {
    if (isChildMode) {
      const childProfilePanel = document.querySelector('#child-profile-panel');
      if (childProfilePanel instanceof HTMLElement) {
        childProfilePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setIsMobileMenuOpen(false);
      return;
    }

    onLoginClick?.();
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-black/80 backdrop-blur-md py-4'
            : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-8 lg:px-16 flex items-center justify-between">
          {/* Logo */}
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, '#hero')}
            className="text-h6 font-medium text-white hover:text-highlight transition-colors duration-300"
          >
            {navigationConfig.logo}
          </a>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-10">
            {navigationConfig.items.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavClick(e, item.href)}
                className="text-body text-white/70 hover:text-white transition-colors duration-300 relative group"
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-highlight group-hover:w-full transition-all duration-300" />
              </a>
            ))}

            <button
              onClick={() => {
                onOpenLearningHub?.();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:brightness-110"
            >
              Child Hub
            </button>
            
            {selectedRole && (
              <button
                onClick={onSwitchRole}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Switch Role</span>
              </button>
            )}

            {/* Login button / Welcome message */}
            <button
              onClick={handleProfileClick}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg ${
                userName || childProfileName
                  ? "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm" 
                  : "bg-gradient-to-r from-cyan-400 to-blue-500 text-black hover:brightness-110 shadow-cyan-500/25"
              }`}
            >
              <UserIcon className="w-4 h-4 text-cyan-400" />
              <span>{profileLabel}</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 bg-black transition-all duration-500 lg:hidden ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex flex-col items-center justify-center h-full gap-8">
          {navigationConfig.items.map((item, i) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              className="text-h3 text-white hover:text-highlight transition-colors duration-300"
              style={{
                transform: isMobileMenuOpen
                  ? "translateY(0)"
                  : "translateY(20px)",
                opacity: isMobileMenuOpen ? 1 : 0,
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.1}s`,
              }}
            >
              {item.label}
            </a>
          ))}

          <button
            onClick={() => {
              onOpenLearningHub?.();
              setIsMobileMenuOpen(false);
            }}
            className="mt-2 flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-300 bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg shadow-cyan-500/25"
            style={{
              transform: isMobileMenuOpen
                ? "translateY(0)"
                : "translateY(20px)",
              opacity: isMobileMenuOpen ? 1 : 0,
              transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${navigationConfig.items.length * 0.1}s`,
            }}
          >
            Child Hub
          </button>

          {selectedRole && (
            <button
              onClick={() => {
                onSwitchRole?.();
                setIsMobileMenuOpen(false);
              }}
              className={`mt-4 flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-300 bg-white/10 text-white border border-white/20`}
              style={{
                transform: isMobileMenuOpen
                  ? "translateY(0)"
                  : "translateY(20px)",
                opacity: isMobileMenuOpen ? 1 : 0,
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${navigationConfig.items.length * 0.1}s`,
              }}
            >
              <UserIcon className="w-5 h-5 text-slate-400" />
              <span>Switch Role</span>
            </button>
          )}
          
          {/* Mobile Login button / Welcome message */}
          <button
            onClick={handleProfileClick}
            className={`mt-4 flex items-center gap-2 px-8 py-4 rounded-xl font-bold transition-all duration-300 ${
              userName || childProfileName
                ? "bg-white/10 text-white border border-white/20" 
                : "bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-lg shadow-cyan-500/25"
            }`}
            style={{
              transform: isMobileMenuOpen
                ? "translateY(0)"
                : "translateY(20px)",
              opacity: isMobileMenuOpen ? 1 : 0,
              transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${navigationConfig.items.length * 0.1}s`,
            }}
          >
            <UserIcon className="w-5 h-5 text-cyan-400" />
            <span>{profileLabel}</span>
          </button>
        </div>
      </div>
    </>
  );
}


