
export interface AppSettings {
  interval: number;
  soundEnabled: boolean;
  theme: 'light' | 'dark';
  soundVolume: number;
  autoStartTimer: boolean;
  showQuotes: boolean;
  quoteChangeInterval: number;
  selectedSound: string;
  timerMode: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  quoteCategory: string;
  minimalMode: boolean;
}

export interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  timeLeft: number;
  mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  interval: number;
  isBlinking: boolean;
  startTime: number | null;
  endTime: number | null;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string; 
  progress: number;
  target: number;
  unlockedAt: string | null;
}

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  isFavorite?: boolean;
}

export interface Statistics {
  totalSessions: number;
  totalMinutes: number;
  dailyStreak: number;
  bestStreak: number;
  lastSessionDate: string;
  averageSessionDuration: number;
  completionRate: number;
  focusScore: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
  achievements: Achievement[];
  sessionHistory: Session[];
}

export interface Session {
  date: string;
  duration: number;
  completedBreaks: number;
  skippedBreaks?: number;
  focusScore?: number;
}

export interface QuoteProps {
  changeInterval: number;
  category: string;
  forceChange: number;
}

export interface StorageData {
  appSettings: AppSettings;
  timerState: TimerState;
  achievements: Achievement[];
}