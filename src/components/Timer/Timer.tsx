import React from 'react';
import './Timer.css';

interface TimerProps {
  timeLeft: number;                      // Current time left in seconds
  isActive: boolean;                    // True if the timer is running
  isPaused: boolean;                    // True if the timer is paused
  mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  onStart: () => void;                  // Called when user clicks start/resume
  onStop: () => void;                   // Called when user clicks pause
  onComplete: () => void;               // Called when the timer finishes
  isShrunk: boolean;                    // If the UI is in "minimal" mode
  isBlinking: boolean;                  // If we should animate a blink effect
  // Optional: the parent can pass down a "deadline" or a "computeDeadline" if desired
}

export const Timer: React.FC<TimerProps> = ({
  timeLeft,
  isActive,
  isPaused,
  mode,
  onStart,
  onStop,
  onComplete,
  isShrunk,
  isBlinking
}) => {
  const handleClick = () => {
    if (isActive && !isPaused) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div
      className={`timer-wrapper flex flex-col items-center text-center
        ${isBlinking ? 'blinking' : ''}
        ${isShrunk ? 'p-2' : 'p-4'}`}
    >
      <div
        className="timer-display cursor-pointer"
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <div className="timer-text text-4xl font-bold">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* 
        If not shrunk => show normal Start/Pause/Resume.
        If shrunk => the parent may handle minimal controls.
      */}
      {!isShrunk && (
        <div className="timer-buttons flex justify-center gap-4 mt-4">
          {/* Not active, not paused => Start */}
          {!isActive && !isPaused && (
            <button
              className="start-button px-6 py-2 text-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-green-300"
              onClick={onStart}
              aria-label="Start Timer"
            >
              Start
            </button>
          )}

          {/* Active & not paused => Pause */}
          {isActive && !isPaused && (
            <button
              className="pause-button px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={onStop}
              aria-label="Pause Timer"
            >
              Pause
            </button>
          )}

          {/* Paused => Resume */}
          {isPaused && (
            <button
              className="resume-button px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              onClick={onStart}
              aria-label="Resume Timer"
            >
              Resume
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function
function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
