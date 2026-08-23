import type { CustomDeck } from '../types/customDecks';

const CUSTOM_DECKS_STORAGE_KEY = 'korean_tutor_custom_decks';

/**
 * Loads all user-imported custom decks from LocalStorage.
 * Returns an empty array if none exist or on parse error.
 */
export function loadCustomDecks(): CustomDeck[] {
  try {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    const raw = localStorage.getItem(CUSTOM_DECKS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (deck): deck is CustomDeck =>
        typeof deck === 'object' &&
        deck !== null &&
        typeof deck.id === 'string' &&
        typeof deck.title === 'string' &&
        Array.isArray(deck.items) &&
        deck.items.length > 0,
    );
  } catch {
    return [];
  }
}

/**
 * Persists all custom decks into LocalStorage.
 */
function saveCustomDecks(decks: CustomDeck[]): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CUSTOM_DECKS_STORAGE_KEY, JSON.stringify(decks));
    }
  } catch (error) {
    console.warn('[CustomDecks] Failed to save custom decks to localStorage:', error);
  }
}

/**
 * Adds or updates a single custom deck in storage.
 */
export function saveCustomDeck(deck: CustomDeck): CustomDeck[] {
  const existing = loadCustomDecks();
  const index = existing.findIndex((d) => d.id === deck.id);
  if (index >= 0) {
    existing[index] = deck;
  } else {
    existing.push(deck);
  }
  saveCustomDecks(existing);
  return existing;
}

/**
 * Deletes a custom deck by ID from storage.
 */
export function deleteCustomDeck(deckId: string): CustomDeck[] {
  const existing = loadCustomDecks();
  const filtered = existing.filter((d) => d.id !== deckId);
  saveCustomDecks(filtered);
  return filtered;
}
