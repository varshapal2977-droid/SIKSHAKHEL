import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BookOpen, Gamepad2, Sparkles, Trophy } from 'lucide-react';
import { worksConfig } from '../config';
import type { WorkItem } from '../config';
import { db } from '../firebase';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { auth } from '../firebase';
import { PENDING_CHILD_ACTIVITY_KEY, recordChildActivity } from '../services/childProgressService';

type HubMode = 'games' | 'videos' | 'progress';

interface ChildLearningHubProps {
  childName: string;
  childClass: string;
  onClose: () => void;
}

function normalizeClass(value?: string) {
  if (!value) return '';
  const lower = value.toLowerCase();
  if (lower.includes('all')) return 'all';

  const match = lower.match(/[1-3]/);
  if (match) return match[0];

  if (lower.includes('class1') || lower.includes('class 1')) return '1';
  if (lower.includes('class2') || lower.includes('class 2')) return '2';
  if (lower.includes('class3') || lower.includes('class 3')) return '3';
  return '';
}

function normalizeSubject(value?: string) {
  if (!value) return 'General';
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : 'General';
}

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
  const byUrl = new Set(items.map((item) => item.contentUrl));
  const missingStaticGames = STATIC_HTML_GAMES.filter((game) => !byUrl.has(game.contentUrl));
  return [...items, ...missingStaticGames];
};

export function ChildLearningHub({ childName, childClass, onClose }: ChildLearningHubProps) {
  const [mode, setMode] = useState<HubMode>('games');
  const [activeSubject, setActiveSubject] = useState<string>('All Subjects');
  const [projects, setProjects] = useState<WorkItem[]>(mergeWithStaticHtmlGames(worksConfig.projects));
  const classKey = normalizeClass(childClass);

  useEffect(() => {
    const q = query(collection(db, 'content'), orderBy('id', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (snapshot.empty) {
          setProjects(mergeWithStaticHtmlGames(worksConfig.projects));
          return;
        }
        const firestoreProjects = snapshot.docs.map((doc) => ({ ...doc.data() } as WorkItem));
        setProjects(mergeWithStaticHtmlGames(firestoreProjects));
      },
      () => {
        setProjects(mergeWithStaticHtmlGames(worksConfig.projects));
      },
    );

    return () => unsubscribe();
  }, []);

  const classFiltered = useMemo(() => {
    return projects.filter((item) => {
      const itemClass = normalizeClass(item.class);
      if (!classKey) return true;
      if (!itemClass || itemClass === 'all') return true;
      return itemClass === classKey;
    });
  }, [projects, classKey]);

  const modeFiltered = useMemo(() => {
    if (mode === 'progress') {
      return [];
    }
    return classFiltered.filter((item) => (item.type || 'game') === (mode === 'games' ? 'game' : 'video'));
  }, [classFiltered, mode]);

  const subjects = useMemo(() => {
    const all = Array.from(new Set(modeFiltered.map((item) => normalizeSubject(item.subject || item.category))));
    return ['All Subjects', ...all];
  }, [modeFiltered]);

  const visibleItems = useMemo(() => {
    if (activeSubject === 'All Subjects') {
      return modeFiltered;
    }
    return modeFiltered.filter((item) => normalizeSubject(item.subject || item.category) === activeSubject);
  }, [activeSubject, modeFiltered]);

  const classLabel = classKey ? `Class ${classKey}` : (childClass || 'All Classes');

  const logPendingActivity = (item: WorkItem, itemMode: HubMode) => {
    try {
      const existing = localStorage.getItem(PENDING_CHILD_ACTIVITY_KEY);
      const parsed = existing ? JSON.parse(existing) as Array<Record<string, unknown>> : [];
      parsed.push({
        type: itemMode === 'games' ? 'game_open' : 'study_session',
        title: item.title,
        subject: item.subject || item.category || 'General',
        source: item.contentUrl || '',
        minutes: itemMode === 'games' ? 0 : 5,
        gamesPlayedDelta: itemMode === 'games' ? 1 : 0,
        lessonsCompletedDelta: itemMode === 'videos' ? 1 : 0,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(PENDING_CHILD_ACTIVITY_KEY, JSON.stringify(parsed));
    } catch {
      // Ignore local-storage logging errors and continue navigation.
    }
  };

  const handleContentOpen = async (item: WorkItem, itemMode: HubMode) => {
    const targetUrl = item.contentUrl || '#';
    if (targetUrl === '#') {
      return;
    }

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        await recordChildActivity(
          currentUser.uid,
          localStorage.getItem('activeChildId') || undefined,
          localStorage.getItem('parentChildName') || childName || 'Student',
          childClass || localStorage.getItem('parentChildClass') || 'Class 1',
          {
            type: itemMode === 'games' ? 'game_open' : 'study_session',
            title: item.title,
            subject: item.subject || item.category || 'General',
            source: targetUrl,
            minutes: itemMode === 'games' ? 0 : 5,
            gamesPlayedDelta: itemMode === 'games' ? 1 : 0,
            lessonsCompletedDelta: itemMode === 'videos' ? 1 : 0,
          },
        );
      } catch {
        // Fall back to local pending logs if network/firestore write fails.
        logPendingActivity(item, itemMode);
      }
    } else {
      logPendingActivity(item, itemMode);
    }

    window.location.href = targetUrl;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col px-6 pb-14 pt-8 lg:px-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to main website
          </button>

          <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-200">
            Showing content for {classLabel}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] border border-cyan-500/20 bg-slate-950/80 p-8 shadow-2xl shadow-cyan-500/10">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_35%)]" />

          <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300">Child Learning Hub</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            Hi {childName.split(' ')[0] || 'Learner'}, what do you want to do today?
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 md:text-base">
            Choose one path and continue your learning journey. Content below is filtered using your parent-selected class.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <button
              onClick={() => setMode('games')}
              className={`rounded-2xl border p-5 text-left transition ${
                mode === 'games'
                  ? 'border-cyan-400 bg-cyan-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <Gamepad2 className="mb-3 h-6 w-6 text-cyan-300" />
              <p className="text-lg font-black">Play Games</p>
              <p className="mt-1 text-sm text-slate-300">Fun challenges and learning quests</p>
            </button>

            <button
              onClick={() => setMode('videos')}
              className={`rounded-2xl border p-5 text-left transition ${
                mode === 'videos'
                  ? 'border-cyan-400 bg-cyan-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <BookOpen className="mb-3 h-6 w-6 text-cyan-300" />
              <p className="text-lg font-black">Watch Videos</p>
              <p className="mt-1 text-sm text-slate-300">Short videos by subject and class</p>
            </button>

            <button
              onClick={() => setMode('progress')}
              className={`rounded-2xl border p-5 text-left transition ${
                mode === 'progress'
                  ? 'border-cyan-400 bg-cyan-500/20'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              }`}
            >
              <Trophy className="mb-3 h-6 w-6 text-cyan-300" />
              <p className="text-lg font-black">See My Progress</p>
              <p className="mt-1 text-sm text-slate-300">Track stars, streaks and progress</p>
            </button>
          </div>
        </div>

        {mode === 'progress' ? (
          <div className="mt-8 rounded-3xl border border-white/10 bg-slate-950/70 p-8">
            <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-300">Progress Snapshot</p>
            <h2 className="mt-3 text-2xl font-black">Keep going, {childName.split(' ')[0] || 'champ'}!</h2>
            <p className="mt-2 text-slate-300">
              Use the profile panel on the main website to see detailed stats like streak, badges, and study time.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <div className="mb-4 flex flex-wrap gap-2">
              {subjects.map((subject) => (
                <button
                  key={subject}
                  onClick={() => setActiveSubject(subject)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    activeSubject === subject
                      ? 'border-cyan-400 bg-cyan-500/20 text-cyan-100'
                      : 'border-white/20 bg-white/5 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {subject}
                </button>
              ))}
            </div>

            {visibleItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-8 text-center">
                <Sparkles className="mx-auto mb-3 h-6 w-6 text-cyan-300" />
                <p className="text-lg font-bold">No {mode === 'games' ? 'games' : 'videos'} yet for this class.</p>
                <p className="mt-2 text-sm text-slate-300">
                  Add content from Admin/Parent side with this class and it will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visibleItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => void handleContentOpen(item, mode)}
                    className="group w-full text-left overflow-hidden rounded-2xl border border-white/10 bg-slate-950/75 transition hover:-translate-y-1 hover:border-cyan-400/40"
                  >
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">{normalizeSubject(item.subject || item.category)}</p>
                      <h3 className="mt-2 text-lg font-black">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-300">
                        {mode === 'games' ? 'Tap to start game' : 'Tap to watch video'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
