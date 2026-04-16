import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight, Lock, Sparkles } from 'lucide-react';
import { worksConfig } from '../config';
import type { WorkItem } from '../config';
import { auth, db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

interface WorksProps {
  isGuestChild?: boolean;
  isParentChild?: boolean;
  onSignupClick?: () => void;
  childClass?: string;
}

export function Works({ isGuestChild, isParentChild, onSignupClick, childClass }: WorksProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [projects, setProjects] = useState<WorkItem[]>(worksConfig.projects);
  const triggersRef = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    // Sync with Firestore for real-time updates from Admin Dashboard
    const q = query(collection(db, "content"), orderBy("id", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const firestoreProjects = snapshot.docs.map(doc => ({
          ...doc.data()
        } as WorkItem));
        
        // Filter projects based on child's class if logged in
        if (childClass && childClass !== '') {
          const filtered = firestoreProjects.filter(p => 
            !p.class || p.class === 'All Classes' || p.class === childClass
          );
          setProjects(filtered);
        } else {
          setProjects(firestoreProjects);
        }
      }
    }, (error) => {
      console.warn("Firestore 'content' collection not found or access denied. Using static config.", error);
    });

    return () => unsubscribe();
  }, [childClass]);

  if (!worksConfig.title || projects.length === 0) return null;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Entry animation
    const trigger = ScrollTrigger.create({
      trigger: section,
      start: 'top 80%',
      onEnter: () => {
        const tl = gsap.timeline();

        // Title letter animation
        if (titleRef.current) {
          const chars = titleRef.current.querySelectorAll('.char');
          tl.fromTo(
            chars,
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.6,
              stagger: 0.08,
              ease: 'elastic.out(1, 0.5)',
            }
          );
        }

        // Subtitle
        tl.fromTo(
          subtitleRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.3'
        );

        // Cards 3D flip
        cardsRef.current.forEach((card, i) => {
          if (card) {
            tl.fromTo(
              card,
              { rotateY: i % 2 === 0 ? -180 : 180, opacity: 0 },
              {
                rotateY: 0,
                opacity: 1,
                duration: 1,
                ease: 'expo.out',
              },
              `-=${0.85 - i * 0.15}`
            );
          }
        });
      },
      once: true,
    });
    triggersRef.current.push(trigger);

    // Scroll depth effect
    const scrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      onUpdate: (self) => {
        cardsRef.current.forEach((card, i) => {
          if (card) {
            const depth = -50 + self.progress * 100;
            gsap.set(card, {
              z: depth * (i % 2 === 0 ? 1 : -1) * 0.5,
            });
          }
        });
      },
    });
    triggersRef.current.push(scrollTrigger);

    return () => {
      triggersRef.current.forEach((t) => t.kill());
      triggersRef.current = [];
    };
  }, []);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLElement>,
    index: number
  ) => {
    const card = cardsRef.current[index];
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(card, {
      rotateX: -y * 10,
      rotateY: x * 16,
      duration: 0.1,
      ease: 'none',
    });
  };

  const handleMouseLeave = (index: number) => {
    const card = cardsRef.current[index];
    if (!card) return;

    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.4,
      ease: 'expo.out',
    });
    setHoveredIndex(null);
  };

  const titleChars = worksConfig.title.split('');

  const [lockedNotification, setLockedNotification] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  const showLockedNotification = (message: string) => {
    setLockedNotification({ show: true, message });
    setTimeout(() => setLockedNotification({ show: false, message: '' }), 3000);
  };

  const handleGameClick = (e: React.MouseEvent<HTMLAnchorElement>, projectIndex: number) => {
    const project = projects[projectIndex];
    const targetUrl = project?.contentUrl || '/gamesss.html';

    // If user is logged in, allow unlimited plays
    if (auth.currentUser || isParentChild) {
      // Allow default link behavior for logged in users
      window.location.href = targetUrl;
      return;
    }

    e.preventDefault();

    // For guest children with returning status (has visited before), allow 1 free play
    const played = Number(localStorage.getItem('gamePlays') ?? '0');

    // For guest children, only first 2 games are free, rest are locked
    if (isGuestChild && projectIndex > 1) {
      showLockedNotification('🚫 Sign up free to unlock this game and track your progress!');
      return;
    }

    // If it's a free game (index 0 or 1), allow playing even if played >= 1 if they are a guest child
    if (isGuestChild && projectIndex <= 1) {
      window.location.href = targetUrl;
      return;
    }

    if (played >= 1) {
      showLockedNotification('🎮 You\'ve played your free game! Sign up to unlock all games and save your progress.');
      return;
    }

    localStorage.setItem('gamePlays', String(played + 1));
    window.location.href = targetUrl;
  };

  const handleSignupPrompt = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showLockedNotification('🎉 Sign up now to unlock all games and become a learning star!');
    if (onSignupClick) {
      onSignupClick();
    }
  };

  return (
    <section
      ref={sectionRef}
      id="works"
      className="relative py-32 px-8 lg:px-16 bg-white overflow-hidden"
      style={{ perspective: '1200px' }}
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-16">
        <h2
          ref={titleRef}
          className="text-h1 lg:text-display-xl text-black font-medium mb-6"
        >
          {titleChars.map((char, i) => (
            <span key={i} className="char inline-block">
              {char}
            </span>
          ))}
        </h2>
        <p
          ref={subtitleRef}
          className="text-body-lg text-black/60 max-w-2xl"
        >
          {worksConfig.subtitle}
        </p>
      </div>

      {/* Projects Grid - Scattered mosaic */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {projects.map((project, index) => {
            const isLocked = isGuestChild && !isParentChild && index > 1;
            const targetUrl = project.contentUrl || '/gamesss.html';
            return (
            <a
              key={project.id}
              href={isLocked ? '#' : targetUrl}
              onClick={isLocked ? handleSignupPrompt : (e) => handleGameClick(e, index)}
              className={`relative group cursor-pointer preserve-3d ${
                index === 0 ? 'md:col-span-1 md:row-span-1' : ''
              } ${index % 2 === 0 ? 'md:-translate-y-8' : 'md:translate-y-8'}`}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform',
                transform:
                  hoveredIndex !== null && hoveredIndex !== index
                    ? `translateX(${(index - hoveredIndex) * 15}px)`
                    : 'translateX(0)',
                transition:
                  hoveredIndex !== null
                    ? 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                    : 'none',
              }}
              onMouseMove={(e) => !(isGuestChild && !isParentChild && index > 1) && handleMouseMove(e, index)}
              onMouseEnter={() => !(isGuestChild && !isParentChild && index > 1) && setHoveredIndex(index)}
              onMouseLeave={() => !(isGuestChild && !isParentChild && index > 1) && setHoveredIndex(null)}
            >
              {/* Card content */}
              <div className="relative aspect-[3/4] overflow-hidden bg-dark-gray">
                {project.image.includes('.mp4') || project.image.includes('video') || (project.image.includes('firebasestorage') && project.image.includes('content%2F')) ? (
                  <video
                    src={project.image}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className={`w-full h-full object-cover transition-all duration-600 group-hover:scale-110 group-hover:brightness-110 ${isGuestChild && !isParentChild && index > 1 ? 'grayscale opacity-50' : ''}`}
                  />
                ) : (
                  <img
                    src={project.image}
                    alt={project.title}
                    className={`w-full h-full object-cover transition-all duration-600 group-hover:scale-110 group-hover:brightness-110 ${isGuestChild && !isParentChild && index > 1 ? 'grayscale opacity-50' : ''}`}
                  />
                )}

                {/* Locked Overlay */}
                {isGuestChild && !isParentChild && index > 1 && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                    <div className="w-20 h-20 rounded-full bg-cyan-500/20 flex items-center justify-center mb-4 animate-pulse">
                      <Lock className="w-10 h-10 text-cyan-400" />
                    </div>
                    <p className="text-white font-bold text-lg text-center px-8 mb-4">
                      Sign up free to unlock!
                    </p>
                    <button
                      onClick={handleSignupPrompt}
                      className="px-6 py-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl font-bold text-black shadow-lg"
                    >
                      Join Now - It's Free!
                    </button>
                  </div>
                )}

                {/* Free Play Badge - only for pure guest children */}
                {!isLocked && isGuestChild && !isParentChild && index <= 1 && (
                  <div className="absolute top-4 left-4 z-10">
                    <div className="px-3 py-1.5 bg-cyan-400 rounded-full text-xs font-black text-black flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      FREE PLAY
                    </div>
                  </div>
                )}

                {/* Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300 ${isGuestChild && !isParentChild && index > 1 ? 'opacity-40' : 'opacity-80 group-hover:opacity-90'}`} />

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                  <p className="text-body-sm text-white/60 mb-2 group-hover:text-highlight transition-colors duration-300">
                    {project.category}
                  </p>
                  <h3 className="text-h4 lg:text-h3 text-white font-medium group-hover:-translate-y-1 transition-transform duration-300 flex items-center gap-2">
                    {project.title}
                    {isGuestChild && !isParentChild && index > 1 && <Lock className="w-4 h-4 text-cyan-400" />}
                  </h3>
                </div>

                {/* Arrow icon */}
                {!(isGuestChild && !isParentChild && index > 1) && (
                <div className="absolute top-6 right-6">
                  <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-highlight group-hover:scale-115 transition-all duration-300">
                    <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300" />
                  </div>
                </div>
                )}
              </div>
            </a>
          );
          })}
        </div>
      </div>

      {/* Locked Notification Toast */}
      <AnimatePresence>
        {lockedNotification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 max-w-md"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                {isGuestChild ? <Lock className="w-6 h-6 text-cyan-400" /> : <Sparkles className="w-6 h-6 text-cyan-400" />}
              </div>
              <p className="text-white font-bold text-sm">{lockedNotification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative elements */}
      <div className="absolute top-20 left-0 w-32 h-32 bg-highlight/5 -translate-x-1/2" />
      <div className="absolute bottom-20 right-0 w-48 h-48 bg-black/5 translate-x-1/3" />
    </section>
  );
}
