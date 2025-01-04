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

  const statusLabel = () => {
    if (timeLeft === 0) return 'Completed!';
    if (isActive && !isPaused) return 'Running';
    if (isPaused) return 'Paused';
    return 'Ready';
  };

  return (
    <div className="w-full max-w-xs mx-auto">
      <div
        className={`
          aspect-square w-64 mx-auto
          rounded-full
          bg-white dark:bg-gray-800
          shadow-lg dark:shadow-gray-900
          flex items-center justify-center
          cursor-pointer
          transition-all duration-300
          hover:shadow-xl
          ${isBlinking ? 'animate-pulse' : ''}
          ${isShrunk ? 'scale-75' : 'scale-100'}
        `}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <div className="flex flex-col items-center">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            {mode === 'focus'
              ? 'Focus Time'
              : mode === 'shortBreak'
              ? 'Short Break'
              : mode === 'longBreak'
              ? 'Long Break'
              : 'Custom Timer'}
          </div>

          <div
            className={`
              text-5xl md:text-6xl font-bold
              text-gray-900 dark:text-white
              transition-colors duration-300
              ${isActive && !isPaused ? 'text-green-600 dark:text-green-400' : ''}
              ${isPaused ? 'text-yellow-600 dark:text-yellow-400' : ''}
            `}
          >
            {formatTime(timeLeft)}
          </div>

          {/* Status label */}
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">
            {statusLabel()}
          </div>
        </div>
      </div>

      {!isShrunk && (
        <div className="flex justify-center gap-4 mt-8">
          {!isActive && !isPaused && (
            <button
              className="
                px-8 py-3
                bg-green-600 hover:bg-green-700
                text-white font-medium
                rounded-full
                shadow-md hover:shadow-lg
                transform hover:-translate-y-0.5
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
              "
              onClick={onStart}
              aria-label="Start Timer"
            >
              Start
            </button>
          )}

          {isActive && !isPaused && (
            <button
              className="
                px-8 py-3
                bg-red-500 hover:bg-red-600
                text-white font-medium
                rounded-full
                shadow-md hover:shadow-lg
                transform hover:-translate-y-0.5
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
              "
              onClick={onStop}
              aria-label="Pause Timer"
            >
              Pause
            </button>
          )}

          {isPaused && (
            <button
              className="
                px-8 py-3
                bg-blue-500 hover:bg-blue-600
                text-white font-medium
                rounded-full
                shadow-md hover:shadow-lg
                transform hover:-translate-y-0.5
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              "
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

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
