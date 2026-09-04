import { describe, it, expect, beforeEach } from 'vitest';
import { loadCustomDecks, saveCustomDeck, deleteCustomDeck } from './customDecks';
import type { CustomDeck } from '../types/customDecks';

describe('Custom Decks LocalStorage Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads empty array when no custom decks are stored', () => {
    expect(loadCustomDecks()).toEqual([]);
  });

  it('saves, loads, updates, and deletes custom decks in localStorage', () => {
    const deck1: CustomDeck = {
      id: 'deck_1',
      title: 'Vocabulary 1',
      filename: 'vocab1.tsv',
      itemCount: 1,
      importedAt: Date.now(),
      items: [{ id: '1', moduleId: 'deck_1', target: '사과', translation: 'apple' }],
    };

    saveCustomDeck(deck1);
    expect(loadCustomDecks()).toHaveLength(1);
    expect(loadCustomDecks()[0].title).toBe('Vocabulary 1');

    const deck2: CustomDeck = {
      id: 'deck_2',
      title: 'Vocabulary 2',
      filename: 'vocab2.tsv',
      itemCount: 1,
      importedAt: Date.now(),
      items: [{ id: '2', moduleId: 'deck_2', target: '학교', translation: 'school' }],
    };

    saveCustomDeck(deck2);
    expect(loadCustomDecks()).toHaveLength(2);

    // Delete deck1
    const remaining = deleteCustomDeck('deck_1');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('deck_2');
    expect(loadCustomDecks()).toHaveLength(1);
  });

  it('handles corrupted localStorage JSON gracefully', () => {
    localStorage.setItem('korean_tutor_custom_decks', 'invalid-json{{');
    expect(loadCustomDecks()).toEqual([]);
  });

  it('defensively sanitizes legacy decks containing parenthesized Hanja and persists healed data', () => {
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
            target: '失手', // Completely untypeable bare Hanja
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

    localStorage.setItem('korean_tutor_custom_decks', legacyRaw);

    const loaded = loadCustomDecks();
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

    // Verify localStorage was updated with the healed data
    const storedAfter = JSON.parse(localStorage.getItem('korean_tutor_custom_decks')!);
    expect(storedAfter[0].items).toHaveLength(3);
    expect(storedAfter[0].items[0].target).toBe('실수');
    expect(storedAfter[0].items[1].target).toBe('약속');
  });
});
