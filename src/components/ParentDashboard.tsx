import {
  Plus,
  ArrowRight,
  BookOpen,
  CalendarDays,
  Clock3,
  Edit3,
  Flame,
  LogOut,
  Medal,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  UserRound,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import type { ChildProfile } from '../types/childProgress';

interface ParentDashboardProps {
  onLogout: () => void;
  onOpenLearningMode: () => void;
  onProfileUpdated?: (profile: {
    childId?: string;
    childName: string;
    childClass: string;
    childAge: string;
    schoolName: string;
    learningGoal: string;
  }) => void;
  childProfiles?: ChildProfile[];
  activeChildId?: string;
  onSelectChildProfile?: (childId: string) => void;
  parentData?: {
    fullName?: string;
    email?: string;
    phone?: string;
    childName?: string;
    childClass?: string;
    childAge?: string;
    schoolName?: string;
    learningGoal?: string;
  } | null;
  childProfile?: ChildProfile | null;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function formatDate(value?: string) {
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
    year: 'numeric',
  });
}

export function ParentDashboard({
  onLogout,
  onOpenLearningMode,
  onProfileUpdated,
  childProfiles = [],
  activeChildId,
  onSelectChildProfile,
  parentData,
  childProfile,
}: ParentDashboardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddChildOpen, setIsAddChildOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [addChildError, setAddChildError] = useState('');
  const [profileForm, setProfileForm] = useState({
    childName: childProfile?.name || parentData?.childName || '',
    childClass: childProfile?.grade || parentData?.childClass || 'Class 1',
    childAge: childProfile?.age ? String(childProfile.age) : parentData?.childAge || '',
    schoolName: childProfile?.schoolName || parentData?.schoolName || '',
    learningGoal: childProfile?.learningGoal || parentData?.learningGoal || 'Build daily learning habit',
  });
  const [newChildForm, setNewChildForm] = useState({
    childName: '',
    childClass: 'Class 1',
    childAge: '',
    schoolName: '',
    learningGoal: 'Build daily learning habit',
  });

  useEffect(() => {
    setProfileForm({
      childName: childProfile?.name || parentData?.childName || '',
      childClass: childProfile?.grade || parentData?.childClass || 'Class 1',
      childAge: childProfile?.age ? String(childProfile.age) : parentData?.childAge || '',
      schoolName: childProfile?.schoolName || parentData?.schoolName || '',
      learningGoal: childProfile?.learningGoal || parentData?.learningGoal || 'Build daily learning habit',
    });
  }, [
    childProfile?.name,
    childProfile?.grade,
    childProfile?.age,
    childProfile?.schoolName,
    childProfile?.learningGoal,
    parentData?.childName,
    parentData?.childClass,
    parentData?.childAge,
    parentData?.schoolName,
    parentData?.learningGoal,
  ]);

  const childName = childProfile?.name || parentData?.childName || 'Your child';
  const childClass = childProfile?.grade || parentData?.childClass || 'Class 1';
  const parentName = parentData?.fullName || 'Parent';
  const progress = clamp(childProfile?.progress ?? 0);
  const streak = Math.max(0, childProfile?.streak ?? 0);
  const lastActive = formatDate(childProfile?.lastActive);
  const totalStudyMinutes = childProfile?.totalStudyMinutes ?? 0;
  const gamesPlayed = childProfile?.gamesPlayed ?? 0;
  const lessonsCompleted = childProfile?.lessonsCompleted ?? 0;
  const questionsSolved = childProfile?.questionsSolved ?? 0;
  const starsEarned = childProfile?.starsEarned ?? 0;
  const badgesUnlocked = childProfile?.badgesUnlocked ?? 0;
  const weeklyGoalTarget = childProfile?.weeklyGoalTarget ?? 120;
  const weeklyGoalCompleted = childProfile?.weeklyGoalCompleted ?? 0;
  const weeklyGoal = weeklyGoalTarget > 0 ? clamp(Math.round((weeklyGoalCompleted / weeklyGoalTarget) * 100)) : 0;
  const avgDailyMinutes = childProfile?.weeklyActivity?.length
    ? Math.max(1, Math.round(totalStudyMinutes / childProfile.weeklyActivity.length))
    : 0;
  const attendance = childProfile?.weeklyActivity?.length
    ? clamp(Math.round((childProfile.weeklyActivity.length / 7) * 100))
    : 0;
  const confidence = clamp(Math.round(progress * 0.55 + Math.min(streak * 4, 20) + Math.min(gamesPlayed * 2, 15)));
  const subjectProgressMap = childProfile?.subjectProgress || {};

  const subjectCards = [
    {
      name: 'Maths',
      progress: clamp(subjectProgressMap.Maths ?? 0),
      accent: 'from-cyan-400 to-blue-500',
      note: (subjectProgressMap.Maths ?? 0) > 0 ? 'Real activity from maths sessions and game play.' : 'No maths activity logged yet.',
    },
    {
      name: 'EVS',
      progress: clamp(subjectProgressMap.EVS ?? 0),
      accent: 'from-emerald-400 to-lime-500',
      note: (subjectProgressMap.EVS ?? 0) > 0 ? 'Real activity from EVS sessions and exploration.' : 'No EVS activity logged yet.',
    },
    {
      name: 'Hindi',
      progress: clamp(subjectProgressMap.Hindi ?? 0),
      accent: 'from-amber-400 to-orange-500',
      note: (subjectProgressMap.Hindi ?? 0) > 0 ? 'Real activity from Hindi practice sessions.' : 'No Hindi activity logged yet.',
    },
  ];

  const achievements = [
    {
      title: streak >= 7 ? 'Strong streak habit' : 'Learning habit forming',
      detail:
        streak >= 7
          ? `${childName} is showing consistent learning discipline.`
          : `A few more regular sessions will build momentum for ${childName}.`,
      icon: <Flame className="w-5 h-5 text-orange-400" />,
    },
    {
      title: progress >= 60 ? 'Excellent chapter coverage' : 'Steady chapter progress',
      detail:
        progress >= 60
          ? `${childName} has already covered a strong portion of the learning path.`
          : `${childName} is moving forward and needs just a little more consistency.`,
      icon: <Target className="w-5 h-5 text-cyan-400" />,
    },
    {
      title: confidence >= 75 ? 'Ready for challenge mode' : 'Ready for guided revision',
      detail:
        confidence >= 75
          ? 'You can safely encourage harder games and timed practice.'
          : 'Short daily revision will improve confidence before harder topics.',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
    },
  ];

  const supportTips = [
    `Ask ${childName} to explain one thing learned today in their own words.`,
    `Keep one fixed 10-15 minute learning slot each day for better routine.`,
    progress < 50
      ? 'Focus on Maths and Hindi basics first before adding longer sessions.'
      : 'Mix practice with rewards so the learning habit stays fun and sustainable.',
  ];
  const activityDays = childProfile?.weeklyActivity || [];
  const recentActivities = childProfile?.recentActivities || [];

  const handleSaveProfile = async () => {
    if (!auth.currentUser) {
      setProfileError('Parent session not found. Please log in again.');
      return;
    }

    if (!profileForm.childName || !profileForm.childClass || !profileForm.childAge) {
      setProfileError('Please fill in child name, class, and age.');
      return;
    }

    setIsSavingProfile(true);
    setProfileError('');
    setProfileMessage('');

    try {
      const uid = auth.currentUser.uid;
      const timestamp = new Date().toISOString();
      await setDoc(
        doc(db, 'users', uid),
        {
          childName: profileForm.childName,
          childClass: profileForm.childClass,
          childAge: Number(profileForm.childAge) || null,
          schoolName: profileForm.schoolName,
          learningGoal: profileForm.learningGoal,
          updatedAt: timestamp,
        },
        { merge: true },
      );

      await setDoc(
        doc(db, 'children', `${uid}_child`),
        {
          name: profileForm.childName,
          grade: profileForm.childClass,
          age: Number(profileForm.childAge) || null,
          schoolName: profileForm.schoolName,
          learningGoal: profileForm.learningGoal,
          updatedAt: timestamp,
        },
        { merge: true },
      );

      localStorage.setItem('parentChildName', profileForm.childName);
      localStorage.setItem('parentChildClass', profileForm.childClass);
      localStorage.setItem('parentChildAge', profileForm.childAge);
      localStorage.setItem('parentSchoolName', profileForm.schoolName);
      localStorage.setItem('parentLearningGoal', profileForm.learningGoal);
      localStorage.setItem('guestChildName', profileForm.childName);

      onProfileUpdated?.(profileForm);
      setProfileMessage('Child profile updated successfully.');
      setIsEditOpen(false);
    } catch (error) {
      console.error('Failed to update child profile:', error);
      setProfileError('Could not save changes. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAddChildProfile = async () => {
    if (!auth.currentUser) {
      setAddChildError('Parent session not found. Please log in again.');
      return;
    }

    if (!newChildForm.childName || !newChildForm.childClass || !newChildForm.childAge) {
      setAddChildError('Please fill in child name, class, and age.');
      return;
    }

    setIsAddingChild(true);
    setAddChildError('');

    try {
      const childRef = doc(collection(db, 'children'));
      const timestamp = new Date().toISOString();
      await setDoc(childRef, {
        parentId: auth.currentUser.uid,
        name: newChildForm.childName,
        grade: newChildForm.childClass,
        age: Number(newChildForm.childAge) || null,
        schoolName: newChildForm.schoolName,
        learningGoal: newChildForm.learningGoal,
        progress: 0,
        streak: 0,
        lastActive: timestamp,
        totalStudyMinutes: 0,
        gamesPlayed: 0,
        lessonsCompleted: 0,
        questionsSolved: 0,
        starsEarned: 0,
        badgesUnlocked: 0,
        weeklyGoalTarget: 120,
        weeklyGoalCompleted: 0,
        subjectProgress: { Maths: 0, EVS: 0, Hindi: 0, General: 0 },
        weeklyActivity: [],
        recentActivities: [],
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      setProfileMessage(`Added ${newChildForm.childName}'s profile.`);
      setNewChildForm({
        childName: '',
        childClass: 'Class 1',
        childAge: '',
        schoolName: '',
        learningGoal: 'Build daily learning habit',
      });
      setIsAddChildOpen(false);
      onSelectChildProfile?.(childRef.id);
    } catch (error) {
      console.error('Failed to add child profile:', error);
      setAddChildError('Could not add the child profile. Please try again.');
    } finally {
      setIsAddingChild(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[28rem] w-[28rem] rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute right-[-10%] top-[10%] h-[24rem] w-[24rem] rounded-full bg-blue-500/10 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[10%] h-[22rem] w-[22rem] rounded-full bg-purple-500/10 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AnimatePresence>
          {isEditOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setIsEditOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                className="relative w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl"
              >
                <h2 className="text-2xl font-black">Edit Child Profile</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Update the child details used across the learning website and parent dashboard.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Child Name</label>
                    <input
                      type="text"
                      value={profileForm.childName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, childName: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Class</label>
                    <select
                      value={profileForm.childClass}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, childClass: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                    >
                      <option value="Class 1" className="bg-slate-950">Class 1</option>
                      <option value="Class 2" className="bg-slate-950">Class 2</option>
                      <option value="Class 3" className="bg-slate-950">Class 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Age</label>
                    <input
                      type="number"
                      min="3"
                      max="12"
                      value={profileForm.childAge}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, childAge: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">School Name</label>
                    <input
                      type="text"
                      value={profileForm.schoolName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, schoolName: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Learning Goal</label>
                    <select
                      value={profileForm.learningGoal}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, learningGoal: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                    >
                      <option value="Build daily learning habit" className="bg-slate-950">Build daily learning habit</option>
                      <option value="Improve Maths confidence" className="bg-slate-950">Improve Maths confidence</option>
                      <option value="Improve EVS understanding" className="bg-slate-950">Improve EVS understanding</option>
                      <option value="Strengthen reading skills" className="bg-slate-950">Strengthen reading skills</option>
                    </select>
                  </div>
                </div>

                {profileError && (
                  <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {profileError}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setIsEditOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isSavingProfile}
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-bold text-black transition-all hover:brightness-110 disabled:opacity-60"
                  >
                    {isSavingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isAddChildOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setIsAddChildOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                className="relative w-full max-w-xl rounded-[2rem] border border-white/10 bg-slate-950/95 p-8 shadow-2xl"
              >
                <h2 className="text-2xl font-black">Add Another Child</h2>
                <p className="mt-2 text-sm text-slate-400">
                  Create a second child profile under this same parent account.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Child Name</label>
                    <input
                      type="text"
                      value={newChildForm.childName}
                      onChange={(e) => setNewChildForm((prev) => ({ ...prev, childName: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Class</label>
                    <select
                      value={newChildForm.childClass}
                      onChange={(e) => setNewChildForm((prev) => ({ ...prev, childClass: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                    >
                      <option value="Class 1" className="bg-slate-950">Class 1</option>
                      <option value="Class 2" className="bg-slate-950">Class 2</option>
                      <option value="Class 3" className="bg-slate-950">Class 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Age</label>
                    <input
                      type="number"
                      min="3"
                      max="12"
                      value={newChildForm.childAge}
                      onChange={(e) => setNewChildForm((prev) => ({ ...prev, childAge: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">School Name</label>
                    <input
                      type="text"
                      value={newChildForm.schoolName}
                      onChange={(e) => setNewChildForm((prev) => ({ ...prev, schoolName: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.2em] text-slate-500">Learning Goal</label>
                    <select
                      value={newChildForm.learningGoal}
                      onChange={(e) => setNewChildForm((prev) => ({ ...prev, learningGoal: e.target.value }))}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-cyan-400/50"
                    >
                      <option value="Build daily learning habit" className="bg-slate-950">Build daily learning habit</option>
                      <option value="Improve Maths confidence" className="bg-slate-950">Improve Maths confidence</option>
                      <option value="Improve EVS understanding" className="bg-slate-950">Improve EVS understanding</option>
                      <option value="Strengthen reading skills" className="bg-slate-950">Strengthen reading skills</option>
                    </select>
                  </div>
                </div>

                {addChildError && (
                  <div className="mt-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {addChildError}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setIsAddChildOpen(false)}
                    className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddChildProfile}
                    disabled={isAddingChild}
                    className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-bold text-black transition-all hover:brightness-110 disabled:opacity-60"
                  >
                    {isAddingChild ? 'Adding...' : 'Add Child'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-cyan-400">
              Parent Dashboard
            </p>
            <h1 className="text-3xl font-black sm:text-4xl">Welcome back, {parentName}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-400 sm:text-base">
              Track {childName}&apos;s learning journey, daily rhythm, and the next best areas to support at home.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                setAddChildError('');
                setProfileMessage('');
                setIsAddChildOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <Plus className="w-4 h-4" />
              Add Child
            </button>
            <button
              onClick={() => {
                setProfileError('');
                setProfileMessage('');
                setIsEditOpen(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <Edit3 className="w-4 h-4" />
              Edit Child Profile
            </button>
            <button
              onClick={onOpenLearningMode}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 px-5 py-3 font-bold text-black transition-all hover:scale-[1.02] hover:brightness-110 active:scale-[0.98]"
            >
              Open Learning Mode
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {profileMessage && (
          <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-medium text-emerald-300">
            {profileMessage}
          </div>
        )}

        {childProfiles.length > 0 && (
          <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">Children</p>
                <h2 className="mt-2 text-xl font-black">Manage all child profiles</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {childProfiles.map((profile) => {
                const isActive = profile.id === activeChildId;
                return (
                  <button
                    key={profile.id}
                    onClick={() => onSelectChildProfile?.(profile.id)}
                    className={`rounded-[1.5rem] border p-5 text-left transition-all ${
                      isActive
                        ? 'border-cyan-400/40 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                        : 'border-white/10 bg-black/30 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-black text-white">{profile.name}</h3>
                        <p className="mt-1 text-sm text-slate-400">{profile.grade}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
                        isActive ? 'bg-cyan-400 text-black' : 'bg-white/10 text-slate-300'
                      }`}>
                        {isActive ? 'Active' : 'View'}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <div className="rounded-xl bg-white/5 px-3 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Progress</p>
                        <p className="mt-1 text-sm font-bold text-white">{profile.progress}%</p>
                      </div>
                      <div className="rounded-xl bg-white/5 px-3 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Streak</p>
                        <p className="mt-1 text-sm font-bold text-white">{profile.streak}d</p>
                      </div>
                      <div className="rounded-xl bg-white/5 px-3 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Stars</p>
                        <p className="mt-1 text-sm font-bold text-white">{profile.starsEarned || 0}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: 'Overall Progress',
              value: `${progress}%`,
              hint: `${childName} has completed a healthy part of the current path.`,
              icon: <TrendingUp className="w-5 h-5 text-cyan-400" />,
            },
            {
              label: 'Current Streak',
              value: `${streak} days`,
              hint: streak > 0 ? 'Consistency is the biggest predictor of improvement.' : 'One session today can start the streak.',
              icon: <Flame className="w-5 h-5 text-orange-400" />,
            },
            {
              label: 'Avg Daily Study',
              value: `${avgDailyMinutes} min`,
              hint: totalStudyMinutes > 0 ? `Based on ${totalStudyMinutes} real tracked minutes.` : 'Study time will appear once your child starts learning.',
              icon: <Clock3 className="w-5 h-5 text-emerald-400" />,
            },
            {
              label: 'Last Active',
              value: lastActive,
              hint: 'Use this to spot routine gaps early.',
              icon: <CalendarDays className="w-5 h-5 text-purple-400" />,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-slate-500">{card.label}</p>
                {card.icon}
              </div>
              <h2 className="text-3xl font-black text-white">{card.value}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">{card.hint}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1.3fr_0.9fr]">
          <section className="space-y-8">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Child Snapshot</p>
                  <h2 className="mt-2 text-2xl font-black">How {childName} is doing right now</h2>
                </div>
                <div className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-500/20 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300">
                  <UserRound className="w-4 h-4" />
                  {childClass}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { label: 'Attendance Score', value: `${attendance}%`, color: 'bg-cyan-400' },
                  { label: 'Weekly Goal', value: `${weeklyGoal}%`, color: 'bg-purple-400' },
                  { label: 'Confidence Level', value: `${confidence}%`, color: 'bg-emerald-400' },
                ].map((metric) => (
                  <div key={metric.label} className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                    <div className="flex items-center justify-between text-sm font-bold">
                      <span className="text-slate-400">{metric.label}</span>
                      <span className="text-white">{metric.value}</span>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: metric.value }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full ${metric.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Age</p>
                  <p className="mt-2 text-lg font-black text-white">{childProfile?.age || parentData?.childAge || '-'}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">School</p>
                  <p className="mt-2 text-lg font-black text-white">{childProfile?.schoolName || parentData?.schoolName || '-'}</p>
                </div>
                <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-5">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Primary Goal</p>
                  <p className="mt-2 text-lg font-black text-white">{childProfile?.learningGoal || parentData?.learningGoal || '-'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-cyan-400" />
                <h2 className="text-2xl font-black">Subject Breakdown</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {subjectCards.map((subject) => (
                  <div key={subject.name} className="rounded-[1.75rem] border border-white/10 bg-black/30 p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-black">{subject.name}</h3>
                      <span className="text-sm font-bold text-white">{subject.progress}%</span>
                    </div>
                    <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${subject.progress}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${subject.accent}`}
                      />
                    </div>
                    <p className="text-sm leading-6 text-slate-400">{subject.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-purple-400" />
                <h2 className="text-2xl font-black">Recent Learning Activity</h2>
              </div>

              {recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={`${activity.timestamp}-${activity.title}`} className="rounded-[1.75rem] border border-white/10 bg-black/30 p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-black">{activity.title}</h3>
                          <p className="mt-1 text-sm text-slate-400">
                            {activity.subject} • {formatDate(activity.timestamp)}
                          </p>
                        </div>
                        <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">
                          {activity.type.replace('_', ' ')}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-400">
                        {activity.minutes > 0 ? `${activity.minutes} minute${activity.minutes === 1 ? '' : 's'} tracked` : 'Activity recorded'}
                        {activity.questionsSolved ? ` • ${activity.questionsSolved} correct answers` : ''}
                        {activity.starsEarned ? ` • ${activity.starsEarned} stars earned` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-white/10 bg-black/30 p-5 text-sm leading-6 text-slate-400">
                  Real child activity will appear here after the child starts games or spends time in learning mode.
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-8">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center gap-3">
                <Target className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-black">This Week&apos;s Plan</h2>
              </div>
              <div className="space-y-4">
                {supportTips.map((tip) => (
                  <div key={tip} className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-300">
                    {tip}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h2 className="text-xl font-black">Weekly Activity</h2>
              </div>
              <div className="space-y-4">
                {activityDays.length > 0 ? activityDays.map((entry) => (
                  <div key={entry.date}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-bold text-slate-400">
                        {new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                      </span>
                      <span className="font-bold text-white">{entry.minutes} min</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500"
                        style={{ width: `${clamp((entry.minutes / Math.max(weeklyGoalTarget / 7, 20)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-400">
                    No weekly activity logged yet.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center gap-3">
                <Medal className="w-5 h-5 text-amber-400" />
                <h2 className="text-xl font-black">Rewards & Motivation</h2>
              </div>
              <div className="space-y-4">
                {[
                  { label: 'Stars earned', value: starsEarned, icon: <Star className="w-4 h-4 text-amber-400" /> },
                  { label: 'Badges unlocked', value: badgesUnlocked, icon: <Medal className="w-4 h-4 text-purple-400" /> },
                  { label: 'Games played', value: gamesPlayed, icon: <BookOpen className="w-4 h-4 text-cyan-400" /> },
                  { label: 'Lessons completed', value: lessonsCompleted, icon: <Target className="w-4 h-4 text-orange-400" /> },
                  { label: 'Questions solved', value: questionsSolved, icon: <Sparkles className="w-4 h-4 text-purple-400" /> },
                  { label: 'Safe learning status', value: 'Protected', icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-black/30 px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
                        {item.icon}
                      </div>
                      <span className="text-sm font-bold text-slate-300">{item.label}</span>
                    </div>
                    <span className="text-lg font-black text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
              <div className="mb-5 flex items-center gap-3">
                <Flame className="w-5 h-5 text-orange-400" />
                <h2 className="text-xl font-black">Parent Insights</h2>
              </div>
              <div className="space-y-4">
                {achievements.map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5">
                      {item.icon}
                    </div>
                    <h3 className="text-base font-black">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
