import { useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { BookOpen, Clock3, Flame, Gamepad2, Sparkles, Star, Trophy } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { CustomCursor } from './components/CustomCursor';
import { ParticleField } from './components/ParticleField';
import { RoleSelection } from './components/RoleSelection';
import type { UserRole } from './components/RoleSelection';
import type { ChildProfile } from './types/childProgress';
import { AdminDashboard } from './components/AdminDashboard';
import { ParentDashboard } from './components/ParentDashboard';
import { ChildLearningHub } from './components/ChildLearningHub';
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
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import BackendTest from './components/BackendTest';
import { ensureChildProfile, flushPendingChildActivityLogs, recordChildActivity } from './services/childProgressService';

gsap.registerPlugin(ScrollTrigger);

const PARENT_SESSION_KEY = 'parentSessionStartedAt';
const PARENT_SESSION_MAX_AGE_MS = 21 * 24 * 60 * 60 * 1000;
const ACTIVE_CHILD_ID_KEY = 'activeChildId';

interface ParentData {
  fullName: string;
  email: string;
  childName: string;
  childClass: string;
  childAge: string;
  schoolName: string;
  learningGoal: string;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function formatShortDate(value?: string) {
  if (!value) {
    return 'Not active yet';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Not active yet';
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function App() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>('child');
  const [isGuestChild, setIsGuestChild] = useState(false);
  const [parentData, setParentData] = useState<ParentData | null>(null);
  const [childProfiles, setChildProfiles] = useState<ChildProfile[]>([]);
  const [childProfile, setChildProfile] = useState<ChildProfile | null>(null);
  const [isParentInDashboard, setIsParentInDashboard] = useState(false);
  const [isLearningHubOpen, setIsLearningHubOpen] = useState(false);
  const storedSessionStartedAt = localStorage.getItem(PARENT_SESSION_KEY);
  const hasValidParentSessionWindow =
    !!storedSessionStartedAt &&
    !Number.isNaN(Number(storedSessionStartedAt)) &&
    Date.now() - Number(storedSessionStartedAt) <= PARENT_SESSION_MAX_AGE_MS;
  const hasRememberedParentSession =
    hasValidParentSessionWindow &&
    (!!parentData || !!localStorage.getItem('parentHasVisited') || !!auth.currentUser);
  const shouldShowParentDashboard =
    hasRememberedParentSession &&
    (
      selectedRole === 'parent' ||
      isParentInDashboard ||
      sessionStorage.getItem('userRole') === 'parent'
    );

  useEffect(() => {
    // 1. Auth State Listener for Persistent Login
    let unsubscribeChildren: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (unsubscribeChildren) {
        unsubscribeChildren();
        unsubscribeChildren = undefined;
      }

      if (user) {
        const sessionAge = storedSessionStartedAt ? Date.now() - Number(storedSessionStartedAt) : 0;

        if (storedSessionStartedAt && (!Number.isNaN(sessionAge) && sessionAge > PARENT_SESSION_MAX_AGE_MS)) {
          await signOut(auth);
          localStorage.removeItem(PARENT_SESSION_KEY);
          localStorage.removeItem('parentHasVisited');
          setParentData(null);
          setChildProfile(null);
          setIsParentInDashboard(false);
          setSelectedRole('child');
          return;
        }

        if (!storedSessionStartedAt) {
          localStorage.setItem(PARENT_SESSION_KEY, Date.now().toString());
        }

        // Fetch parent details from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const pData = {
              fullName: data.fullName || '',
              email: data.email || user.email || '',
              childName: data.childName || '',
              childClass: data.childClass || '',
              childAge: data.childAge ? String(data.childAge) : '',
              schoolName: data.schoolName || '',
              learningGoal: data.learningGoal || 'Build daily learning habit',
            };
            setParentData(pData);
            await ensureChildProfile(user.uid, pData.childName, pData.childClass);
            const childrenQuery = query(collection(db, 'children'), where('parentId', '==', user.uid));
            unsubscribeChildren = onSnapshot(childrenQuery, async (snapshot) => {
              const profiles = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as ChildProfile));
              setChildProfiles(profiles);
              const preferredId = localStorage.getItem(ACTIVE_CHILD_ID_KEY);
              const selected = profiles.find((profile) => profile.id === preferredId) || profiles[0] || null;
              setChildProfile(selected);

              if (selected) {
                localStorage.setItem(ACTIVE_CHILD_ID_KEY, selected.id);
                localStorage.setItem('parentChildName', selected.name);
                localStorage.setItem('parentChildClass', selected.grade);
                localStorage.setItem('guestChildName', selected.name);
                if (selected.age) localStorage.setItem('parentChildAge', String(selected.age));
                if (selected.schoolName) localStorage.setItem('parentSchoolName', selected.schoolName);
                if (selected.learningGoal) localStorage.setItem('parentLearningGoal', selected.learningGoal);
                await flushPendingChildActivityLogs(user.uid, selected.id, selected.name, selected.grade);
              }
            });

            // Always open authenticated parents in parent flow.
            // This prevents stale stored roles from redirecting to unrelated pages.
            setSelectedRole('parent');
            setIsParentInDashboard(true);
            sessionStorage.setItem('userRole', 'parent');

            // Mark child as visited/logged in
            localStorage.setItem('childHasVisited', 'true');
            setIsGuestChild(true);
          }
        } catch (err) {
          console.error("Error restoring session:", err);
        }
      } else {
        // For non-authenticated visitors, keep website on default child/home experience.
        setSelectedRole('child');
        setIsParentInDashboard(false);
        setChildProfiles([]);
        setChildProfile(null);
      }
    });

    // Check if child has visited before (for guest child name)
    const hasVisited = localStorage.getItem('childHasVisited');
    if (hasVisited === 'true') {
      setIsGuestChild(true);
    }

    // Restore guest child name if exists
    const guestName = localStorage.getItem('guestChildName');
    if (guestName) {
      // Logic handled in Navigation.tsx
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
      if (unsubscribeChildren) {
        unsubscribeChildren();
      }
      unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (selectedRole !== 'child' || !auth.currentUser || !parentData) {
      return;
    }

    const sessionStartedAt = Date.now();

    return () => {
      const elapsedMs = Date.now() - sessionStartedAt;
      if (elapsedMs < 15000) {
        return;
      }

      const minutes = Math.max(1, Math.round(elapsedMs / 60000));
      void recordChildActivity(
        auth.currentUser!.uid,
        childProfile?.id,
        childProfile?.name || parentData.childName,
        childProfile?.grade || parentData.childClass,
        {
        type: 'study_session',
        title: 'Website learning session',
        subject: 'General',
        source: 'main-website',
        minutes,
        },
      );
    };
  }, [selectedRole, parentData, childProfile]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    sessionStorage.setItem('userRole', role);

    if (role === 'parent') {
      setIsParentInDashboard(true);
      return;
    }

    setIsParentInDashboard(false);

    // Mark child as having visited
    if (role === 'child') {
      localStorage.setItem('childHasVisited', 'true');
      setIsGuestChild(true);
    }
  };

  const rememberParentSession = () => {
    localStorage.setItem(PARENT_SESSION_KEY, Date.now().toString());
  };

  const handleParentLogin = (_user: any, pData: ParentData, cProfile?: ChildProfile | null) => {
    setParentData(pData);
    setChildProfile(cProfile ?? null);
    setChildProfiles(cProfile ? [cProfile] : []);
    setSelectedRole('parent');
    setIsParentInDashboard(true);
    rememberParentSession();
    sessionStorage.setItem('userRole', 'parent');

    // Store parent data locally
    localStorage.setItem('parentHasVisited', 'true');
    localStorage.setItem('parentChildName', pData.childName);
    localStorage.setItem('parentChildClass', pData.childClass);
    localStorage.setItem('parentChildAge', pData.childAge);
    localStorage.setItem('parentSchoolName', pData.schoolName);
    localStorage.setItem('parentLearningGoal', pData.learningGoal);
    localStorage.setItem('parentFullName', pData.fullName);
    localStorage.setItem('parentEmail', pData.email);
    if (cProfile?.id) {
      localStorage.setItem(ACTIVE_CHILD_ID_KEY, cProfile.id);
    }

    // Auto-login the child
    localStorage.setItem('guestChildName', pData.childName);
    localStorage.setItem('childHasVisited', 'true');
    setIsGuestChild(true);
  };

  const handleSwitchRole = () => {
    const hasValidParentSession =
      !!auth.currentUser &&
      !!localStorage.getItem(PARENT_SESSION_KEY);

    if (hasValidParentSession) {
      setSelectedRole(null);
      setIsParentInDashboard(false);
      sessionStorage.removeItem("userRole");
      return;
    }

    setSelectedRole(null);
    setIsGuestChild(false);
    setParentData(null);
    setChildProfiles([]);
    setChildProfile(null);
    setIsParentInDashboard(false);
    sessionStorage.removeItem("userRole");
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {}

    setSelectedRole(null);
    setIsGuestChild(false);
    setParentData(null);
    setChildProfiles([]);
    setChildProfile(null);
    setIsParentInDashboard(false);
    sessionStorage.removeItem("userRole");
    localStorage.removeItem(PARENT_SESSION_KEY);
    localStorage.removeItem('parentHasVisited');
  };

  const handleOpenLearningMode = () => {
    setSelectedRole('child');
    setIsParentInDashboard(false);
    sessionStorage.setItem('userRole', 'child');
    localStorage.setItem('childHasVisited', 'true');
    setIsGuestChild(true);
  };

  const handleOpenLearningHub = () => {
    setIsLearningHubOpen(true);
  };

  const handleCloseLearningHub = () => {
    setIsLearningHubOpen(false);
  };

  const handleProfileUpdated = (profile: {
    childId?: string;
    childName: string;
    childClass: string;
    childAge: string;
    schoolName: string;
    learningGoal: string;
  }) => {
    setParentData((prev) => prev ? ({
      ...prev,
      childName: profile.childName,
      childClass: profile.childClass,
      childAge: profile.childAge,
      schoolName: profile.schoolName,
      learningGoal: profile.learningGoal,
    }) : prev);
  };

  const handleOpenParentAccess = () => {
    if (hasRememberedParentSession) {
      setSelectedRole('parent');
      setIsParentInDashboard(true);
      sessionStorage.setItem('userRole', 'parent');
      return;
    }
    setSelectedRole(null);
    setIsParentInDashboard(false);
    sessionStorage.removeItem("userRole");
  };

  const handleSelectChildProfile = (childId: string) => {
    const selected = childProfiles.find((profile) => profile.id === childId);
    if (!selected) {
      return;
    }

    setChildProfile(selected);
    localStorage.setItem(ACTIVE_CHILD_ID_KEY, selected.id);
    localStorage.setItem('parentChildName', selected.name);
    localStorage.setItem('parentChildClass', selected.grade);
    localStorage.setItem('guestChildName', selected.name);
    if (selected.age) localStorage.setItem('parentChildAge', String(selected.age));
    if (selected.schoolName) localStorage.setItem('parentSchoolName', selected.schoolName);
    if (selected.learningGoal) localStorage.setItem('parentLearningGoal', selected.learningGoal);
    setParentData((prev) => prev ? ({
      ...prev,
      childName: selected.name,
      childClass: selected.grade,
      childAge: selected.age ? String(selected.age) : prev.childAge,
      schoolName: selected.schoolName || prev.schoolName,
      learningGoal: selected.learningGoal || prev.learningGoal,
    }) : prev);
  };

  // Check if we're in test mode (add ?test=true to URL)
  const isTestMode = new URLSearchParams(window.location.search).get('test') === 'true';
  const childAge = childProfile?.age ? String(childProfile.age) : parentData?.childAge || localStorage.getItem('parentChildAge') || '';
  const childSchoolName = childProfile?.schoolName || parentData?.schoolName || localStorage.getItem('parentSchoolName') || '';
  const childLearningGoal = childProfile?.learningGoal || parentData?.learningGoal || localStorage.getItem('parentLearningGoal') || '';
  const childName = parentData?.childName || childProfile?.name || 'Student';
  const childInitials = childName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'S';
  const childProgress = clamp(childProfile?.progress ?? 0);
  const childStreak = Math.max(0, childProfile?.streak ?? 0);
  const childStars = childProfile?.starsEarned ?? 0;
  const childStudyMinutes = childProfile?.totalStudyMinutes ?? 0;
  const childGamesPlayed = childProfile?.gamesPlayed ?? 0;
  const childBadges = childProfile?.badgesUnlocked ?? 0;
  const childLastPlayedGame = childProfile?.lastPlayedGame || 'No game played yet';
  const childLastActive = formatShortDate(childProfile?.lastActive);
  const strongestSubjectEntry = Object.entries(childProfile?.subjectProgress || {}).sort((a, b) => (b[1] || 0) - (a[1] || 0))[0];
  const strongestSubject = strongestSubjectEntry && strongestSubjectEntry[1] > 0 ? strongestSubjectEntry[0] : 'Just getting started';

  if (isTestMode) {
    return <BackendTest />;
  }

  // If no role selected, show RoleSelection
  if (!selectedRole) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        <CustomCursor />
        <ParticleField />
        <RoleSelection
          onSelect={handleRoleSelect}
          onParentLogin={handleParentLogin}
          canAutoOpenParentDashboard={hasRememberedParentSession}
        />
      </div>
    );
  }

  // If admin selected, show AdminDashboard (or parent dashboard if parent chose that option)
  if (selectedRole === 'admin') {
    return (
      <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
        <CustomCursor />
        <AdminDashboard 
          onLogout={handleLogout} 
        />
      </div>
    );
  }

  if (shouldShowParentDashboard) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
        <CustomCursor />
        <ParticleField />
        <ParentDashboard
          onLogout={handleLogout}
          onOpenLearningMode={handleOpenLearningMode}
          onProfileUpdated={handleProfileUpdated}
          childProfiles={childProfiles}
          activeChildId={childProfile?.id}
          onSelectChildProfile={handleSelectChildProfile}
          parentData={parentData}
          childProfile={childProfile}
        />
      </div>
    );
  }

  if (selectedRole === 'child' && isLearningHubOpen) {
    return (
      <div className="relative min-h-screen bg-black text-white overflow-x-hidden">
        <CustomCursor />
        <ParticleField />
        <ChildLearningHub
          childName={childName}
          childClass={parentData?.childClass || childProfile?.grade || localStorage.getItem('parentChildClass') || ''}
          onClose={handleCloseLearningHub}
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

      {/* Navigation - pass parent child name for auto-login */}
      <Navigation 
        onLoginClick={handleOpenParentAccess} 
        isGuestChild={isGuestChild}
        parentChildName={parentData?.childName}
        onSwitchRole={handleSwitchRole}
        onOpenLearningHub={handleOpenLearningHub}
        selectedRole={selectedRole}
      />

      {(parentData || childProfile) && (
        <div id="child-profile-panel" className="relative z-30 mx-auto mt-24 max-w-7xl px-8 lg:px-16">
          <div className="overflow-hidden rounded-[2.2rem] border border-cyan-500/20 bg-slate-950/75 backdrop-blur-xl shadow-2xl shadow-cyan-500/10">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.14),transparent_34%)]" />
            <div className="grid gap-0 lg:grid-cols-[1.1fr_1.4fr]">
              <div className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-400">Mini Dashboard</p>
                    <h2 className="mt-3 text-3xl font-black text-white">{childName}</h2>
                    <p className="mt-2 text-sm text-slate-400">
                      Ready to learn with parent access already set up in the background.
                    </p>
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-gradient-to-br from-cyan-400 via-sky-400 to-blue-500 text-2xl font-black text-slate-950 shadow-lg shadow-cyan-500/20">
                    {childInitials}
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/25 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Journey Progress</p>
                      <p className="mt-2 text-4xl font-black text-white">{childProgress}%</p>
                    </div>
                    <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
                      <Trophy className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500"
                      style={{ width: `${childProgress}%` }}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                      Class {parentData?.childClass || childProfile?.grade || '-'}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                      Age {childAge || '-'}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300">
                      Best subject: {strongestSubject}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    {
                      label: 'Current Streak',
                      value: `${childStreak} days`,
                      note: childStreak > 0 ? 'Keep it going' : 'Start today',
                      icon: <Flame className="h-5 w-5 text-orange-300" />,
                    },
                    {
                      label: 'Stars Earned',
                      value: String(childStars),
                      note: 'Rewards collected',
                      icon: <Star className="h-5 w-5 text-amber-300" />,
                    },
                    {
                      label: 'Games Played',
                      value: String(childGamesPlayed),
                      note: 'Interactive sessions',
                      icon: <Gamepad2 className="h-5 w-5 text-cyan-300" />,
                    },
                    {
                      label: 'Study Time',
                      value: `${childStudyMinutes} min`,
                      note: 'Tracked learning time',
                      icon: <Clock3 className="h-5 w-5 text-emerald-300" />,
                    },
                  ].map((card) => (
                    <div key={card.label} className="rounded-[1.6rem] border border-white/10 bg-black/25 p-4">
                      <div className="flex items-center justify-between">
                        <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">{card.label}</p>
                        {card.icon}
                      </div>
                      <p className="mt-3 text-2xl font-black text-white">{card.value}</p>
                      <p className="mt-1 text-sm text-slate-400">{card.note}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                  <div className="rounded-[1.8rem] border border-white/10 bg-black/25 p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Last Played</p>
                        <p className="mt-2 text-lg font-black text-white">{childLastPlayedGame}</p>
                        <p className="mt-2 text-sm text-slate-400">
                          Last active on <span className="font-semibold text-white">{childLastActive}</span>
                        </p>
                      </div>
                      <div className="rounded-2xl bg-white/5 p-3 text-sky-300">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] border border-white/10 bg-black/25 p-5">
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Child Focus</p>
                    <p className="mt-2 text-lg font-black text-white">{childLearningGoal || 'Build daily learning habit'}</p>
                    <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                      <Sparkles className="h-4 w-4 text-cyan-300" />
                      <span>{childBadges} badge{childBadges === 1 ? '' : 's'} unlocked</span>
                    </div>
                    {childSchoolName && (
                      <p className="mt-2 text-sm text-slate-400">
                        School: <span className="font-semibold text-white">{childSchoolName}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main>
        <Hero />
        <About />
        <Works 
          isGuestChild={isGuestChild} 
          onSignupClick={handleOpenParentAccess}
          isParentChild={!!parentData}
          onOpenLearningHub={handleOpenLearningHub}
          childClass={parentData?.childClass || localStorage.getItem('parentChildClass') || ''}
        />
        <Services />
        <FAQ />
        <Testimonials />
        <Pricing />
        <Blog />
        <Contact />
        <Footer />
      </main>
    </div>
  );
}

export default App;
