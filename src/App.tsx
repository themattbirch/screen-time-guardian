// src/App.tsx

import React, { useState, useEffect, useCallback } from 'react';
import './index.css'; // Ensure Tailwind styles are imported
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getStorageData, setStorageData } from './utils/storage';
import { soundManager, availableSounds } from './utils/sounds';
import { Timer } from './components/Timer/Timer';
import { Quote as QuoteComponent } from './components/Quote/Quote';
import { Settings } from './components/Settings/Settings';
import { achievements as predefinedAchievements } from './utils/achievements';
import { AppSettings, TimerState, Achievement, Quote } from './types/app';
import {
  Timer as TimerIcon,
  BarChart,
  Quote as QuoteIcon,
  Trophy,
  Settings as SettingsIcon,
} from 'lucide-react';

// Helper function to get mode seconds
const getModeSeconds = (mode: AppSettings['timerMode'], interval?: number): number => {
  switch (mode) {
    case 'focus':
      return 25 * 60;
    case 'shortBreak':
      return 5 * 60;
    case 'longBreak':
      return 15 * 60;
    case 'custom':
      return interval ? interval * 60 : 15 * 60; // Default custom interval if not provided
    default:
      return 15 * 60;
  }
};

// Main App Component
const App: React.FC = () => {
  // Basic settings state
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

  // Timer state
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

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>(predefinedAchievements);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'timer' | 'stats' | 'quotes' | 'achievements'>('timer');

  // Settings Modal State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Quote Change Counter
  const [quoteChangeCounter, setQuoteChangeCounter] = useState(0);

  /**
   * Update Achievements based on actions
   */
  const updateAchievements = useCallback((action: string) => {
    setAchievements((prevAchievements) =>
      prevAchievements.map((ach) => {
        switch (ach.id) {
          case 'first-session':
            if (action === 'completeSession' && ach.progress < ach.target) {
              return {
                ...ach,
                progress: ach.progress + 1,
                unlockedAt: ach.progress + 1 >= ach.target ? new Date().toISOString() : ach.unlockedAt,
              };
            }
            break;
          case 'ten-sessions':
            if (action === 'completeSession' && ach.progress < ach.target) {
              return {
                ...ach,
                progress: ach.progress + 1,
                unlockedAt: ach.progress + 1 >= ach.target ? new Date().toISOString() : ach.unlockedAt,
              };
            }
            break;
          // Handle other achievements similarly
          default:
            return ach;
        }
        return ach;
      })
    );
  }, []);

  /**
   * Handle Timer Completion
   */
  const handleTimerComplete = useCallback(() => {
    if (settings.soundEnabled) {
      soundManager.setVolume(settings.soundVolume);
      soundManager.playSound(settings.selectedSound);
    }

    // Show notification if granted
    if (Notification.permission === 'granted') {
      new Notification('Screen Time Guardian', { body: 'Time is up!' });
    } else {
      toast.info('Time is up!');
    }

    setTimerState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
      timeLeft: 0,
      isBlinking: true,
    }));

    // Show a new quote
    setQuoteChangeCounter((prev) => prev + 1);

    // Update achievements based on session completion
    updateAchievements('completeSession');
  }, [settings.soundEnabled, settings.soundVolume, settings.selectedSound, updateAchievements]);

  /**
   * Handle Start Timer
   */
  const handleStartTimer = useCallback(() => {
    const now = Date.now();
    const end = now + timerState.timeLeft * 1000;
    setTimerState((prev) => ({
      ...prev,
      isActive: true,
      isPaused: false,
      startTime: now,
      endTime: end,
    }));
    updateAchievements('startSession');
  }, [timerState.timeLeft, updateAchievements]);

  /**
   * Handle Pause Timer
   */
  const handlePauseTimer = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isPaused: true }));
    updateAchievements('pauseSession');
  }, [updateAchievements]);

  /**
   * Handle Resume Timer
   */
  const handleResumeTimer = useCallback(() => {
    setTimerState((prev) => ({ ...prev, isPaused: false }));
    updateAchievements('resumeSession');
  }, [updateAchievements]);

  /**
   * Handle Reset Timer
   */
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
  }, [settings.timerMode, settings.interval, updateAchievements]);

  /**
   * Timer countdown logic
   */
  useEffect(() => {
    let intervalId: number | undefined;
    if (timerState.isActive && !timerState.isPaused && timerState.timeLeft > 0) {
      intervalId = window.setInterval(() => {
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

  /**
   * Load settings and timer state from storage on mount
   */
  useEffect(() => {
    async function loadData() {
      const storedSettings = await getStorageData(['appSettings']);
      if (storedSettings.appSettings) {
        setSettings(storedSettings.appSettings);
      }

      const storedTimer = await getStorageData(['timerState']);
      if (storedTimer.timerState) {
        const stored = storedTimer.timerState;
        if (stored.endTime && stored.endTime > Date.now()) {
          const leftoverMs = stored.endTime - Date.now();
          const leftoverSec = Math.floor(leftoverMs / 1000);
          setTimerState({
            ...stored,
            timeLeft: leftoverSec > 0 ? leftoverSec : 0,
            isActive: leftoverSec > 0 && !stored.isPaused,
          });
        }
      }

      const storedAchievements = await getStorageData(['achievements']);
      if (storedAchievements.achievements) {
        setAchievements(storedAchievements.achievements);
      }
    }
    loadData();
  }, []);

  /**
   * Persist settings whenever changed
   */
  useEffect(() => {
    setStorageData({ appSettings: settings });
  }, [settings]);

  /**
   * Persist timer state whenever changed
   */
  useEffect(() => {
    setStorageData({ timerState });
  }, [timerState]);

  /**
   * Persist achievements whenever changed
   */
  useEffect(() => {
    setStorageData({ achievements });
  }, [achievements]);

  /**
   * Apply theme changes
   */
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  /**
   * Request Notification permission on mount if desired
   */
  useEffect(() => {
    if (settings.soundEnabled && Notification.permission !== 'granted') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
          console.log('Notification permission granted.');
        }
      });
    }
  }, [settings.soundEnabled]);

  /**
   * Handle favorite quotes (if applicable)
   */
  const handleFavoriteQuote = (quote: Quote) => {
    // Implement favorite logic here
    // For example, toggle favorite status and persist
    // This is a placeholder implementation
    toast.success(`Added "${quote.text}" to favorites!`);
  };

  return (
  <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
    {/* Main Content Area with proper padding for bottom nav */}
    <main className="flex-1 overflow-y-auto px-4 pb-24">
      {/* App Header */}
      <div className="sticky top-0 pt-4 pb-2 bg-gray-50 dark:bg-gray-900 z-10">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
          Screen Time Guardian
        </h1>
      </div>

        
      {/* Content Container with max width */}
      <div className="max-w-md mx-auto mt-4 space-y-6">
          {activeTab === 'timer' && (
            <div className="space-y-6">
              {/* Timer Section */}
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold dark:text-white">Focus Timer</h2>
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800"
                  aria-label="Open Settings"
                >
                  <SettingsIcon className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                </button>
              </div>

              {/* Timer Component */}
              <Timer
                timeLeft={timerState.timeLeft}
                isActive={timerState.isActive}
                isPaused={timerState.isPaused}
                mode={timerState.mode}
                onStart={timerState.isPaused ? handleResumeTimer : handleStartTimer}
                onStop={handlePauseTimer}
                onComplete={handleTimerComplete}
                isShrunk={false}
                isBlinking={timerState.isBlinking}
              />

              {/* Timer Controls */}
              <div className="flex justify-center space-x-4">
                {timerState.isActive && !timerState.isPaused ? (
                  <button
                    onClick={handlePauseTimer}
                    className="px-6 py-2 bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition"
                    aria-label="Pause Timer"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleStartTimer}
                    className="px-6 py-2 bg-green-600 text-white rounded-full shadow hover:bg-green-700 transition"
                    aria-label="Start Timer"
                  >
                    Start
                  </button>
                )}
                <button
                  onClick={handleResetTimer}
                  className="px-6 py-2 bg-gray-500 text-white rounded-full shadow hover:bg-gray-600 transition"
                  aria-label="Reset Timer"
                >
                  Reset
                </button>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold dark:text-white">Your Progress</h2>
              {/* Stats Component */}
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">12</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Sessions Today</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">85%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Completion Rate</div>
                  </div>
                </div>
                {/* Additional stats can be added here */}
              </div>
            </div>
          )}

          {activeTab === 'quotes' && settings.showQuotes && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold dark:text-white">Daily Quote</h2>
              {/* Quote Component */}
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
              {/* Achievements List */}
              <div className="space-y-3">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex items-center space-x-4 ${
                      ach.unlockedAt ? 'border-2 border-green-500' : 'border border-gray-300 dark:border-gray-700'
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

     Yes, I see the syntax error. There's a misplaced closing div and the h-safe-bottom is in the wrong place. Here's the correct bottom navigation section:
tsxCopy{/* Bottom Navigation with safe area padding */}
<nav className="bottom-nav bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
  <div className="flex justify-around items-center h-16">
    <button
      onClick={() => setActiveTab('timer')}
      className={`flex flex-col items-center p-2 ${
        activeTab === 'timer' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
      }`}
      aria-label="Timer"
    >
      <TimerIcon className="w-6 h-6" />
      <span className="text-xs mt-1">Timer</span>
    </button>

    <button
      onClick={() => setActiveTab('stats')}
      className={`flex flex-col items-center p-2 ${
        activeTab === 'stats' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
      }`}
      aria-label="Stats"
    >
      <BarChart className="w-6 h-6" />
      <span className="text-xs mt-1">Stats</span>
    </button>

    <button
      onClick={() => setActiveTab('quotes')}
      className={`flex flex-col items-center p-2 ${
        activeTab === 'quotes' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
      }`}
      aria-label="Quotes"
    >
      <QuoteIcon className="w-6 h-6" />
      <span className="text-xs mt-1">Quotes</span>
    </button>

    <button
      onClick={() => setActiveTab('achievements')}
      className={`flex flex-col items-center p-2 ${
        activeTab === 'achievements' ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
      }`}
      aria-label="Achievements"
    >
      <Trophy className="w-6 h-6" />
      <span className="text-xs mt-1">Goals</span>
    </button>
  </div>
  <div className="h-[env(safe-area-inset-bottom)]" />
</nav>

      {/* Settings Modal */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={(newSettings) => setSettings(newSettings)}
      />

      {/* Toast Notifications */}
      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
};

export default App;
