// src/utils/storage.ts

import { openDB } from 'idb';
import { StorageData, Statistics, Session } from '../types/app';
import { achievements as predefinedAchievements } from './achievements'; // Ensure this import exists

const DB_NAME = 'ScreenTimeGuardianDB';
const STORE_NAME = 'settings';

// Define initial statistics
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
  achievements: predefinedAchievements, // Ensure this matches your achievements setup
  sessionHistory: [],
};

// Initialize the IndexedDB database with the StorageData interface
const dbPromise = openDB<StorageData>(DB_NAME, 1, {
  upgrade(db) {
    // Create an object store named 'settings'
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      db.createObjectStore(STORE_NAME);
    }
  },
});

/**
 * Fetches data from IndexedDB.
 * @param keys - Array of keys from StorageData to retrieve.
 * @returns An object containing the requested keys.
 */
export async function getStorageData<K extends keyof StorageData>(
  keys: K[]
): Promise<Pick<StorageData, K>> {
  try {
    const db = await dbPromise;
    const result: Partial<Pick<StorageData, K>> = {};

    for (const key of keys) {
      const value = await db.get(STORE_NAME, key);
      if (value !== undefined) {
        result[key] = value;
      }
    }

    // If 'statistics' is requested and not present, initialize it
if (keys.includes('statistics' as K) && !('statistics' in result)) {
  const stats = { ...initialStatistics };
  result['statistics' as K] = stats as any;
  await setStorageData({ statistics: stats } as Partial<StorageData>);
}

    return result as Pick<StorageData, K>;
  } catch (error) {
    console.error('Failed to get storage data:', error);
    return {} as Pick<StorageData, K>;
  }
}

export async function setStorageData<K extends keyof StorageData>(
  data: Partial<Pick<StorageData, K>>
): Promise<void> {
  try {
    const db = await dbPromise;
    const tx = db.transaction(STORE_NAME, 'readwrite');

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        await tx.store.put(data[key as K], key);
      }
    }

    await tx.done;
  } catch (error) {
    console.error('Failed to set storage data:', error);
  }
}
