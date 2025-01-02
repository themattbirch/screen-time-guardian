// /src/utils/storage.ts

import { openDB } from 'idb';
import { StorageData } from '../types/app';

const DB_NAME = 'ScreenTimeGuardianDB';
const STORE_NAME = 'settings';

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE_NAME);
  },
});

/**
 * Fetches data from IndexedDB.
 * @param keys - Array of keys from StorageData to retrieve.
 * @returns An object containing the requested keys.
 */
export async function getStorageData<K extends keyof StorageData>(keys: K[]): Promise<Partial<Pick<StorageData, K>>> {
  const db = await dbPromise;
  const result: Partial<Pick<StorageData, K>> = {};
  for (const key of keys) {
    const value = await db.get(STORE_NAME, key);
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Sets data in IndexedDB.
 * @param data - An object containing key-value pairs from StorageData to set.
 */
export async function setStorageData<K extends keyof StorageData>(data: Pick<StorageData, K>): Promise<void> {
  const db = await dbPromise;
  const tx = db.transaction(STORE_NAME, 'readwrite');
  for (const [key, value] of Object.entries(data)) {
    await tx.store.put(value, key);
  }
  await tx.done;
}
