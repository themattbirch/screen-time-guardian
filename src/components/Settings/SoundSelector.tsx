// /src/components/Settings/SoundSelector.tsx
import React, { useState, useEffect } from "react";
import { Play } from "lucide-react";
import { soundManager, availableSounds } from "../../utils/sounds";

interface SoundSelectorProps {
  selectedSound: string;
  volume: number;
  onSoundSelect: (soundId: string) => void;
  onVolumeChange: (volume: number) => void;
}

export function SoundSelector({
  selectedSound,
  volume,
  onSoundSelect,
  onVolumeChange,
}: SoundSelectorProps) {
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );

  // Volume changes only
  useEffect(() => {
    soundManager.setVolume(volume);
  }, [volume]);

  // ----------------------------------------------------
  // Handle user preview
  // ----------------------------------------------------
  const handlePreview = async (soundId: string) => {
    if (previewingSound) return;

    setPreviewingSound(soundId);

    try {
      // If not loaded, fetch & decode first (within a user gesture)
      if (!soundManager.isSoundLoaded(soundId)) {
        setLoadingStates((prev) => ({ ...prev, [soundId]: true }));
        const soundObj = availableSounds.find((s) => s.id === soundId);
        if (soundObj) {
          await soundManager.loadSound(soundObj);
        }
        setLoadingStates((prev) => ({ ...prev, [soundId]: false }));
      }

      // Now play
      await soundManager.playSound(soundId);

      // Optional: small delay before user can preview again
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.warn("Failed to preview sound:", error);
    } finally {
      setPreviewingSound(null);
    }
  };

  // ----------------------------------------------------
  // Handle user select (radio button)
  // ----------------------------------------------------
  const handleSoundSelect = async (soundId: string) => {
    try {
      // If not loaded, fetch & decode first
      if (!soundManager.isSoundLoaded(soundId)) {
        setLoadingStates((prev) => ({ ...prev, [soundId]: true }));
        const soundObj = availableSounds.find((s) => s.id === soundId);
        if (soundObj) {
          await soundManager.loadSound(soundObj);
        }
        setLoadingStates((prev) => ({ ...prev, [soundId]: false }));
      }
      onSoundSelect(soundId);
    } catch (error) {
      console.warn("Error selecting sound:", error);
    }
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex flex-col space-y-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
          Select Your Sound:
        </label>

        {/* Volume Slider */}
        <div className="flex items-center space-x-2 mb-4">
          <span className="text-sm text-gray-700 dark:text-gray-200 min-w-[60px]">
            Volume:
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="flex-grow"
            aria-label="Sound volume"
          />
        </div>

        {/* Sound List */}
        <div className="space-y-3">
          {availableSounds.map((sound) => {
            const isLoading = loadingStates[sound.id];
            const isPreviewDisabled = previewingSound === sound.id || isLoading;

            return (
              <div key={sound.id} className="flex items-center space-x-3 py-1">
                {/* Radio Button */}
                <input
                  type="radio"
                  id={sound.id}
                  name="soundSelect"
                  value={sound.id}
                  checked={sound.id === selectedSound}
                  onChange={() => handleSoundSelect(sound.id)}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  disabled={isLoading}
                />
                <label
                  htmlFor={sound.id}
                  className="flex-grow text-sm text-gray-700 dark:text-gray-200"
                >
                  {sound.name}
                  {isLoading && " (Loading...)"}
                </label>

                {/* Preview Button */}
                <button
                  onClick={() => handlePreview(sound.id)}
                  className={`flex items-center px-3 py-1 text-sm 
                    bg-gray-400 dark:bg-gray-700 
                    hover:bg-gray-500 dark:hover:bg-gray-600 
                    rounded-md transition-colors
                    ${isPreviewDisabled ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                  disabled={isPreviewDisabled}
                  aria-label={`Preview ${sound.name}`}
                >
                  <Play className="w-3 h-3 mr-1" />
                  Preview
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
