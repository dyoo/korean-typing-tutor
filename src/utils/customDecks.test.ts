import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadCustomDecks,
  saveCustomDeck,
  deleteCustomDeck,
  clearAllCustomDecks,
  resetDeckStorageForTesting,
  getLoadedCustomDecks,
  STORE_NAME,
  LEGACY_STORAGE_KEY,
} from './customDecks';
import type { CustomDeck } from '../types/customDecks';

/**
 * Creates a lightweight, spec-compliant in-memory IndexedDB mock for unit testing.
 * Simulates standard IDB open requests, versioning, object stores, and transactions.
 */
function createMockIndexedDB() {
  const stores = new Map<string, Map<string, unknown>>();

  const mockDb = {
    objectStoreNames: {
      contains: (name: string) => stores.has(name),
    },
    createObjectStore: (name: string) => {
      if (!stores.has(name)) {
        stores.set(name, new Map());
      }
      return {};
    },
    transaction: (storeNames: string[]) => {
      const storeMap = stores.get(storeNames[0]) ?? new Map();

      const tx = {
        objectStore: () => ({
          getAll: () => {
            const req = {
              result: Array.from(storeMap.values()),
              onsuccess: null as (() => void) | null,
              onerror: null as (() => void) | null,
              error: null,
            };
            queueMicrotask(() => {
              if (req.onsuccess) {
                req.onsuccess();
              }
            });
            return req;
          },
          put: (item: { id: string }) => {
            storeMap.set(item.id, JSON.parse(JSON.stringify(item)));
            const req = {
              result: item.id,
              onsuccess: null as (() => void) | null,
              onerror: null as (() => void) | null,
              error: null,
            };
            queueMicrotask(() => {
              if (req.onsuccess) {
                req.onsuccess();
              }
            });
            return req;
          },
          delete: (id: string) => {
            storeMap.delete(id);
            const req = {
              result: undefined,
              onsuccess: null as (() => void) | null,
              onerror: null as (() => void) | null,
              error: null,
            };
            queueMicrotask(() => {
              if (req.onsuccess) {
                req.onsuccess();
              }
            });
            return req;
          },
          clear: () => {
            storeMap.clear();
            const req = {
              result: undefined,
              onsuccess: null as (() => void) | null,
              onerror: null as (() => void) | null,
              error: null,
            };
            queueMicrotask(() => {
              if (req.onsuccess) {
                req.onsuccess();
              }
            });
            return req;
          },
        }),
        oncomplete: null as (() => void) | null,
        onerror: null as (() => void) | null,
        error: null,
      };

      queueMicrotask(() => {
        if (tx.oncomplete) {
          tx.oncomplete();
        }
      });

      return tx;
    },
  };

  const idb = {
    open: () => {
      const req = {
        result: mockDb,
        onupgradeneeded: null as (() => void) | null,
        onsuccess: null as (() => void) | null,
        onerror: null as (() => void) | null,
        error: null,
      };
      // Simulate upgrade and open across microtask cycles
      queueMicrotask(() => {
        if (!stores.has(STORE_NAME)) {
          if (req.onupgradeneeded) {
            req.onupgradeneeded();
          }
        }
        queueMicrotask(() => {
          if (req.onsuccess) {
            req.onsuccess();
          }
        });
      });
      return req;
    },
    _stores: stores,
  };

  return idb;
}

describe('Custom Decks Storage Manager', () => {
  let mockIdb: ReturnType<typeof createMockIndexedDB>;

  beforeEach(() => {
    resetDeckStorageForTesting();
    localStorage.clear();
    mockIdb = createMockIndexedDB();
    vi.stubGlobal('indexedDB', mockIdb);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetDeckStorageForTesting();
    localStorage.clear();
  });

  it('loads empty array when no custom decks are stored', async () => {
    const decks = await loadCustomDecks();
    expect(decks).toEqual([]);
    expect(getLoadedCustomDecks()).toEqual([]);
  });

  it('saves, loads, updates, and deletes custom decks in IndexedDB', async () => {
    const deck1: CustomDeck = {
      id: 'deck_1',
      title: 'Vocabulary 1',
      filename: 'vocab1.tsv',
      itemCount: 1,
      importedAt: Date.now(),
      items: [{ id: '1', moduleId: 'deck_1', target: '사과', translation: 'apple' }],
    };

    await saveCustomDeck(deck1);
    const loadedAfterFirst = await loadCustomDecks();
    expect(loadedAfterFirst).toHaveLength(1);
    expect(loadedAfterFirst[0].title).toBe('Vocabulary 1');
    expect(getLoadedCustomDecks()).toHaveLength(1);

    const deck2: CustomDeck = {
      id: 'deck_2',
      title: 'Vocabulary 2',
      filename: 'vocab2.tsv',
      itemCount: 1,
      importedAt: Date.now(),
      items: [{ id: '2', moduleId: 'deck_2', target: '학교', translation: 'school' }],
    };

    await saveCustomDeck(deck2);
    const loadedAfterSecond = await loadCustomDecks();
    expect(loadedAfterSecond).toHaveLength(2);

    // Delete deck1
    const remaining = await deleteCustomDeck('deck_1');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('deck_2');
    expect(await loadCustomDecks()).toHaveLength(1);

    // Clear all
    await clearAllCustomDecks();
    expect(await loadCustomDecks()).toHaveLength(0);
  });

  it('automatically migrates legacy localStorage decks into IndexedDB and purges localStorage key', async () => {
    const legacyRaw = JSON.stringify([
      {
        id: 'legacy_deck',
        title: 'Legacy Anki Deck',
        filename: 'legacy.apkg',
        itemCount: 4,
        importedAt: 1600000000000,
        items: [
          {
            id: 'item_1',
            moduleId: 'legacy_deck',
            target: '실수 (失手)',
            translation: 'mistake',
            pronunciation: 'silsu (失手)',
          },
          {
            id: 'item_2',
            moduleId: 'legacy_deck',
            target: '약속（約束）',
            translation: 'promise',
          },
          {
            id: 'item_3',
            moduleId: 'legacy_deck',
            target: '失手', // Untypeable bare Hanja
            translation: 'mistake',
          },
          {
            id: 'item_4',
            moduleId: 'legacy_deck',
            target: '사과',
            translation: 'apple',
            pronunciation: 'sagwa',
          },
        ],
      },
    ]);

    localStorage.setItem(LEGACY_STORAGE_KEY, legacyRaw);

    const loaded = await loadCustomDecks();
    expect(loaded).toHaveLength(1);
    const deck = loaded[0];

    // Untypeable bare Hanja item should be pruned, leaving 3 items
    expect(deck.itemCount).toBe(3);
    expect(deck.items).toHaveLength(3);

    // 실수 (失手) should be cleaned to 실수 and romanization regenerated
    expect(deck.items[0].target).toBe('실수');
    expect(deck.items[0].pronunciation).toBe('silsu');

    // 약속（約束） should be cleaned to 약속
    expect(deck.items[1].target).toBe('약속');
    expect(deck.items[1].pronunciation).toBe('yaksok');

    // Clean item should remain unchanged
    expect(deck.items[2].target).toBe('사과');

    // Legacy localStorage key MUST be purged to reclaim 5 MB quota
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();

    // Reset module cache and verify data persists in IndexedDB without localStorage
    resetDeckStorageForTesting();
    const persistedInIdb = await loadCustomDecks();
    expect(persistedInIdb).toHaveLength(1);
    expect(persistedInIdb[0].id).toBe('legacy_deck');
  });

  it('handles corrupted legacy localStorage JSON gracefully during migration', async () => {
    localStorage.setItem(LEGACY_STORAGE_KEY, 'invalid-json{{');
    const loaded = await loadCustomDecks();
    expect(loaded).toEqual([]);
    expect(localStorage.getItem(LEGACY_STORAGE_KEY)).toBeNull();
  });

  describe('Lifecycle Interleaving & Out-of-Order Concurrency', () => {
    it('synchronizes concurrent save operations while database initialization is in flight', async () => {
      // Trigger multiple saves simultaneously before awaiting any initialization
      const deckA: CustomDeck = {
        id: 'deck_a',
        title: 'Deck A',
        filename: 'a.tsv',
        itemCount: 1,
        importedAt: Date.now(),
        items: [{ id: 'a1', moduleId: 'deck_a', target: '바다', translation: 'sea' }],
      };

      const deckB: CustomDeck = {
        id: 'deck_b',
        title: 'Deck B',
        filename: 'b.tsv',
        itemCount: 1,
        importedAt: Date.now(),
        items: [{ id: 'b1', moduleId: 'deck_b', target: '하늘', translation: 'sky' }],
      };

      // Both operations dispatched concurrently without prior initialization
      const [resA, resB] = await Promise.all([saveCustomDeck(deckA), saveCustomDeck(deckB)]);

      expect(resA.length).toBeGreaterThanOrEqual(1);
      expect(resB.length).toBe(2);

      const finalDecks = await loadCustomDecks();
      expect(finalDecks).toHaveLength(2);
      expect(finalDecks.map((d) => d.id).sort()).toEqual(['deck_a', 'deck_b']);
    });

    it('processes delete while initialization is in flight without race condition', async () => {
      const deck: CustomDeck = {
        id: 'deck_temp',
        title: 'Temp Deck',
        filename: 'temp.tsv',
        itemCount: 1,
        importedAt: Date.now(),
        items: [{ id: 't1', moduleId: 'deck_temp', target: '달', translation: 'moon' }],
      };

      await saveCustomDeck(deck);

      // Reset in-memory cache to force a fresh async DB open
      resetDeckStorageForTesting();

      // Trigger delete immediately while DB open is in flight
      const remaining = await deleteCustomDeck('deck_temp');
      expect(remaining).toHaveLength(0);

      const loaded = await loadCustomDecks();
      expect(loaded).toHaveLength(0);
    });
  });

  describe('Fallback Mode (When IndexedDB is Unavailable)', () => {
    beforeEach(() => {
      vi.stubGlobal('indexedDB', undefined);
      resetDeckStorageForTesting();
      localStorage.clear();
    });

    it('seamlessly falls back to localStorage when indexedDB is undefined', async () => {
      const deck: CustomDeck = {
        id: 'fallback_deck',
        title: 'Fallback Deck',
        filename: 'fallback.tsv',
        itemCount: 1,
        importedAt: Date.now(),
        items: [{ id: 'f1', moduleId: 'fallback_deck', target: '별', translation: 'star' }],
      };

      await saveCustomDeck(deck);

      // Verify written to localStorage in fallback mode
      expect(localStorage.getItem(LEGACY_STORAGE_KEY)).not.toBeNull();

      resetDeckStorageForTesting();
      const loaded = await loadCustomDecks();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].title).toBe('Fallback Deck');

      // Delete in fallback mode
      await deleteCustomDeck('fallback_deck');
      resetDeckStorageForTesting();
      expect(await loadCustomDecks()).toHaveLength(0);
    });
  });
});
