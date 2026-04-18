import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Sparkles } from 'lucide-react';
import { worksConfig } from '../config';
import type { WorkItem } from '../config';
import { db } from '../firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

gsap.registerPlugin(ScrollTrigger);

const STATIC_HTML_GAMES: WorkItem[] = [
  {
    id: 9001,
    title: 'Shiksha Khel 3D',
    category: 'Interactive 3D Learning',
    image: '/images/classroom.jpg',
    class: 'All Classes',
    subject: 'General',
    type: 'game',
    contentUrl: '/shiksha-khel-3d%20(1).html',
  },
  {
    id: 9002,
    title: 'Gamesss',
    category: 'Fun Learning Collection',
    image: '/images/math-game.jpg',
    class: 'All Classes',
    subject: 'General',
    type: 'game',
    contentUrl: '/gamesss.html',
  },
];

const mergeWithStaticHtmlGames = (items: WorkItem[]) => {
  const filteredItems = items.filter((item) => {
    const title = (item.title ?? '').toLowerCase();
    return title !== 'mystery game';
  });
  const byUrl = new Set(filteredItems.map((item) => item.contentUrl));
  const missingStaticGames = STATIC_HTML_GAMES.filter((game) => !byUrl.has(game.contentUrl));
  return [...filteredItems, ...missingStaticGames];
};

const normalizeClassLabel = (value?: string) => {
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower.includes('all')) return 'all';
  const digit = lower.match(/[1-3]/);
  return digit ? digit[0] : '';
};

interface WorksProps {
  isGuestChild?: boolean;
  isParentChild?: boolean;
  onSignupClick?: () => void;
  onOpenLearningHub?: () => void;
  childClass?: string;
}

export function Works({ isGuestChild, isParentChild, onSignupClick, onOpenLearningHub, childClass }: WorksProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const [projects, setProjects] = useState<WorkItem[]>(mergeWithStaticHtmlGames(worksConfig.projects));
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
          const selectedClass = normalizeClassLabel(childClass);
          const filtered = firestoreProjects.filter(p => 
            !p.class ||
            normalizeClassLabel(p.class) === 'all' ||
            normalizeClassLabel(p.class) === selectedClass
          );
          setProjects(mergeWithStaticHtmlGames(filtered));
        } else {
          setProjects(mergeWithStaticHtmlGames(firestoreProjects));
        }
      }
    }, (error) => {
      console.warn("Firestore 'content' collection not found or access denied. Using static config.", error);
      setProjects(mergeWithStaticHtmlGames(worksConfig.projects));
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
      onUpdate: () => {},
    });
    triggersRef.current.push(scrollTrigger);

    return () => {
      triggersRef.current.forEach((t) => t.kill());
      triggersRef.current = [];
    };
  }, []);

  const titleChars = worksConfig.title.split('');

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

      <div className="max-w-7xl mx-auto">
        <div className="rounded-[2rem] border border-black/10 bg-slate-900 text-white p-8 md:p-10">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">New Child Experience</p>
          <h3 className="mt-3 text-2xl md:text-3xl font-black">Choose learning mode from one dedicated page</h3>
          <p className="mt-3 text-sm md:text-base text-slate-300 max-w-3xl">
            We moved game thumbnails out of this page to reduce confusion. Open the Child Learning Hub to choose
            Play Games, Watch Videos, or See Progress. Only content for the selected class is shown.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={onOpenLearningHub}
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-6 py-3 text-sm font-black text-black shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              Open Child Learning Hub
            </button>
            {isGuestChild && !isParentChild && (
              <button
                onClick={onSignupClick}
                className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/20"
              >
                Parent Access
              </button>
            )}
          </div>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
            <Sparkles className="h-3.5 w-3.5" />
            Class-aware filtering is enabled for registered child profiles.
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-0 w-32 h-32 bg-highlight/5 -translate-x-1/2" />
      <div className="absolute bottom-20 right-0 w-48 h-48 bg-black/5 translate-x-1/3" />
    </section>
  );
}
