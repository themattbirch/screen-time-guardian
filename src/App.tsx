import React, { useState, useEffect, useCallback } from 'react';
import './index.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Your local imports
import { getStorageData, setStorageData } from './utils/storage';
import { soundManager } from './utils/sounds';
import { Timer } from './components/Timer/Timer';
import { Quote as QuoteComponent } from './components/Quote/Quote';
import { Settings } from './components/Settings/Settings';
console.log("Checking path: imported Settings from './components/Settings/Settings'");
import { achievements as predefinedAchievements } from './utils/achievements';
import { AppSettings, TimerState, Achievement, Quote } from './types/app';

// Icons from lucide-react
import {
  Timer as TimerIcon,
  BarChart,
  Quote as QuoteIcon,
  Trophy,
  Settings as SettingsIcon,
  Sun,
  Moon
} from 'lucide-react';

// Helper to compute initial seconds for each mode
const getModeSeconds = (mode: AppSettings['timerMode'], interval?: number): number => {
  switch (mode) {
    case 'focus':
      return 25 * 60;
    case 'shortBreak':
      return 5 * 60;
    case 'longBreak':
      return 15 * 60;
    case 'custom':
      return interval ? interval * 60 : 15 * 60;
    default:
      return 15 * 60;
  }
};

const App: React.FC = () => {
  // -------------------
  // 1) State
  // -------------------
  const [settings, setSettings] = useState<AppSettings>({
    interval: 15,
    soundEnabled: true,
    theme: 'light',
    soundVolume: 50,
    autoStartTimer: false,
    showQuotes: true,
    quoteChangeInterval: 60,
    selectedSound: 'gentle-bell',
    timerMode: 'focus',
    quoteCategory: 'all',
    minimalMode: false,
  });

  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isPaused: false,
    timeLeft: getModeSeconds('focus'),
    mode: 'focus',
    interval: 15,
    isBlinking: false,
    startTime: null,
    endTime: null,
  });

  const [achievements, setAchievements] = useState<Achievement[]>(predefinedAchievements);

  // The currently active tab in your bottom nav
  const [activeTab, setActiveTab] = useState<'timer' | 'stats' | 'quotes' | 'achievements'>('timer');

  // Control for your settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Force re-render in the Quote component when the timer completes
  const [quoteChangeCounter, setQuoteChangeCounter] = useState(0);

  // -------------------
  // 2) Achievements
  // -------------------
  const updateAchievements = useCallback((action: string) => {
    setAchievements((prev) =>
      prev.map((ach) => {
        switch (ach.id) {
          case 'first-session':
          case 'ten-sessions':
            // Example logic: "completeSession" increments progress
            if (action === 'completeSession' && ach.progress < ach.target) {
              const newProgress = ach.progress + 1;
              const unlocked = newProgress >= ach.target ? new Date().toISOString() : ach.unlockedAt;
              return {
                ...ach,
                progress: newProgress,
                unlockedAt: unlocked,
              };
            }
            break;
        }
        return ach;
      })
    );
  }, []);

  // -------------------
  // 3) Timer logic
  // -------------------
  const handleTimerComplete = useCallback(() => {
    // 1. Play sound if enabled
    if (settings.soundEnabled) {
      soundManager.setVolume(settings.soundVolume);
      soundManager.playSound(settings.selectedSound);
    }
    // 2. Try haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(150);
    }
    // 3. Notification fallback
    if (Notification.permission === 'granted') {
      new Notification('Screen Time Guardian', { body: 'Time is up!' });
    } else {
      toast.info('Time is up!');
    }
    // 4. Update the local timer state
    setTimerState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
      timeLeft: 0,
      isBlinking: true,
    }));
    // 5. Force a quote refresh
    setQuoteChangeCounter((prev) => prev + 1);
    // 6. Achievements
    updateAchievements('completeSession');
  }, [settings, updateAchievements]);

  const handleResetTimer = useCallback(() => {
    setTimerState({
      isActive: false,
      isPaused: false,
      timeLeft: getModeSeconds(settings.timerMode, settings.interval),
      mode: settings.timerMode,
      interval: settings.interval,
      isBlinking: false,
      startTime: null,
      endTime: null,
    });
    updateAchievements('resetSession');
  }, [settings, updateAchievements]);

  // Start or resume the timer
  const handleStartOrResume = useCallback(() => {
    const now = Date.now();
    const newEndTime = now + timerState.timeLeft * 1000;
    setTimerState((prev) => ({
      ...prev,
      isActive: true,
      isPaused: false,
      startTime: now,
      endTime: newEndTime,
    }));
    // Possibly achievements like 'startSession'
    updateAchievements('startSession');
  }, [timerState.timeLeft, updateAchievements]);

  // Pause the timer
  const handlePause = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      isPaused: true,
      // Clear endTime so we know we have leftover time
      endTime: null,
    }));
    updateAchievements('pauseSession');
  }, [updateAchievements]);

  // -------------------
  // 4) Favorite Quote Handler
  // -------------------
  const handleFavoriteQuote = (quote?: Quote) => {
    if (!quote) return;
    toast.success(`Added "${quote.text}" to favorites!`);
    // You can also store or track favorites here
  };

  // -------------------
  // 5) Timer countdown effect
  // -------------------
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (timerState.isActive && !timerState.isPaused && timerState.timeLeft > 0) {
      intervalId = setInterval(() => {
        setTimerState((prev) => {
          if (prev.timeLeft <= 1) {
            handleTimerComplete();
            return { ...prev, timeLeft: 0, isActive: false };
          }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [timerState.isActive, timerState.isPaused, timerState.timeLeft, handleTimerComplete]);

  // -------------------
  // 6) Load data from storage on mount
  // and handle leftover time if endTime > Date.now()
  // -------------------
  useEffect(() => {
    async function loadData() {
      // Load settings
      const storedSettings = await getStorageData(['appSettings']);
      if (storedSettings.appSettings) {
        setSettings(storedSettings.appSettings);
      }

      // Load timer state
      const storedTimer = await getStorageData(['timerState']);
      if (storedTimer.timerState) {
        const t = storedTimer.timerState;
        if (t.endTime && t.endTime > Date.now()) {
          // leftover time
          const leftoverMs = t.endTime - Date.now();
          const leftoverSec = Math.floor(leftoverMs / 1000);
          setTimerState({
            ...t,
            timeLeft: leftoverSec > 0 ? leftoverSec : 0,
            isActive: leftoverSec > 0 && !t.isPaused,
          });
        } else {
          // time has passed or no endTime
          setTimerState({
            ...t,
            timeLeft: getModeSeconds(t.mode, t.interval),
            isActive: false,
            isPaused: false,
          });
        }
      }

      // Load achievements
      const storedAchievements = await getStorageData(['achievements']);
      if (storedAchievements.achievements) {
        setAchievements(storedAchievements.achievements);
      }
    }
    loadData();
  }, []);

  // -------------------
  // 7) Persist changes to storage
  // -------------------
  useEffect(() => {
    setStorageData({ appSettings: settings });
  }, [settings]);

  useEffect(() => {
    setStorageData({ timerState });
  }, [timerState]);

  useEffect(() => {
    setStorageData({ achievements });
  }, [achievements]);

  // -------------------
  // 8) Theme & Notification request
  // -------------------
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  useEffect(() => {
    if (settings.soundEnabled && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, [settings.soundEnabled]);

  const handleThemeToggle = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  };

  // -------------------
  // 9) Rendering
  // -------------------
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 w-full max-w-md mx-auto">
        {/* HEADER */}
        <div className="sticky top-0 pt-6 pb-4 bg-gray-50 dark:bg-gray-900 z-10">
          <div className="flex justify-between items-center">
            {/* Left side: theme toggle + title */}
            <div className="flex items-center gap-4">
  <button
    onClick={handleThemeToggle}
    className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    aria-label="Switch theme"
  >
    {settings.theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
  </button>
  {/* Logo here */}
  <img src="/icons/logo.svg" alt="Screen Time Guardian" className="h-8 w-auto" />
  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
    Screen Time Guardian
  </h1>
</div>

            {/* Right side: settings btn */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Open Settings"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="space-y-6 mt-2">
          {activeTab === 'timer' && (
            <div className="space-y-6">
              {/* Timer Component */}
              <Timer
                timeLeft={timerState.timeLeft}
                isActive={timerState.isActive}
                isPaused={timerState.isPaused}
                mode={timerState.mode}
                onStart={handleStartOrResume}
                onStop={handlePause}
                onComplete={handleTimerComplete}
                isShrunk={false}
                isBlinking={timerState.isBlinking}
              />

              <div className="flex justify-center">
                <button
                  onClick={handleResetTimer}
                  className="px-6 py-2 bg-gray-500 text-white rounded-full shadow hover:bg-gray-600 transition"
                  aria-label="Reset Timer"
                >
                  Reset
                </button>
              </div>

              {settings.showQuotes && (
                <div className="mt-4">
                  <QuoteComponent
                    changeInterval={settings.quoteChangeInterval}
                    category={settings.quoteCategory}
                    forceChange={quoteChangeCounter}
                    onFavorite={handleFavoriteQuote} 
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold dark:text-white">Your Progress</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Sessions Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">85%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Completion Rate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quotes' && settings.showQuotes && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold dark:text-white">Daily Quote</h2>
              <QuoteComponent
                changeInterval={settings.quoteChangeInterval}
                category={settings.quoteCategory}
                forceChange={quoteChangeCounter}
                onFavorite={handleFavoriteQuote} 
              />
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold dark:text-white">Achievements</h2>
              <div className="space-y-3">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex items-center space-x-4 ${
                      ach.unlockedAt
                        ? 'border-2 border-green-500'
                        : 'border border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white">{ach.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{ach.description}</p>
                      {ach.progress < ach.target && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Progress: {ach.progress}/{ach.target}
                        </div>
                      )}
                      {ach.unlockedAt && (
                        <div className="text-xs text-green-500 dark:text-green-400 mt-1">
                          Unlocked on {new Date(ach.unlockedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* BOTTOM NAV */}
      <nav 
        className="
          fixed bottom-0 left-0 right-0 
          bg-white dark:bg-gray-800
          border-t border-gray-200 dark:border-gray-700
        "
      >
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          <button
            onClick={() => setActiveTab('timer')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'timer'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            aria-label="Timer"
          >
            <TimerIcon className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Timer</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'stats'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            aria-label="Stats"
          >
            <BarChart className="w-6 h-6" />
            <span className="text-xs mt-1">Stats</span>
          </button>

          <button
            onClick={() => setActiveTab('quotes')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'quotes'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            aria-label="Quotes"
          >
            <QuoteIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Quotes</span>
          </button>

          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex flex-col items-center p-2 ${
              activeTab === 'achievements'
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400'
            }`}
            aria-label="Achievements"
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs mt-1">Goals</span>
          </button>
        </div>
        {/* Safe-area inset for iOS */}
        <div className="h-[env(safe-area-inset-bottom)] bg-white dark:bg-gray-800" />
      </nav>

      {/* SETTINGS MODAL */}
      <Settings
  isOpen={true}
  onClose={() => {}}
  settings={settings}
  onSettingsChange={setSettings}
  achievements={achievements}
  setAchievements={setAchievements}
/>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default App;
