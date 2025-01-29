// src/App.tsx

import React, { useState, useEffect, useCallback } from "react";
import "./index.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Settings } from "./components/Settings/Settings";
import Joyride, { CallBackProps } from "react-joyride";

// Local imports
import { getStorageData, setStorageData } from "./utils/storage";
import { soundManager, availableSounds } from "./utils/sounds";
import { Timer } from "./components/Timer/Timer";
import { Quote as QuoteComponent } from "./components/Quote/Quote";
import { achievements as predefinedAchievements } from "./utils/achievements";
import {
  AppSettings,
  TimerState,
  Achievement,
  Quote,
  Statistics,
  Session,
} from "./types/app";
import { Stats } from "./components/Stats/Stats";

// Icons from lucide-react
import {
  Timer as TimerIcon,
  BarChart,
  Quote as QuoteIcon,
  Trophy,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Star,
} from "lucide-react";

// Define initialStatistics within App.tsx
const initialStatistics: Statistics = {
  totalSessions: 0,
  totalMinutes: 0,
  dailyStreak: 0,
  bestStreak: 0,
  lastSessionDate: null,
  averageSessionDuration: 0,
  completionRate: 0,
  focusScore: 0,
  weeklyMinutes: 0,
  monthlyMinutes: 0,
  achievements: predefinedAchievements,
  sessionHistory: [],
};

// Helper to compute initial seconds for each mode
const getModeSeconds = (
  mode: AppSettings["timerMode"],
  interval?: number
): number => {
  switch (mode) {
    case "focus":
      return 25 * 60;
    case "shortBreak":
      return 5 * 60;
    case "longBreak":
      return 15 * 60;
    case "custom":
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
    theme: "light",
    soundVolume: 50,
    autoStartTimer: false,
    showQuotes: true,
    quoteChangeInterval: 60,
    selectedSound: "gentle-bell",
    timerMode: "focus",
    quoteCategory: "all",
    minimalMode: false,
  });

  const [timerState, setTimerState] = useState<TimerState>({
    isActive: false,
    isPaused: false,
    timeLeft: getModeSeconds("focus"),
    mode: "focus",
    interval: 15,
    isBlinking: false,
    startTime: null,
    endTime: null,
  });

  const [achievements, setAchievements] = useState<Achievement[]>(
    predefinedAchievements
  );

  // New State: Favorite Quotes
  const [favoriteQuotes, setFavoriteQuotes] = useState<Quote[]>([]);

  // New State: Statistics
  const [statistics, setStatistics] = useState<Statistics>(initialStatistics);

  // The currently active tab in your bottom nav
  const [activeTab, setActiveTab] = useState<
    "timer" | "stats" | "quotes" | "achievements"
  >("timer");

  // Control for your settings modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Force re-render in the Quote component when the timer completes
  const [quoteChangeCounter, setQuoteChangeCounter] = useState(0);

  const [runJoyride, setRunJoyride] = useState(false);

  // Define Joyride steps
  const joyrideSteps = [
    {
      target: ".start-button",
      content: "Click here to start your Screen Time Guardian session.",
      disableBeacon: true,
    },
    {
      target: ".timer-container",
      content: "Click anywhere on the timer to pause when it's running.",
      disableBeacon: true,
    },
    {
      target: ".quote-container",
      content:
        "A random motivational quote will appear before the timer starts and when it completes.",
      disableBeacon: true,
    },
    {
      target: ".reset-timer",
      content:
        "Reset the timer to start a new session when it finishes. Or whenever you want to start over.",
      disableBeacon: true,
    },
    {
      target: ".favorite-quotes",
      content: "Access your favorite quotes here.",
      disableBeacon: true,
    },
  ];

  // Joyride callback
  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === "finished" || status === "skipped") {
      setRunJoyride(false);
    }
  };

  // -------------------
  // 2) Achievements
  // -------------------
  const updateAchievements = useCallback((action: string) => {
    setAchievements((prev) =>
      prev.map((ach) => {
        switch (ach.id) {
          case "first-session":
          case "ten-sessions":
            // Example logic: "completeSession" increments progress
            if (action === "completeSession" && ach.progress < ach.target) {
              const newProgress = ach.progress + 1;
              const unlocked =
                newProgress >= ach.target
                  ? new Date().toISOString()
                  : ach.unlockedAt;
              return {
                ...ach,
                progress: newProgress,
                unlockedAt: unlocked,
              };
            }
            break;
          // Add more cases as needed
        }
        return ach;
      })
    );
  }, []);

  // -------------------
  // 3) Timer logic
  // -------------------
  const handleTimerComplete = useCallback(() => {
    // 1. Play sound if enabled and AudioContext is active
    if (settings.soundEnabled) {
      if (soundManager.audioContext.state === "suspended") {
        // Attempt to resume AudioContext
        soundManager.audioContext
          .resume()
          .then(() => {
            soundManager.playSound(settings.selectedSound);
          })
          .catch((error) => {
            console.error("AudioContext resume failed:", error);
          });
      } else {
        soundManager.playSound(settings.selectedSound);
      }
    }

    // 2. Vibrate if supported and allowed
    if ("vibrate" in navigator) {
      navigator.vibrate(150);
    }

    // 3. Send a Web Notification via Service Worker
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.active?.postMessage({
          type: "SHOW_NOTIFICATION",
          payload: {
            title: "Screen Time Guardian",
            body: "Time is up!",
            icon: "/icons/icon192.png",
          },
        });
      });
    } else {
      toast.info("Time is up!");
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

    // 6. Update achievements
    updateAchievements("completeSession");

    // 7. Update Statistics (as per your existing logic)
    let sessionDuration = 0;
    switch (timerState.mode) {
      case "focus":
        sessionDuration = 25;
        break;
      case "shortBreak":
        sessionDuration = 5;
        break;
      case "longBreak":
        sessionDuration = 15;
        break;
      case "custom":
        sessionDuration = settings.interval;
        break;
      default:
        sessionDuration = 15;
    }

    const sessionMinutes = sessionDuration;

    const today = new Date().toISOString().split("T")[0];
    const lastSessionDate = statistics.lastSessionDate;

    let newDailyStreak = statistics.dailyStreak;
    let newBestStreak = statistics.bestStreak;

    if (lastSessionDate === today) {
      // Session already recorded today; do not increment
    } else {
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];
      if (lastSessionDate === yesterday) {
        newDailyStreak += 1;
        if (newDailyStreak > newBestStreak) {
          newBestStreak = newDailyStreak;
        }
      } else {
        newDailyStreak = 1;
        if (newDailyStreak > newBestStreak) {
          newBestStreak = newDailyStreak;
        }
      }
    }

    const newTotalSessions = statistics.totalSessions + 1;
    const newTotalMinutes = statistics.totalMinutes + sessionMinutes;
    const newAverageSessionDuration =
      newTotalSessions === 0 ? 0 : newTotalMinutes / newTotalSessions;
    const newCompletionRate = 100; // Assuming each session is a completion

    // Update session history
    const newSession: Session = {
      date: new Date().toISOString(),
      duration: sessionMinutes,
      completedBreaks: 0,
      skippedBreaks: 0,
      focusScore: sessionMinutes,
    };

    const updatedSessionHistory = [
      newSession,
      ...statistics.sessionHistory,
    ].slice(0, 100); // Keep last 100 sessions

    setStatistics((prev) => ({
      ...prev,
      totalSessions: newTotalSessions,
      totalMinutes: newTotalMinutes,
      dailyStreak: newDailyStreak,
      bestStreak: newBestStreak,
      lastSessionDate: today,
      averageSessionDuration: newAverageSessionDuration,
      completionRate: newCompletionRate,
      sessionHistory: updatedSessionHistory,
      // Update other statistics as needed
    }));
  }, [settings, updateAchievements, timerState.mode, statistics]);

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
    updateAchievements("resetSession");
  }, [settings, updateAchievements]);

  // Start or resume the timer
  const handleStartOrResume = useCallback(() => {
    const now = Date.now();
    const newEndTime = now + timerState.timeLeft * 1000;

    // Immediately compute newTimeLeft instead of waiting for the interval
    const newTimeLeft = Math.floor((newEndTime - now) / 1000);

    setTimerState((prev) => ({
      ...prev,
      isActive: true,
      isPaused: false,
      startTime: now,
      endTime: newEndTime,
      timeLeft: newTimeLeft, // <-- force the display to update now
    }));
    updateAchievements("startSession");
  }, [timerState.timeLeft, updateAchievements]);


  // Pause the timer
  const handlePause = useCallback(() => {
    setTimerState((prev) => ({
      ...prev,
      isPaused: true,
      // Clear endTime so we know we have leftover time
      endTime: null,
    }));
    updateAchievements("pauseSession");
  }, [updateAchievements]);

  // -------------------
  // 4) Favorite Quote Handlers
  // -------------------
  const handleFavoriteQuote = (quote?: Quote) => {
    if (!quote) return;
    const isAlreadyFavorite = favoriteQuotes.some((q) => q.id === quote.id);
    if (isAlreadyFavorite) {
      toast.info(`"${quote.text}" is already in your favorites.`);
      return;
    }

    toast.success(`Added "${quote.text}" to favorites!`);
    setFavoriteQuotes((prev) => [...prev, quote]);
  };

  const handleRemoveFavorite = (quoteId: string) => {
    setFavoriteQuotes((prev) => prev.filter((quote) => quote.id !== quoteId));
    toast.info("Removed quote from favorites.");
  };

  // -------------------
  // 5) Timer countdown effect
  // -------------------
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (
      timerState.isActive &&
      !timerState.isPaused &&
      timerState.endTime !== null
    ) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const remainingTime = Math.floor((timerState.endTime! - now) / 1000);
        if (remainingTime <= 0) {
          handleTimerComplete();
          clearInterval(intervalId);
        } else {
          setTimerState((prev) => ({
            ...prev,
            timeLeft: remainingTime > 0 ? remainingTime : 0,
          }));
        }
      }, 1000);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [
    timerState.isActive,
    timerState.isPaused,
    timerState.endTime,
    handleTimerComplete,
  ]);

  // -------------------
  // 6) Handle App Visibility Changes
  // -------------------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && timerState.isActive && timerState.endTime) {
        const now = Date.now();
        if (timerState.endTime <= now) {
          handleTimerComplete();
        } else {
          const remainingTime = Math.floor((timerState.endTime - now) / 1000);
          setTimerState((prev) => ({
            ...prev,
            timeLeft: remainingTime > 0 ? remainingTime : 0,
            isActive: remainingTime > 0,
          }));
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [timerState.isActive, timerState.endTime, handleTimerComplete]);

  // -------------------
  // 7) Load data from storage on mount
  // and handle leftover time if endTime > Date.now()
  // -------------------
  useEffect(() => {
    async function loadData() {
      // Load settings
      const storedSettings = await getStorageData(["appSettings"]);
      if (storedSettings.appSettings) {
        setSettings(storedSettings.appSettings);
      }

      // Load timer state
      const storedTimer = await getStorageData(["timerState"]);
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
      const storedAchievements = await getStorageData(["achievements"]);
      if (storedAchievements.achievements) {
        setAchievements(storedAchievements.achievements);
      }

      // Load favorite quotes
      const storedFavorites = await getStorageData(["favoriteQuotes"]);
      if (storedFavorites.favoriteQuotes) {
        setFavoriteQuotes(storedFavorites.favoriteQuotes);
      }

      // Load statistics
      const storedStatistics = await getStorageData(["statistics"]);
      if (storedStatistics.statistics) {
        setStatistics(storedStatistics.statistics);
      } else {
        // Initialize statistics if not present
        setStatistics(initialStatistics);
        await setStorageData({ statistics: initialStatistics });
      }
    }
    loadData();
  }, []);

  // -------------------
  // 8) Persist changes to storage
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

  useEffect(() => {
    setStorageData({ favoriteQuotes });
  }, [favoriteQuotes]);

  useEffect(() => {
    setStorageData({ statistics });
  }, [statistics]);

  // -------------------
  // 9) Theme & Notification request
  // -------------------
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

  useEffect(() => {
    if (settings.soundEnabled && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, [settings.soundEnabled]);

  const handleThemeToggle = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  };

  // -------------------
  // 10) Rendering
  // -------------------
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Joyride Component */}
      <Joyride
        steps={joyrideSteps}
        run={runJoyride}
        continuous
        showProgress
        showSkipButton
        hideCloseButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            zIndex: 1000,
            primaryColor: "#3b82f6",
            textColor: "#1f2937",
            width: 290,
            backgroundColor: "white",
          },
          tooltip: {
            padding: "12px",
            fontSize: "14px",
            maxWidth: "100%",
          },
          tooltipContent: {
            padding: "8px 0",
            textAlign: "left",
          },
          tooltipTitle: {
            margin: "0 0 8px 0",
            fontSize: "14px",
            fontWeight: "bold",
          },
          tooltipContainer: {
            textAlign: "left",
            wordBreak: "break-word",
          },
        }}
      />
      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto px-4 pb-24 w-full max-w-md mx-auto">
        {/* HEADER */}
        <div className="sticky top-0 pt-6 pb-4 bg-gray-50 dark:bg-gray-900 z-10">
          <div className="grid grid-cols-[48px_1fr_48px] gap-4 items-center">
            {/* Left side: theme toggle - fixed width */}
            <div>
              <button
                onClick={handleThemeToggle}
                className="p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Switch theme"
              >
                {settings.theme === "dark" ? (
                  <Sun className="w-6 h-6" />
                ) : (
                  <Moon className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Center: title */}
            <div className="flex justify-center items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                Screen Time Guardian
              </h1>
            </div>

            {/* Right side: settings btn - fixed width */}
            <div className="flex justify-end">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="settings-button p-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="Open Settings"
              >
                <SettingsIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div className="space-y-6 mt-2">
          {activeTab === "timer" && (
            <div className="space-y-6">
              {/* Timer Component */}
              <div className="timer-container">
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
              </div>

              {/* Reset and How To Use buttons */}
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleResetTimer}
                  className="reset-timer px-6 py-2 bg-gray-600 text-white rounded-full shadow hover:bg-gray-700 transition"
                  aria-label="Reset Timer"
                >
                  Reset
                </button>
                <button
                  onClick={() => setRunJoyride(true)}
                  className="px-6 py-2 bg-blue-800 text-white rounded-full shadow hover:bg-blue-900 transition"
                  aria-label="How To Use"
                >
                  How To Use
                </button>
              </div>

              {settings.showQuotes && (
                <div className="quote-container mt-4">
                  <QuoteComponent
                    changeInterval={settings.quoteChangeInterval}
                    category={settings.quoteCategory}
                    forceChange={quoteChangeCounter}
                    onFavorite={handleFavoriteQuote}
                    favoriteQuotes={favoriteQuotes}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === "stats" && <Stats statistics={statistics} />}

          {activeTab === "quotes" && settings.showQuotes && (
            <div className="space-y-4">
              {/* Heading */}
              <h2 className="text-xl font-semibold text-gray-700 dark:text-white text-center">
                Favorite Quotes
              </h2>

              {/* Favorite Quotes List or Message */}
              {favoriteQuotes.length > 0 ? (
                <div className="space-y-2">
                  {favoriteQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="
                        p-3 border rounded-lg
                        dark:border-gray-600 dark:bg-gray-700
                        bg-gray-50 border-gray-300
                        flex items-start justify-between
                      "
                    >
                      <div className="flex items-start">
                        <span className="mr-2">
                          <Star className="w-6 h-6 text-yellow-400" />
                        </span>
                        <div>
                          <p className="text-sm text-gray-800 dark:text-gray-200">
                            "{quote.text}"
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            - {quote.author}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(quote.id)}
                        className="text-red-500 dark:text-red-400 font-medium hover:text-red-600 dark:hover:text-red-300 transition-colors"
                        aria-label="Remove Favorite"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // Center-aligned message when no favorites
                <p className="text-gray-600 dark:text-gray-300 text-center mx-auto">
                  You have no favorite quotes.
                </p>
              )}
            </div>
          )}

          {activeTab === "achievements" && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold dark:text-white">
                Achievements
              </h2>
              <div className="space-y-3">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex items-center space-x-4 ${
                      ach.unlockedAt
                        ? "border-2 border-green-500"
                        : "border border-gray-300 dark:border-gray-700"
                    }`}
                  >
                    <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                      <Trophy className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-medium dark:text-white">
                        {ach.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {ach.description}
                      </p>
                      {ach.progress < ach.target && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Progress: {ach.progress}/{ach.target}
                        </div>
                      )}
                      {ach.unlockedAt && (
                        <div className="text-xs text-green-500 dark:text-green-400 mt-1">
                          Unlocked on{" "}
                          {new Date(ach.unlockedAt).toLocaleDateString()}
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
            onClick={() => setActiveTab("timer")}
            className={`flex flex-col items-center p-2 ${
              activeTab === "timer"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
            aria-label="Timer"
          >
            <TimerIcon className="w-6 h-6" />
            <span className="text-xs mt-1 font-medium">Timer</span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex flex-col items-center p-2 ${
              activeTab === "stats"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
            aria-label="Stats"
          >
            <BarChart className="w-6 h-6" />
            <span className="text-xs mt-1">Stats</span>
          </button>

          <button
            onClick={() => setActiveTab("quotes")}
            className={`flex flex-col favorite-quotes items-center p-2 ${
              activeTab === "quotes"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
            }`}
            aria-label="Quotes"
          >
            <QuoteIcon className="w-6 h-6" />
            <span className="text-xs mt-1">Quotes</span>
          </button>

          <button
            onClick={() => setActiveTab("achievements")}
            className={`flex flex-col items-center p-2 ${
              activeTab === "achievements"
                ? "text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400"
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
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
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
