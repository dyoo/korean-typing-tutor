import type { CustomDeck } from '../types/customDecks';
import type { LessonItem } from '../types/korean';
import { cleanKoreanTarget, isTypeableKoreanTarget } from './cleanKoreanTarget';
import { romanize } from './romanizer';

const CUSTOM_DECKS_STORAGE_KEY = 'korean_tutor_custom_decks';

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
 * Loads all user-imported custom decks from LocalStorage.
 * Defensively cleans legacy items, strips untypeable Hanja glosses, regenerates Romanizations,
 * and purges invalid cards, persisting any modifications back to LocalStorage.
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

    let hasModifications = false;
    const sanitizedDecks: CustomDeck[] = [];

    for (const rawDeck of parsed) {
      if (
        typeof rawDeck !== 'object' ||
        rawDeck === null ||
        typeof rawDeck.id !== 'string' ||
        typeof rawDeck.title !== 'string' ||
        !Array.isArray(rawDeck.items)
      ) {
        hasModifications = true;
        continue;
      }

      const sanitizedItems: LessonItem[] = [];
      for (const item of rawDeck.items) {
        if (!item || typeof item.target !== 'string') {
          hasModifications = true;
          continue;
        }

        const cleanedTarget = cleanKoreanTarget(item.target);
        if (!isTypeableKoreanTarget(cleanedTarget)) {
          // Untypeable item (e.g. bare Hanja, English quiz question) - discard it
          hasModifications = true;
          continue;
        }

        if (cleanedTarget !== item.target) {
          // Target had Hanja or metadata cleaned (e.g. "실수 (失手)" -> "실수")
          hasModifications = true;
          sanitizedItems.push({
            ...item,
            target: cleanedTarget,
            pronunciation: romanize(cleanedTarget),
          });
        } else {
          sanitizedItems.push(item);
        }
      }

      if (sanitizedItems.length > 0) {
        if (sanitizedItems.length !== rawDeck.items.length) {
          hasModifications = true;
        }
        sanitizedDecks.push({
          ...rawDeck,
          itemCount: sanitizedItems.length,
          items: sanitizedItems,
        });
      } else {
        // All items in this deck were invalid or empty
        hasModifications = true;
      }
    }

    // Persist healed decks back to LocalStorage if any sanitization or pruning occurred
    if (hasModifications) {
      saveCustomDecks(sanitizedDecks);
    }

    return sanitizedDecks;
  } catch {
    return [];
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
