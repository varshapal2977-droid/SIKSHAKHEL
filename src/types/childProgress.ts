export interface LearningActivity {
  type: 'study_session' | 'game_open' | 'game_result';
  title: string;
  subject: string;
  timestamp: string;
  minutes: number;
  starsEarned?: number;
  questionsSolved?: number;
  score?: number;
  totalQuestions?: number;
  source?: string;
}

export interface WeeklyActivityEntry {
  date: string;
  minutes: number;
}

export interface ChildProfile {
  id: string;
  parentId: string;
  name: string;
  grade: string;
  age?: number;
  schoolName?: string;
  learningGoal?: string;
  progress: number;
  streak: number;
  lastActive: string;
  totalStudyMinutes?: number;
  gamesPlayed?: number;
  lessonsCompleted?: number;
  questionsSolved?: number;
  starsEarned?: number;
  badgesUnlocked?: number;
  weeklyGoalTarget?: number;
  weeklyGoalCompleted?: number;
  lastPlayedGame?: string;
  subjectProgress?: Record<string, number>;
  weeklyActivity?: WeeklyActivityEntry[];
  recentActivities?: LearningActivity[];
}
