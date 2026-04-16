import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { LogOut } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { LoginModal } from './components/LoginModal';
import { CustomCursor } from './components/CustomCursor';
import { ParticleField } from './components/ParticleField';
import { RoleSelection } from './components/RoleSelection';
import type { UserRole } from './components/RoleSelection';
import type { ChildProfile } from './components/AdminDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { Hero } from './sections/Hero';
import { About } from './sections/About';
import { Works } from './sections/Works';
import { Services } from './sections/Services';
import { FAQ } from './sections/FAQ';
import { Testimonials } from './sections/Testimonials';
import { Pricing } from './sections/Pricing';
import { Blog } from './sections/Blog';
import { Contact } from './sections/Contact';
import { Footer } from './sections/Footer';
import { siteConfig } from './config';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import BackendTest from './components/BackendTest';

gsap.registerPlugin(ScrollTrigger);

interface ParentData {
  fullName: string;
  email: string;
  childName: string;
  childClass: string;
}

function App() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isGuestChild, setIsGuestChild] = useState(false);
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [isParentInDashboard, setIsParentInDashboard] = useState(false);

  useEffect(() => {
    // Check if role is stored in sessionStorage to avoid repeated selection in same session
    const storedRole = sessionStorage.getItem('userRole') as UserRole;
    if (storedRole) {
      setSelectedRole(storedRole);
    }

    // Check if child has visited before (for returning child detection)
    const hasVisited = localStorage.getItem('childHasVisited');
    if (hasVisited === 'true') {
      setIsGuestChild(true);
    }

    // Check for returning parent
    const parentChildName = localStorage.getItem('parentChildName');
    if (parentChildName) {
      setParentData({
        fullName: localStorage.getItem('parentFullName') || '',
        email: localStorage.getItem('parentEmail') || '',
        childName: parentChildName,
        childClass: localStorage.getItem('parentChildClass') || ''
      });
    }

    if (siteConfig.title) {
      document.title = siteConfig.title;
    }
    if (siteConfig.language) {
      document.documentElement.lang = siteConfig.language;
    }

    // Refresh ScrollTrigger after initial render
    const scrollTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(scrollTimer);
    };
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    sessionStorage.setItem('userRole', role);

    // Mark child as having visited
    if (role === 'child') {
      localStorage.setItem('childHasVisited', 'true');
      setIsGuestChild(true);
    }
  };

  const handleParentLogin = (user: any, pData: ParentData, cProfile?: ChildProfile | null) => {
    setParentData(pData);
    setChildProfile(cProfile ?? null);

    // Store parent data locally
    localStorage.setItem('parentHasVisited', 'true');
    localStorage.setItem('parentChildName', pData.childName);
    localStorage.setItem('parentChildClass', pData.childClass);
    localStorage.setItem('parentFullName', pData.fullName);
    localStorage.setItem('parentEmail', pData.email);

    // Auto-login the child
    localStorage.setItem('guestChildName', pData.childName);
    localStorage.setItem('childHasVisited', 'true');
    setIsGuestChild(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}
    
    setSelectedRole(null);
    setIsGuestChild(false);
    setParentData(null);
    setChildProfile(null);
    setIsParentInDashboard(false);
    sessionStorage.removeItem('userRole');
  };

  // Check if we're in test mode (add ?test=true to URL)
  const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';

  if (isTestMode) {
    return <BackendTest />;
  }

  // If no role selected, show RoleSelection
  if (!selectedRole) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        <CustomCursor />
        <ParticleField />
        <RoleSelection onSelect={handleRoleSelect} onParentLogin={handleParentLogin} />
      </div>
    );
  }

  // If admin selected, show AdminDashboard (or parent dashboard if parent chose that option)
  if (selectedRole === 'admin' || isParentInDashboard) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
        <CustomCursor />
        <AdminDashboard 
          onLogout={handleLogout} 
          isParentDashboard={isParentInDashboard}
          parentData={parentData}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
      {/* Noise texture overlay */}
      <div className="noise-overlay" />

      {/* Custom cursor */}
      <CustomCursor />

      {/* Particle field */}
      <ParticleField />

      {/* Login Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Navigation - pass parent child name for auto-login */}
      <Navigation 
        onLoginClick={() => setIsLoginOpen(true)} 
        isGuestChild={isGuestChild}
        parentChildName={parentData?.childName}
      />

      {/* Main content */}
      <main>
        <Hero />
        <About />
        <Works 
          isGuestChild={isGuestChild} 
          onSignupClick={() => setIsLoginOpen(true)}
          isParentChild={!!parentData}
          childClass={parentData?.childClass || localStorage.getItem('parentChildClass') || ''}
        />
        <Services />
        <FAQ />
        <Testimonials />
        <Pricing />
        <Blog />
        <Contact />
        <Footer />
        
        {/* Role Switcher (Hidden) */}
        <button 
          onClick={handleLogout}
          className="fixed bottom-8 right-8 z-40 w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all opacity-20 hover:opacity-100 group"
          title="Switch Role"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-white" />
        </button>
      </main>
    </div>
  );
}

export default App;
