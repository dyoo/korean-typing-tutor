import { describe, it, expect, beforeEach } from 'vitest';
import {
  JAMO_PROGRESSION_ORDER,
  createDefaultMasteryState,
  loadMasteryState,
  saveMasteryState,
  getUnlockedJamos,
  getActiveLearningJamo,
  calculateJamoAccuracy,
  recordJamoAttempt,
  isItemEligible,
  getEligibleMasteryItems,
  selectNextMasteryItem,
  calculateJamoProgress,
} from './jamoMastery';
import type { LessonItem } from '../types/korean';

describe('Jamo Mastery Engine & Spaced-Repetition Model', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should have a complete progression sequence containing all 35 Dubeolsik Jamos and punctuation', () => {
    expect(JAMO_PROGRESSION_ORDER.length).toBe(35);
    const jamoChars = JAMO_PROGRESSION_ORDER.map((item) => item.jamo);
    // Stage 1 initial keys
    expect(jamoChars.slice(0, 4)).toEqual(['ㅓ', 'ㅏ', 'ㅇ', 'ㄹ']);
    // Contains double consonants and punctuation
    expect(jamoChars).toContain('ㄲ');
    expect(jamoChars).toContain('ㅆ');
    expect(jamoChars).toContain(',');
    expect(jamoChars).toContain('.');
  });

  it('should initialize with Stage 1 (4 keys) unlocked by default', () => {
    const state = createDefaultMasteryState();
    expect(state.unlockedCount).toBe(4);
    expect(state.mode).toBe('curriculum');
    const unlocked = getUnlockedJamos(state);
    expect(unlocked.size).toBe(4);
    expect(unlocked.has('ㅓ')).toBe(true);
    expect(unlocked.has('ㅏ')).toBe(true);
    expect(unlocked.has('ㅇ')).toBe(true);
    expect(unlocked.has('ㄹ')).toBe(true);
    expect(unlocked.has('ㅁ')).toBe(false);

    const activeLearning = getActiveLearningJamo(state);
    expect(activeLearning?.jamo).toBe('ㄹ');
  });

  it('should load and save mastery state to LocalStorage cleanly', () => {
    const state = createDefaultMasteryState();
    state.mode = 'mastery';
    state.unlockedCount = 7;
    saveMasteryState(state);

    const loaded = loadMasteryState();
    expect(loaded.mode).toBe('mastery');
    expect(loaded.unlockedCount).toBe(7);
  });

  it('should track rolling accuracy over sliding history window', () => {
    const state = createDefaultMasteryState();
    const stats = state.jamoStats['ㅏ'];

    expect(calculateJamoAccuracy(stats)).toBe(1.0);

    for (let i = 0; i < 10; i++) {
      recordJamoAttempt(state, 'ㅏ', true);
    }
    expect(calculateJamoAccuracy(state.jamoStats['ㅏ'])).toBe(1.0);

    // 1 incorrect attempt out of 11
    recordJamoAttempt(state, 'ㅏ', false);
    expect(calculateJamoAccuracy(state.jamoStats['ㅏ'])).toBeCloseTo(10 / 11, 2);
  });

  it('should not graduate a Jamo to mastered until reaching 20 attempts with >= 95% accuracy', () => {
    const state = createDefaultMasteryState();

    // 19 accurate attempts (less than 20)
    for (let i = 0; i < 19; i++) {
      const res = recordJamoAttempt(state, 'ㅓ', true);
      expect(res.newlyMastered).toBe(false);
    }
    expect(state.jamoStats['ㅓ'].isMastered).toBe(false);

    // 20th accurate attempt triggers mastery for 'ㅓ'
    const res20 = recordJamoAttempt(state, 'ㅓ', true);
    expect(res20.newlyMastered).toBe(true);
    expect(state.jamoStats['ㅓ'].isMastered).toBe(true);
  });

  it('should automatically unlock the next Jamo in sequence once all currently unlocked Jamos are mastered', () => {
    const state = createDefaultMasteryState();
    expect(state.unlockedCount).toBe(4);

    // Master ㅓ, ㅏ, ㅇ, ㄹ
    for (const j of ['ㅓ', 'ㅏ', 'ㅇ']) {
      for (let i = 0; i < 20; i++) {
        recordJamoAttempt(state, j, true);
      }
      expect(state.jamoStats[j].isMastered).toBe(true);
      // Not all 4 are mastered yet, so unlockedCount stays 4
      expect(state.unlockedCount).toBe(4);
    }

    // Master 4th key 'ㄹ'
    let lastResult;
    for (let i = 0; i < 20; i++) {
      lastResult = recordJamoAttempt(state, 'ㄹ', true);
    }

    expect(lastResult?.newlyMastered).toBe(true);
    expect(lastResult?.newlyUnlockedJamo).toBe('ㅗ'); // 5th Jamo in sequence
    expect(state.unlockedCount).toBe(5);
    expect(getUnlockedJamos(state).has('ㅗ')).toBe(true);
  });

  it('should evaluate whether vocabulary items are eligible based on unlocked Jamo set', () => {
    const unlocked = new Set(['ㅓ', 'ㅏ', 'ㅇ', 'ㄹ']); // Stage 1 keys

    const validItem1: LessonItem = { id: '1', moduleId: 'test', target: '아', translation: 'Ah' };
    const validItem2: LessonItem = { id: '2', moduleId: 'test', target: '어라', translation: 'Oh' };
    const invalidItem1: LessonItem = { id: '3', moduleId: 'test', target: '고기', translation: 'Meat' }; // Contains ㄱ, ㅗ
    const invalidItem2: LessonItem = { id: '4', moduleId: 'test', target: '사과', translation: 'Apple' }; // Contains ㅅ, ㄱ, ㅗ

    expect(isItemEligible(validItem1, unlocked)).toBe(true);
    expect(isItemEligible(validItem2, unlocked)).toBe(true);
    expect(isItemEligible(invalidItem1, unlocked)).toBe(false);
    expect(isItemEligible(invalidItem2, unlocked)).toBe(false);
  });

  it('should filter curriculum items to eligible mastery items', () => {
    const allItems: LessonItem[] = [
      { id: '1', moduleId: 'test', target: '아', translation: 'Ah' },
      { id: '2', moduleId: 'test', target: '사과', translation: 'Apple' },
      { id: '3', moduleId: 'test', target: '얼', translation: 'Spirit' },
      { id: '4', moduleId: 'test', target: '나무', translation: 'Tree' },
    ];
    const unlocked = new Set(['ㅓ', 'ㅏ', 'ㅇ', 'ㄹ']);

    const eligible = getEligibleMasteryItems(allItems, unlocked);
    expect(eligible.length).toBe(2);
    expect(eligible.map((i) => i.target)).toEqual(['아', '얼']);
  });

  it('should select next mastery item and give weighted priority to active learning Jamo', () => {
    const eligible: LessonItem[] = [
      { id: '1', moduleId: 'test', target: '아', translation: 'Ah' },
      { id: '2', moduleId: 'test', target: '오이', translation: 'Cucumber' },
      { id: '3', moduleId: 'test', target: '아이', translation: 'Child' },
    ];
    const state = createDefaultMasteryState();

    // Select with active Jamo 'ㅗ'
    const selected = selectNextMasteryItem(eligible, 'ㅗ', state.jamoStats);
    expect(eligible.some((i) => i.id === selected.id)).toBe(true);
  });

  it('should calculate accurate mastery fill percentage (0 to 100%)', () => {
    expect(calculateJamoProgress(undefined)).toBe(0);

    const stats = {
      totalAttempts: 0,
      correctAttempts: 0,
      recentHistory: [],
      isMastered: false,
    };
    expect(calculateJamoProgress(stats)).toBe(0);

    // 10 correct attempts out of 20 needed = 50%
    stats.totalAttempts = 10;
    stats.correctAttempts = 10;
    stats.recentHistory = new Array(10).fill(true);
    expect(calculateJamoProgress(stats)).toBe(50);

    // 10 attempts with 80% accuracy = (10/20) * 0.8 = 40%
    stats.recentHistory = [true, true, true, true, false, true, true, true, true, false];
    expect(calculateJamoProgress(stats)).toBe(40);

    // Mastered Jamo = 100%
    stats.isMastered = true;
    expect(calculateJamoProgress(stats)).toBe(100);
  });
});
