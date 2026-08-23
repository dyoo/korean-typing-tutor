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
});
