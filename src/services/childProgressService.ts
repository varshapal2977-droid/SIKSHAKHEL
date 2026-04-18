import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import type { ChildProfile, LearningActivity, WeeklyActivityEntry } from '../types/childProgress';

export const PENDING_CHILD_ACTIVITY_KEY = 'shikshakhel.pendingChildActivityLogs';

interface ChildActivityInput {
  type: LearningActivity['type'];
  title: string;
  subject?: string;
  minutes?: number;
  starsEarned?: number;
  questionsSolved?: number;
  score?: number;
  totalQuestions?: number;
  source?: string;
  progressDelta?: number;
  lessonsCompletedDelta?: number;
  gamesPlayedDelta?: number;
  badgeDelta?: number;
  weeklyGoalDelta?: number;
  timestamp?: string;
}

interface StoredChildProfile extends ChildProfile {
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_SUBJECT_PROGRESS: Record<string, number> = {
  Maths: 0,
  EVS: 0,
  Hindi: 0,
  General: 0,
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function normalizeSubject(subject?: string) {
  const raw = (subject || 'General').trim().toLowerCase();
  if (raw.includes('math')) return 'Maths';
  if (raw.includes('evs')) return 'EVS';
  if (raw.includes('hindi')) return 'Hindi';
  return 'General';
}

function getDateKey(value: string) {
  return new Date(value).toISOString().slice(0, 10);
}

function computeNextStreak(previousLastActive?: string, previousStreak = 0, activityAt = new Date()) {
  if (!previousLastActive) {
    return 1;
  }

  const previous = new Date(previousLastActive);
  if (Number.isNaN(previous.getTime())) {
    return 1;
  }

  const todayKey = getDateKey(activityAt.toISOString());
  const previousKey = getDateKey(previous.toISOString());
  if (todayKey === previousKey) {
    return Math.max(1, previousStreak);
  }

  const diffDays = Math.floor((new Date(todayKey).getTime() - new Date(previousKey).getTime()) / 86400000);
  return diffDays === 1 ? previousStreak + 1 : 1;
}

function mergeWeeklyActivity(entries: WeeklyActivityEntry[] | undefined, timestamp: string, minutes: number) {
  const date = getDateKey(timestamp);
  const nextEntries = [...(entries || [])];
  const existing = nextEntries.find((entry) => entry.date === date);

  if (existing) {
    existing.minutes += minutes;
  } else {
    nextEntries.push({ date, minutes });
  }

  return nextEntries
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);
}

function toActivity(input: ChildActivityInput, timestamp: string, minutes: number): LearningActivity {
  return {
    type: input.type,
    title: input.title,
    subject: normalizeSubject(input.subject),
    timestamp,
    minutes,
    starsEarned: input.starsEarned,
    questionsSolved: input.questionsSolved,
    score: input.score,
    totalQuestions: input.totalQuestions,
    source: input.source,
  };
}

export async function recordChildActivity(
  parentId: string,
  childId: string | undefined,
  childName: string,
  childClass: string,
  input: ChildActivityInput,
) {
  const childRef = doc(db, 'children', childId || `${parentId}_child`);
  const timestamp = input.timestamp || new Date().toISOString();
  const minutes = Math.max(0, input.minutes || 0);
  const subject = normalizeSubject(input.subject);

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(childRef);
    const previous = snapshot.exists() ? (snapshot.data() as Partial<StoredChildProfile>) : {};

    const nextStreak = computeNextStreak(previous.lastActive, previous.streak || 0, new Date(timestamp));
    const nextStudyMinutes = (previous.totalStudyMinutes || 0) + minutes;
    const progressFromTime = minutes > 0 ? Math.max(1, Math.ceil(minutes / 4)) : 0;
    const scoreRatio =
      input.score !== undefined && input.totalQuestions && input.totalQuestions > 0
        ? Math.round((input.score / input.totalQuestions) * 8)
        : 0;
    const nextProgress = clamp((previous.progress || 0) + (input.progressDelta || 0) + progressFromTime + scoreRatio);
    const nextSubjectProgress = {
      ...DEFAULT_SUBJECT_PROGRESS,
      ...(previous.subjectProgress || {}),
    };
    nextSubjectProgress[subject] = clamp(
      (nextSubjectProgress[subject] || 0) + (input.progressDelta || 0) + progressFromTime + scoreRatio,
    );

    const recentActivities = [
      toActivity(input, timestamp, minutes),
      ...((previous.recentActivities || []) as LearningActivity[]),
    ].slice(0, 8);

    transaction.set(
      childRef,
      {
        parentId,
        name: previous.name || childName || 'Student',
        grade: previous.grade || childClass || 'Class 1',
        progress: nextProgress,
        streak: nextStreak,
        lastActive: timestamp,
        totalStudyMinutes: nextStudyMinutes,
        gamesPlayed: (previous.gamesPlayed || 0) + (input.gamesPlayedDelta || 0),
        lessonsCompleted: (previous.lessonsCompleted || 0) + (input.lessonsCompletedDelta || 0),
        questionsSolved: (previous.questionsSolved || 0) + (input.questionsSolved || 0),
        starsEarned: (previous.starsEarned || 0) + (input.starsEarned || 0),
        badgesUnlocked: (previous.badgesUnlocked || 0) + (input.badgeDelta || 0),
        weeklyGoalTarget: previous.weeklyGoalTarget || 120,
        weeklyGoalCompleted: (previous.weeklyGoalCompleted || 0) + (input.weeklyGoalDelta || minutes),
        lastPlayedGame:
          input.type === 'game_open' || input.type === 'game_result'
            ? input.title
            : previous.lastPlayedGame || '',
        subjectProgress: nextSubjectProgress,
        weeklyActivity: mergeWeeklyActivity(previous.weeklyActivity, timestamp, minutes),
        recentActivities,
        createdAt: previous.createdAt || timestamp,
        updatedAt: timestamp,
      },
      { merge: true },
    );
  });
}

export async function flushPendingChildActivityLogs(
  parentId: string,
  childId: string | undefined,
  childName: string,
  childClass: string,
) {
  const raw = localStorage.getItem(PENDING_CHILD_ACTIVITY_KEY);
  if (!raw) {
    return;
  }

  let parsed: ChildActivityInput[] = [];
  try {
    parsed = JSON.parse(raw) as ChildActivityInput[];
  } catch {
    localStorage.removeItem(PENDING_CHILD_ACTIVITY_KEY);
    return;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    localStorage.removeItem(PENDING_CHILD_ACTIVITY_KEY);
    return;
  }

  for (const entry of parsed) {
    await recordChildActivity(parentId, childId, childName, childClass, entry);
  }

  localStorage.removeItem(PENDING_CHILD_ACTIVITY_KEY);
}

export async function ensureChildProfile(parentId: string, childName: string, childClass: string) {
  const childRef = doc(db, 'children', `${parentId}_child`);
  const snapshot = await getDoc(childRef);
  if (snapshot.exists()) {
    return;
  }

  await recordChildActivity(parentId, `${parentId}_child`, childName, childClass, {
    type: 'study_session',
    title: 'Profile created',
    subject: 'General',
    minutes: 0,
    weeklyGoalDelta: 0,
    progressDelta: 0,
    lessonsCompletedDelta: 0,
    gamesPlayedDelta: 0,
  });
}
