// src/components/Stats/Stats.tsx

import React from 'react';
import { Statistics } from '../../types/app';

interface StatsProps {
  statistics: Statistics;
}

export const Stats: React.FC<StatsProps> = ({ statistics }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold dark:text-white">Your Progress</h2>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Sessions */}
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statistics.totalSessions}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Sessions</div>
          </div>

          {/* Total Minutes */}
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statistics.totalMinutes} mins</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Total Minutes</div>
          </div>

          {/* Daily Streak */}
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{statistics.dailyStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Daily Streak</div>
          </div>

          {/* Best Streak */}
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{statistics.bestStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Best Streak</div>
          </div>

          {/* Average Session Duration */}
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{statistics.averageSessionDuration.toFixed(1)} mins</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Avg. Session Duration</div>
          </div>

          {/* Completion Rate */}
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600">{statistics.completionRate}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Completion Rate</div>
          </div>

          {/* Focus Score */}
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{statistics.focusScore}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Focus Score</div>
          </div>

          {/* Weekly Minutes */}
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600">{statistics.weeklyMinutes} mins</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Weekly Minutes</div>
          </div>

          {/* Monthly Minutes */}
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{statistics.monthlyMinutes} mins</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Monthly Minutes</div>
          </div>
        </div>
      </div>
    </div>
  );
};
