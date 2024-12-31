import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import { Timer } from './components/Timer/Timer';
import { Quote as QuoteComponent } from './components/Quote/Quote';
import { Settings } from './components/Settings/Settings';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Utility to read/write localStorage
function getLocalData<T>(key: string): T | null {
  const data = localStorage.getItem(key);
  return data ? (JSON.parse(data) as T) : null;
}
function setLocalData<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

interface AppSettings {
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
  minimalMode?: boolean;
}

interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  timeLeft: number;
  mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  interval: number;
  isBlinking: boolean;
  startTime?: number | null;
  endTime?: number | null;
}

export default function App(): JSX.Element {
  // Basic settings
  const [settings, setSettings] = useState<AppSettings>(() => {
    const stored = getLocalData<AppSettings>('appSettings');
    return (
      stored || {
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
        minimalMode: false
      }
    );
  });

  // Timer
  const [timerState, setTimerState] = useState<TimerState>(() => {
    const stored = getLocalData<TimerState>('timerState');
    if (stored && stored.endTime && stored.endTime > Date.now()) {
      // leftover
      const leftoverMs = stored.endTime - Date.now();
      const leftoverSec = Math.floor(leftoverMs / 1000);
      return {
        ...stored,
        timeLeft: leftoverSec > 0 ? leftoverSec : 0,
        isActive: leftoverSec > 0 && !stored.isPaused
      };
    }
    // Default if none stored
    return {
      isActive: false,
      isPaused: false,
      timeLeft: getModeSeconds(settings),
      mode: settings.timerMode,
      interval: settings.interval,
      isBlinking: false,
      startTime: null,
      endTime: null
    };
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [quoteChangeCounter, setQuoteChangeCounter] = useState(0);

  // If theme changes, apply it
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Persist settings whenever changed
  useEffect(() => {
    setLocalData('appSettings', settings);
  }, [settings]);

  // Persist timer state whenever changed
  useEffect(() => {
    setLocalData('timerState', timerState);
  }, [timerState]);

  // The actual countdown (only runs if isActive && not paused)
  useEffect(() => {
    let intervalId: number | undefined;
    if (timerState.isActive && !timerState.isPaused && timerState.timeLeft > 0) {
      intervalId = window.setInterval(() => {
        setTimerState((prev) => {
          if (prev.timeLeft <= 1) {
            // Timer about to complete
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
  }, [timerState.isActive, timerState.isPaused, timerState.timeLeft]);

  function handleTimerComplete() {
    if (settings.soundEnabled && Notification.permission === 'granted') {
      new Notification('Screen Time Guardian', { body: 'Time is up!' });
    }
    setTimerState((prev) => ({
      ...prev,
      isActive: false,
      isPaused: false,
      timeLeft: 0,
      isBlinking: true
    }));
    // Show a new quote
    setQuoteChangeCounter((prev) => prev + 1);
  }

  function handleStartTimer() {
    const now = Date.now();
    const end = now + timerState.timeLeft * 1000;
    setTimerState({
      ...timerState,
      isActive: true,
      isPaused: false,
      startTime: now,
      endTime: end
    });
  }

  function handlePauseTimer() {
    setTimerState((prev) => ({ ...prev, isPaused: true }));
  }

  function handleResumeTimer() {
    setTimerState((prev) => ({ ...prev, isPaused: false }));
  }

  function handleResetTimer() {
    setTimerState({
      isActive: false,
      isPaused: false,
      timeLeft: getModeSeconds(settings),
      mode: settings.timerMode,
      interval: settings.interval,
      isBlinking: false,
      startTime: null,
      endTime: null
    });
  }

  // Compute seconds from chosen mode
  function getModeSeconds(s: AppSettings) {
    switch (s.timerMode) {
      case 'focus':
        return 25 * 60;
      case 'shortBreak':
        return 5 * 60;
      case 'longBreak':
        return 15 * 60;
      case 'custom':
        return s.interval * 60;
      default:
        return 15 * 60;
    }
  }

  // Request Notification permission on mount if desired
  useEffect(() => {
    if (settings.soundEnabled && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <div className="p-4 w-full h-full bg-white dark:bg-gray-900 text-black dark:text-white">
      <h1 className="text-2xl font-bold">Screen Time Guardian</h1>

      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSettingsChange={(newSettings) => setSettings(newSettings)}
      />

      {/* Timer UI */}
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

      {/* Quote */}
      {settings.showQuotes && (
        <QuoteComponent
          changeInterval={settings.quoteChangeInterval}
          category={settings.quoteCategory}
          forceChange={quoteChangeCounter}
        />
      )}

      <div className="mt-4 flex space-x-2">
        <button onClick={handleResetTimer} className="px-4 py-2 bg-gray-700 text-white rounded">
          Reset
        </button>
        <button onClick={() => setIsSettingsOpen(true)} className="px-4 py-2 bg-gray-300 rounded">
          Open Settings
        </button>
      </div>

      <ToastContainer position="bottom-right" autoClose={3000} />
    </div>
  );
}