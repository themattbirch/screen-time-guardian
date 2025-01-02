// /src/components/Timer/Timer.tsx

import React from 'react';

interface TimerProps {
  timeLeft: number;
  isActive: boolean;
  isPaused: boolean;
  mode: 'focus' | 'shortBreak' | 'longBreak' | 'custom';
  onStart: () => void;
  onStop: () => void;
  onComplete: () => void;
  isShrunk: boolean;
  isBlinking: boolean;
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
      className={`flex flex-col items-center text-center
        ${isBlinking ? 'animate-blink' : ''}
        ${isShrunk ? 'p-2' : 'p-4'}
      `}
    >
      <div
        className="cursor-pointer"
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <div className="text-5xl md:text-6xl font-bold">
          {formatTime(timeLeft)}
        </div>
      </div>

      {!isShrunk && (
        <div className="flex justify-center gap-4 mt-4">
          {!isActive && !isPaused && (
            <button
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-green-300 transition"
              onClick={onStart}
              aria-label="Start Timer"
            >
              Start
            </button>
          )}

          {isActive && !isPaused && (
            <button
              className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-red-400 transition"
              onClick={onStop}
              aria-label="Pause Timer"
            >
              Pause
            </button>
          )}

          {isPaused && (
            <button
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
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
