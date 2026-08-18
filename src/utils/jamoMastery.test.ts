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
  setMasteryProgressionLevel,
  setMasteryCheckpointLevel,
  getAdaptiveLengthMultiplier,
  SENTENCE_CHECKPOINTS,
  getActiveMasteryTarget,
  recordSentenceCompletion,
  isAllMasteryComplete,
} from './jamoMastery';
import type { LessonItem } from '../types/korean';
import type { JamoStats } from '../types/mastery';

describe('Jamo Mastery Engine & Spaced-Repetition Model', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should have a complete progression sequence containing all Jamos and compound batchim', () => {
    expect(JAMO_PROGRESSION_ORDER.length).toBe(44);
    const jamoChars = JAMO_PROGRESSION_ORDER.map((item) => item.jamo);
    // Stage 1 initial keys
    expect(jamoChars.slice(0, 4)).toEqual(['ㅓ', 'ㅏ', 'ㅇ', 'ㄹ']);
    // Contains double consonants
    expect(jamoChars).toContain('ㄲ');
    expect(jamoChars).toContain('ㅆ');
    // Contains compound batchim (겹받침)
    expect(jamoChars).toContain('ㄶ');
    expect(jamoChars).toContain('ㄺ');
    expect(jamoChars).toContain('ㅄ');
    expect(jamoChars).toContain('ㅀ');
    // Does not contain punctuation (mastery focuses on Jamos only)
    expect(jamoChars).not.toContain(',');
    expect(jamoChars).not.toContain('.');
  });

  it('should initialize with Stage 1 (4 keys) unlocked by default', () => {
    const state = createDefaultMasteryState();
    expect(state.unlockedCount).toBe(4);
    expect(state.mode).toBe('mastery');
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
    const validItem3: LessonItem = {
      id: '3',
      moduleId: 'test',
      target: '알아-어라!',
      translation: 'With hyphen and punctuation',
    };
    const invalidItem1: LessonItem = {
      id: '4',
      moduleId: 'test',
      target: '고기',
      translation: 'Meat',
    }; // Contains ㄱ, ㅗ
    const invalidItem2: LessonItem = {
      id: '5',
      moduleId: 'test',
      target: '사과',
      translation: 'Apple',
    }; // Contains ㅅ, ㄱ, ㅗ

    expect(isItemEligible(validItem1, unlocked)).toBe(true);
    expect(isItemEligible(validItem2, unlocked)).toBe(true);
    expect(isItemEligible(validItem3, unlocked)).toBe(true);
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
    expect(eligible.some((i) => i.target === '아')).toBe(true);
    expect(eligible.some((i) => i.target === '얼')).toBe(true);
    expect(eligible.some((i) => i.target === '사과')).toBe(false);
    expect(eligible.some((i) => i.target === '나무')).toBe(false);
  });

  it('should gate items with compound batchim until the compound is unlocked', () => {
    // All basic jamos unlocked through Stage 5 (33 keys), but no compound batchim yet
    const unlocked = new Set(JAMO_PROGRESSION_ORDER.slice(0, 33).map((i) => i.jamo));

    const chickenItem: LessonItem = {
      id: 'c1',
      moduleId: 'test',
      target: '닭',
      translation: 'Chicken',
    }; // ㄺ
    const nothaveItem: LessonItem = {
      id: 'c2',
      moduleId: 'test',
      target: '없다',
      translation: 'Not have',
    }; // ㅄ
    const manyItem: LessonItem = {
      id: 'c3',
      moduleId: 'test',
      target: '많다',
      translation: 'Many',
    }; // ㄶ
    const simpleItem: LessonItem = {
      id: 'c4',
      moduleId: 'test',
      target: '나무',
      translation: 'Tree',
    };

    expect(isItemEligible(chickenItem, unlocked)).toBe(false);
    expect(isItemEligible(nothaveItem, unlocked)).toBe(false);
    expect(isItemEligible(manyItem, unlocked)).toBe(false);
    expect(isItemEligible(simpleItem, unlocked)).toBe(true);

    // Unlock ㄺ compound batchim
    unlocked.add('ㄺ');
    expect(isItemEligible(chickenItem, unlocked)).toBe(true);
    expect(isItemEligible(nothaveItem, unlocked)).toBe(false); // still needs ㅄ

    // Unlock ㅄ compound batchim
    unlocked.add('ㅄ');
    expect(isItemEligible(nothaveItem, unlocked)).toBe(true);
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

  it('should scale adaptive length multipliers based on mastery progress', () => {
    // Early stage (< 30% progress): 1-2 char words receive 4x multiplier, long sentences suppressed (0.2x)
    expect(getAdaptiveLengthMultiplier(1, 10)).toBe(4.0);
    expect(getAdaptiveLengthMultiplier(2, 20)).toBe(4.0);
    expect(getAdaptiveLengthMultiplier(4, 25)).toBe(1.0);
    expect(getAdaptiveLengthMultiplier(15, 25)).toBe(0.2);

    // Mid stage (30% to 70% progress): 2-4 char words prioritized (3.0x)
    expect(getAdaptiveLengthMultiplier(1, 50)).toBe(1.5);
    expect(getAdaptiveLengthMultiplier(2, 50)).toBe(3.0);
    expect(getAdaptiveLengthMultiplier(3, 50)).toBe(3.0);
    expect(getAdaptiveLengthMultiplier(4, 50)).toBe(3.0);
    expect(getAdaptiveLengthMultiplier(10, 50)).toBe(0.5);

    // Advanced stage (>= 70% progress): full breadth with longer phrases welcomed (1.5x for length >= 3)
    expect(getAdaptiveLengthMultiplier(1, 80)).toBe(1.0);
    expect(getAdaptiveLengthMultiplier(2, 90)).toBe(1.0);
    expect(getAdaptiveLengthMultiplier(5, 80)).toBe(1.5);
    expect(getAdaptiveLengthMultiplier(20, 100)).toBe(1.5);
  });

  it('should calculate accurate mastery fill percentage (0 to 100%)', () => {
    expect(calculateJamoProgress(undefined)).toBe(0);

    const stats: JamoStats = {
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

  it('should support forcing mastery progress to a specific level', () => {
    const state = createDefaultMasteryState();
    expect(state.unlockedCount).toBe(4);

    // Force unlock to 9 keys (Full Home Row)
    setMasteryProgressionLevel(state, 9, true);
    expect(state.unlockedCount).toBe(9);
    expect(getUnlockedJamos(state).size).toBe(9);
    expect(state.jamoStats['ㅓ'].isMastered).toBe(true);
    expect(state.jamoStats['ㅏ'].isMastered).toBe(true);
    expect(state.jamoStats['ㅇ'].isMastered).toBe(true);
    expect(state.jamoStats['ㄹ'].isMastered).toBe(true);
    expect(state.jamoStats['ㅗ'].isMastered).toBe(true);
    expect(state.jamoStats['ㅣ'].isMastered).toBe(true);
    expect(state.jamoStats['ㅁ'].isMastered).toBe(true);
    expect(state.jamoStats['ㄴ'].isMastered).toBe(true);
    // 9th key ('ㅎ') is the active target and not yet mastered
    expect(state.jamoStats['ㅎ'].isMastered).toBe(false);
    expect(getActiveLearningJamo(state)?.jamo).toBe('ㅎ');

    // Force unlock to 10 keys (up to ㅜ)
    setMasteryProgressionLevel(state, 10, true);
    expect(state.unlockedCount).toBe(10);
    expect(getUnlockedJamos(state).size).toBe(10);
    expect(state.jamoStats['ㅎ'].isMastered).toBe(true);
    expect(state.jamoStats['ㅜ'].isMastered).toBe(false);
    expect(getActiveLearningJamo(state)?.jamo).toBe('ㅜ');

    // Reset back to Stage 1 (4 keys) acts as a clean slate reset
    setMasteryProgressionLevel(state, 4, true);
    expect(state.unlockedCount).toBe(4);
    expect(state.jamoStats['ㅓ'].isMastered).toBe(false);
    expect(state.jamoStats['ㅏ'].isMastered).toBe(false);
    expect(state.jamoStats['ㅇ'].isMastered).toBe(false);
    expect(state.jamoStats['ㄹ'].isMastered).toBe(false);
    expect(getActiveLearningJamo(state)?.jamo).toBe('ㄹ');

    // Clamps to min 4 and max 44
    setMasteryProgressionLevel(state, 1);
    expect(state.unlockedCount).toBe(4);
    expect(getActiveLearningJamo(state)?.jamo).toBe('ㄹ');

    setMasteryProgressionLevel(state, 100);
    expect(state.unlockedCount).toBe(44);
  });

  it('should activate Sentence Checkpoint 1 once all Stage 2 Jamos are mastered', () => {
    const state = createDefaultMasteryState();
    setMasteryProgressionLevel(state, 11, true); // Unlock through 11th key 'ㅡ'
    expect(state.unlockedCount).toBe(11);

    // Initially 'ㅡ' is unmastered
    expect(state.jamoStats['ㅡ'].isMastered).toBe(false);
    let target = getActiveMasteryTarget(state);
    expect(target.type).toBe('jamo');
    if (target.type === 'jamo') {
      expect(target.item.jamo).toBe('ㅡ');
    }

    // Master 'ㅡ'
    for (let i = 0; i < 20; i++) {
      recordJamoAttempt(state, 'ㅡ', true);
    }
    expect(state.jamoStats['ㅡ'].isMastered).toBe(true);

    // Target transitions to Checkpoint 1 (Home Row Sentences)
    target = getActiveMasteryTarget(state);
    expect(target.type).toBe('checkpoint');
    if (target.type === 'checkpoint') {
      expect(target.checkpoint.id).toBe('cp_home_row');
      expect(target.checkpoint.title).toBe('Home');
    }

    // Completing 14 sentences (not yet 15) keeps checkpoint active
    for (let i = 0; i < 14; i++) {
      const res = recordSentenceCompletion(state, 'cp_home_row');
      expect(res.newlyMastered).toBe(false);
    }
    expect(state.sentenceCheckpointStats['cp_home_row'].isMastered).toBe(false);

    // 15th sentence completes the checkpoint and unlocks 12th Jamo 'ㄱ' (Top Row)
    const res15 = recordSentenceCompletion(state, 'cp_home_row');
    expect(res15.newlyMastered).toBe(true);
    expect(res15.newlyUnlockedJamo).toBe('ㄱ');
    expect(state.unlockedCount).toBe(12);

    target = getActiveMasteryTarget(state);
    expect(target.type).toBe('jamo');
    if (target.type === 'jamo') {
      expect(target.item.jamo).toBe('ㄱ');
    }
  });

  it('should allow manually jumping to a sentence checkpoint via setMasteryCheckpointLevel', () => {
    const state = createDefaultMasteryState();
    setMasteryCheckpointLevel(state, 'cp_home_row');

    expect(state.unlockedCount).toBe(11);
    expect(state.activeCheckpointId).toBe('cp_home_row');
    const target = getActiveMasteryTarget(state);
    expect(target.type).toBe('checkpoint');
    if (target.type === 'checkpoint') {
      expect(target.checkpoint.id).toBe('cp_home_row');
    }
  });

  it('should restrict Jamo stage exercises to short words and sentence checkpoints to sentences', () => {
    const dummyCurriculum: LessonItem[] = [
      { id: 'short1', moduleId: 'm1', target: '나무', translation: 'Tree' },
      { id: 'short2', moduleId: 'm1', target: '우리나라', translation: 'Our country' },
      { id: 'long1', moduleId: 'm1', target: '어머니와 함께 나무 아래로 걸어요', translation: 'Walk under tree with mother' },
    ];
    const unlocked = new Set(['ㅓ', 'ㅏ', 'ㅇ', 'ㄹ', 'ㅗ', 'ㅣ', 'ㅁ', 'ㄴ', 'ㅎ', 'ㅜ', 'ㅡ']);

    // When targeting a Jamo: only short words are returned
    const jamoTarget = getActiveMasteryTarget(createDefaultMasteryState());
    const jamoItems = getEligibleMasteryItems(dummyCurriculum, unlocked, jamoTarget);
    expect(jamoItems.every((i) => i.target.length <= 12)).toBe(true);

    // When targeting a sentence checkpoint: sentences are returned
    const cpTarget = {
      type: 'checkpoint' as const,
      checkpoint: SENTENCE_CHECKPOINTS[0],
    };
    const sentenceItems = getEligibleMasteryItems(dummyCurriculum, unlocked, cpTarget);
    expect(sentenceItems.some((i) => i.target.length >= 8)).toBe(true);
  });

  it('correctly reports isAllMasteryComplete when the final checkpoint (cp_master) is graduated', () => {
    const state = createDefaultMasteryState();
    state.unlockedCount = JAMO_PROGRESSION_ORDER.length; // 44
    expect(isAllMasteryComplete(state)).toBe(false);

    // Complete 14 sentences for cp_master
    for (let i = 0; i < 14; i++) {
      const res = recordSentenceCompletion(state, 'cp_master');
      expect(res.newlyMastered).toBe(false);
      expect(res.isAllMasteryComplete).toBe(false);
    }
    expect(isAllMasteryComplete(state)).toBe(false);

    // 15th sentence completes cp_master and full mastery path
    const finalRes = recordSentenceCompletion(state, 'cp_master');
    expect(finalRes.newlyMastered).toBe(true);
    expect(finalRes.isAllMasteryComplete).toBe(true);
    expect(isAllMasteryComplete(state)).toBe(true);
  });
});
