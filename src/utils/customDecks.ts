import type { CustomDeck } from '../types/customDecks';
import type { LessonItem } from '../types/korean';
import { cleanKoreanTarget, isTypeableKoreanTarget } from './cleanKoreanTarget';
import { romanize } from './romanizer';

/** Primary IndexedDB database name for offline Korean Typing Tutor assets. */
const DB_NAME = 'KoreanTypingTutorDB';

/** Schema version for the IndexedDB database. */
const DB_VERSION = 1;

/** Object store name housing user-imported custom flashcard decks. */
export const STORE_NAME = 'custom_decks';

/** Legacy storage key previously used for storing decks in LocalStorage. */
export const LEGACY_STORAGE_KEY = 'korean_tutor_custom_decks';

/** Memoized database connection promise to avoid redundant concurrent open requests. */
let dbPromise: Promise<IDBDatabase | null> | null = null;

/** In-memory cache of currently loaded custom decks for synchronous reads. */
let cachedDecks: readonly CustomDeck[] = [];

/** In-flight initialization and migration promise to prevent race conditions. */
let initPromise: Promise<void> | null = null;

/**
 * Returns the active IndexedDB instance, establishing and memoizing the connection if necessary.
 * Returns null if IndexedDB is not supported in the current environment (e.g. Node/SSR).
 */
function getDb(): Promise<IDBDatabase | null> {
  if (dbPromise) {
    return dbPromise;
  }

  if (typeof window === 'undefined' || typeof indexedDB === 'undefined') {
    dbPromise = Promise.resolve(null);
    return dbPromise;
  }

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        console.warn('[CustomDecks] Failed to open IndexedDB:', request.error);
        resolve(null);
      };
    } catch (error) {
      console.warn('[CustomDecks] Exception while opening IndexedDB:', error);
      resolve(null);
    }
  });

  return dbPromise;
}

/**
 * Defensively cleans and validates raw deck objects:
 * - Strips untypeable Hanja glosses and invalid characters.
 * - Discards untypeable items (e.g. bare Hanja, quiz questions).
 * - Re-computes Romanization when target text is sanitized.
 */
function sanitizeDeck(rawDeck: unknown): CustomDeck | null {
  if (
    typeof rawDeck !== 'object' ||
    rawDeck === null ||
    typeof (rawDeck as CustomDeck).id !== 'string' ||
    typeof (rawDeck as CustomDeck).title !== 'string' ||
    !Array.isArray((rawDeck as CustomDeck).items)
  ) {
    return null;
  }

  const typedDeck = rawDeck as CustomDeck;
  const sanitizedItems: LessonItem[] = [];

  for (const item of typedDeck.items) {
    if (!item || typeof item.target !== 'string') {
      continue;
    }

    const cleanedTarget = cleanKoreanTarget(item.target);
    if (!isTypeableKoreanTarget(cleanedTarget)) {
      continue;
    }

    if (cleanedTarget !== item.target) {
      sanitizedItems.push({
        ...item,
        target: cleanedTarget,
        pronunciation: romanize(cleanedTarget),
      });
    } else {
      sanitizedItems.push(item);
    }
  }

  if (sanitizedItems.length === 0) {
    return null;
  }

  return {
    ...typedDeck,
    itemCount: sanitizedItems.length,
    items: sanitizedItems,
  };
}

/**
 * Migrates any legacy custom decks stored in LocalStorage into IndexedDB,
 * then purges the legacy LocalStorage key to reclaim the browser quota.
 */
async function migrateLegacyLocalStorage(db: IDBDatabase): Promise<void> {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!rawLegacy) {
      return;
    }

    const parsed = JSON.parse(rawLegacy);
    if (!Array.isArray(parsed)) {
      return;
    }

    const validDecks: CustomDeck[] = [];
    for (const rawDeck of parsed) {
      const sanitized = sanitizeDeck(rawDeck);
      if (sanitized) {
        validDecks.push(sanitized);
      }
    }

    if (validDecks.length > 0) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        for (const deck of validDecks) {
          store.put(deck);
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  } catch (error) {
    console.warn('[CustomDecks] Failed to migrate legacy decks from LocalStorage:', error);
  } finally {
    // Purge legacy key to free up 5 MB browser quota
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // Ignore removal failure
    }
  }
}

/**
 * Internal helper to guarantee database opening, legacy migration,
 * and initial hydration complete exactly once before any operations execute.
 */
function ensureInitialized(): Promise<void> {
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const db = await getDb();

    if (db) {
      try {
        await migrateLegacyLocalStorage(db);

        const decks = await new Promise<CustomDeck[]>((resolve, reject) => {
          const tx = db.transaction([STORE_NAME], 'readonly');
          const store = tx.objectStore(STORE_NAME);
          const request = store.getAll();

          request.onsuccess = () => {
            const rawResults = request.result || [];
            const sanitizedDecks: CustomDeck[] = [];
            for (const item of rawResults) {
              const sanitized = sanitizeDeck(item);
              if (sanitized) {
                sanitizedDecks.push(sanitized);
              }
            }
            resolve(sanitizedDecks);
          };

          request.onerror = () => reject(request.error);
        });

        cachedDecks = decks;
        return;
      } catch (error) {
        console.warn('[CustomDecks] Error retrieving decks from IndexedDB, falling back:', error);
      }
    }

    // Fallback: LocalStorage support for environments without IndexedDB (e.g. Node/SSR/jsdom)
    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const sanitized: CustomDeck[] = [];
            for (const item of parsed) {
              const deck = sanitizeDeck(item);
              if (deck) {
                sanitized.push(deck);
              }
            }
            cachedDecks = sanitized;
            return;
          }
        }
      } catch (e) {
        console.warn('[CustomDecks] LocalStorage fallback read error:', e);
      }
    }

    cachedDecks = [];
  })();

  return initPromise;
}

/**
 * Loads all custom decks from IndexedDB (or fallback LocalStorage).
 * Runs automatic one-time legacy migration from LocalStorage if needed.
 * Returns a defensive copy of the cached custom decks.
 */
export async function loadCustomDecks(): Promise<readonly CustomDeck[]> {
  await ensureInitialized();
  return [...cachedDecks];
}

/**
 * Returns the currently cached custom decks synchronously.
 */
export function getLoadedCustomDecks(): readonly CustomDeck[] {
  return [...cachedDecks];
}

/**
 * Adds or updates a custom deck in IndexedDB (or fallback LocalStorage).
 */
export async function saveCustomDeck(deck: CustomDeck): Promise<readonly CustomDeck[]> {
  // Ensure initialization / legacy migration has completed first
  await ensureInitialized();

  const sanitized = sanitizeDeck(deck);
  if (!sanitized) {
    return [...cachedDecks];
  }

  const existingIndex = cachedDecks.findIndex((d) => d.id === sanitized.id);
  if (existingIndex >= 0) {
    const updated = [...cachedDecks];
    updated[existingIndex] = sanitized;
    cachedDecks = updated;
  } else {
    cachedDecks = [...cachedDecks, sanitized];
  }

  const db = await getDb();
  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(sanitized);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return [...cachedDecks];
    } catch (error) {
      console.warn('[CustomDecks] Error writing to IndexedDB:', error);
    }
  }

  // Fallback: LocalStorage
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(cachedDecks));
    } catch (error) {
      console.warn('[CustomDecks] LocalStorage fallback write error:', error);
    }
  }

  return [...cachedDecks];
}

/**
 * Deletes a custom deck by ID from IndexedDB (or fallback LocalStorage).
 */
export async function deleteCustomDeck(deckId: string): Promise<readonly CustomDeck[]> {
  await ensureInitialized();

  cachedDecks = cachedDecks.filter((d) => d.id !== deckId);

  const db = await getDb();
  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.delete(deckId);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      return [...cachedDecks];
    } catch (error) {
      console.warn('[CustomDecks] Error deleting from IndexedDB:', error);
    }
  }

  // Fallback: LocalStorage
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(cachedDecks));
    } catch (error) {
      console.warn('[CustomDecks] LocalStorage fallback delete error:', error);
    }
  }

  return [...cachedDecks];
}

/**
 * Clears all custom decks across both IndexedDB and LocalStorage.
 */
export async function clearAllCustomDecks(): Promise<void> {
  await ensureInitialized();
  cachedDecks = [];

  const db = await getDb();
  if (db) {
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.clear();

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.warn('[CustomDecks] Error clearing IndexedDB store:', error);
    }
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}

/**
 * Resets memoized promises and in-memory caches. Intended strictly for test hygiene.
 */
export function resetDeckStorageForTesting(): void {
  dbPromise = null;
  initPromise = null;
  cachedDecks = [];
}
