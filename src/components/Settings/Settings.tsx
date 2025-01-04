import React from 'react';
import { X } from 'lucide-react';
import { AppSettings } from '../../types/app';
import { achievements } from '../../utils/achievements';
import { SoundSelector } from './SoundSelector';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (newSettings: AppSettings) => void;
}

export function Settings({ isOpen, onClose, settings, onSettingsChange }: SettingsProps) {
  const [showAchievements, setShowAchievements] = React.useState(false);

  if (!isOpen) return null;

  const handleChange = (key: keyof AppSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-start z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl mt-8">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close Settings"
          >
            <X className="w-6 h-6 text-gray-300 dark:text-gray-400" />
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-4 space-y-6">
          {/* Timer Mode */}
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-900 dark:text-white">
              Timer Mode
            </label>
            <select
              value={settings.timerMode}
              onChange={(e) => handleChange('timerMode', e.target.value)}
              className="
                w-full p-3
                bg-gray-50 dark:bg-gray-800
                text-gray-800 dark:text-gray-100
                border border-gray-300 dark:border-gray-700
                rounded-lg
                focus:ring-2 focus:ring-blue-500
              "
            >
              <option value="focus">Focus (25 minutes)</option>
              <option value="shortBreak">Short Break (5 minutes)</option>
              <option value="longBreak">Long Break (15 minutes)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {settings.timerMode === 'custom' && (
            <div className="space-y-2">
              <label className="text-base font-medium text-gray-900 dark:text-white">
                Custom Duration (minutes)
              </label>
              <input
                type="number"
                value={settings.interval}
                onChange={(e) => handleChange('interval', Number(e.target.value))}
                min={1}
                className="
                  w-full p-3
                  bg-gray-50 dark:bg-gray-800
                  text-gray-800 dark:text-gray-100
                  border border-gray-300 dark:border-gray-700
                  rounded-lg
                  focus:ring-2 focus:ring-blue-500
                "
              />
            </div>
          )}

          {/* Sound Volume */}
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-900 dark:text-white">
              Sound Volume
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.soundVolume}
              onChange={(e) => handleChange('soundVolume', Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Enable Sounds */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.soundEnabled}
              onChange={(e) => handleChange('soundEnabled', e.target.checked)}
              className="
                w-5 h-5
                border border-gray-300 dark:border-gray-600
                rounded
                text-blue-500
                focus:ring-blue-500
                cursor-pointer
              "
            />
            <span className="text-base text-gray-900 dark:text-white">Enable Sounds</span>
          </label>

          {/* Quote Category */}
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-900 dark:text-white">
              Quote Category
            </label>
            <select
              value={settings.quoteCategory}
              onChange={(e) => handleChange('quoteCategory', e.target.value)}
              className="
                w-full p-3
                bg-gray-50 dark:bg-gray-800
                text-gray-800 dark:text-gray-100
                border border-gray-300 dark:border-gray-700
                rounded-lg
                focus:ring-2 focus:ring-blue-500
              "
            >
              <option value="all">All</option>
              <option value="motivation">Motivation</option>
              <option value="relaxation">Relaxation</option>
              <option value="gratitude">Gratitude</option>
            </select>
          </div>

          {/* Show Quotes */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.showQuotes}
              onChange={(e) => handleChange('showQuotes', e.target.checked)}
              className="
                w-5 h-5
                border border-gray-300 dark:border-gray-600
                rounded
                text-blue-500
                focus:ring-blue-500
                cursor-pointer
              "
            />
            <span className="text-base text-gray-900 dark:text-white">Show Quotes</span>
          </label>

          {/* Theme */}
          <div className="space-y-2">
            <label className="text-base font-medium text-gray-900 dark:text-white">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value)}
              className="
                w-full p-3
                bg-gray-50 dark:bg-gray-800
                text-gray-800 dark:text-gray-100
                border border-gray-300 dark:border-gray-700
                rounded-lg
                focus:ring-2 focus:ring-blue-500
              "
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Sound Selector */}
          <SoundSelector
            selectedSound={settings.selectedSound}
            volume={settings.soundVolume}
            onSoundSelect={(soundId) => handleChange('selectedSound', soundId)}
            onVolumeChange={(volume) => handleChange('soundVolume', volume)}
          />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={() => setShowAchievements(!showAchievements)}
            className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            View Achievements
          </button>

          {showAchievements && (
            <div className="space-y-4 mt-4">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                Achievements
              </h2>
              <div className="space-y-2">
                {achievements.map((ach) => (
                  <div
                    key={ach.id}
                    className="
                      p-3 border rounded-lg
                      dark:border-gray-600 dark:bg-gray-700
                      bg-gray-50 border-gray-300
                      flex items-center justify-between
                    "
                  >
                    <div>
                      <div className="font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                        <span className="mr-2">{ach.icon}</span>
                        {ach.name}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {ach.description}
                      </div>
                      {ach.progress < ach.target && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Progress: {ach.progress}/{ach.target}
                        </div>
                      )}
                    </div>
                    {ach.unlockedAt ? (
                      <span className="text-green-600 dark:text-green-400 font-bold">Unlocked</span>
                    ) : (
                      <span className="text-gray-500 dark:text-gray-400">Locked</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
