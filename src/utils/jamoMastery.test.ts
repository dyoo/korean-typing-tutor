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
  getJamoCorrectAttempts,
  setMasteryProgressionLevel,
  setMasteryCheckpointLevel,
  getAdaptiveLengthMultiplier,
  SENTENCE_CHECKPOINTS,
  getActiveMasteryTarget,
  recordSentenceCompletion,
  isAllMasteryComplete,
  getSectionJamosForCheckpoint,
  itemUsesAnyJamo,
  getItemJamoMetadata,
} from './jamoMastery';
import type { LessonItem } from '../types/korean';
import type { JamoStats, MasteryTarget } from '../types/mastery';

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

    // Verify key attributes correctly derived
    expect(JAMO_PROGRESSION_ORDER.find((i) => i.jamo === 'ㅓ')).toMatchObject({
      key: 'j',
      hand: 'right',
      stage: 1,
    });
    expect(JAMO_PROGRESSION_ORDER.find((i) => i.jamo === 'ㄲ')).toMatchObject({
      key: 'r',
      shift: true,
      hand: 'left',
      stage: 5,
    });
    expect(JAMO_PROGRESSION_ORDER.find((i) => i.jamo === 'ㄶ')).toMatchObject({
      key: 'sg',
      combination: ['ㄴ', 'ㅎ'],
      hand: 'left',
      stage: 6,
    });
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

  it('should accurately report getJamoCorrectAttempts within rolling window during error recovery', () => {
    const state = createDefaultMasteryState();
    expect(getJamoCorrectAttempts(state.jamoStats['ㅔ'])).toBe(0);

    // Record 18 correct and 2 incorrect attempts (total 20 attempts, 90% accuracy)
    for (let i = 0; i < 18; i++) {
      recordJamoAttempt(state, 'ㅔ', true);
    }
    recordJamoAttempt(state, 'ㅔ', false);
    recordJamoAttempt(state, 'ㅔ', false);

    expect(state.jamoStats['ㅔ'].totalAttempts).toBe(20);
    expect(getJamoCorrectAttempts(state.jamoStats['ㅔ'])).toBe(18);
    expect(calculateJamoAccuracy(state.jamoStats['ㅔ'])).toBe(0.9);
    expect(state.jamoStats['ㅔ'].isMastered).toBe(false);

    // 10 more attempts with 1 error (total 30 attempts, window has 17 correct and 3 errors)
    for (let i = 0; i < 9; i++) {
      recordJamoAttempt(state, 'ㅔ', true);
    }
    recordJamoAttempt(state, 'ㅔ', false);
    // After 8 more correct attempts (evicting the remaining 8 trues), attempts 39 and 40 evict the 2 falses
    for (let i = 0; i < 8; i++) {
      recordJamoAttempt(state, 'ㅔ', true);
    }
    // Now the window has 17 correct (attempts 31-38 evicted 8 trues)
    expect(getJamoCorrectAttempts(state.jamoStats['ㅔ'])).toBe(17);

    // Attempt 39 evicts the first false from attempt 19 -> 18 correct
    recordJamoAttempt(state, 'ㅔ', true);
    expect(getJamoCorrectAttempts(state.jamoStats['ㅔ'])).toBe(18);

    // Attempt 40 evicts the second false from attempt 20 -> 19 correct (95% accuracy on 20-item window)
    const res40 = recordJamoAttempt(state, 'ㅔ', true);
    expect(state.jamoStats['ㅔ'].totalAttempts).toBe(40);
    expect(getJamoCorrectAttempts(state.jamoStats['ㅔ'])).toBe(19);
    expect(res40.newlyMastered).toBe(true);
    expect(state.jamoStats['ㅔ'].isMastered).toBe(true);
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

    // Over multiple selections with large non-focus pool, focus Jamo should appear ~70%+ of the time
    const nonFocusItems: LessonItem[] = Array.from({ length: 20 }, (_, idx) => ({
      id: `non-${idx}`,
      moduleId: 'test',
      target: '아이', // contains only 'ㅇ', 'ㅏ', 'ㅣ'
      translation: 'Child',
    }));
    const focusItem: LessonItem = {
      id: 'focus-1',
      moduleId: 'test',
      target: '오이', // contains focus Jamo 'ㅗ'
      translation: 'Cucumber',
    };
    const testPool = [...nonFocusItems, focusItem];

    let focusCount = 0;
    const trials = 500;
    for (let i = 0; i < trials; i++) {
      const item = selectNextMasteryItem(testPool, 'ㅗ', state.jamoStats);
      if (item.id === 'focus-1') {
        focusCount++;
      }
    }
    const focusHitRate = focusCount / trials;
    // With 70% guaranteed focus pool filter, hit rate should be around 0.70 (well above 0.60)
    expect(focusHitRate).toBeGreaterThan(0.60);
    expect(focusHitRate).toBeLessThan(0.85);
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

    // Completing 9 sentences (not yet 10) keeps checkpoint active
    for (let i = 0; i < 9; i++) {
      const res = recordSentenceCompletion(state, 'cp_home_row');
      expect(res.newlyMastered).toBe(false);
    }
    expect(state.sentenceCheckpointStats['cp_home_row'].isMastered).toBe(false);

    // 10th sentence completes the checkpoint and unlocks 12th Jamo 'ㄱ' (Top Row)
    const res10 = recordSentenceCompletion(state, 'cp_home_row');
    expect(res10.newlyMastered).toBe(true);
    expect(res10.newlyUnlockedJamo).toBe('ㄱ');
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
      {
        id: 'long1',
        moduleId: 'm1',
        target: '어머니와 함께 나무 아래로 걸어요',
        translation: 'Walk under tree with mother',
      },
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

    // Complete 9 sentences for cp_master
    for (let i = 0; i < 9; i++) {
      const res = recordSentenceCompletion(state, 'cp_master');
      expect(res.newlyMastered).toBe(false);
      expect(res.isAllMasteryComplete).toBe(false);
    }
    expect(isAllMasteryComplete(state)).toBe(false);

    // 10th sentence completes cp_master and full mastery path
    const finalRes = recordSentenceCompletion(state, 'cp_master');
    expect(finalRes.newlyMastered).toBe(true);
    expect(finalRes.isAllMasteryComplete).toBe(true);
    expect(isAllMasteryComplete(state)).toBe(true);
  });

  describe('Milestone Challenge Section Jamo Requirements', () => {
    it('returns proper section Jamo sets for all checkpoints', () => {
      const homeSection = getSectionJamosForCheckpoint('cp_home_row');
      expect(homeSection).toBeDefined();
      // Home must handle both Home Row Index Keys (Stage 1) and Home Row & Basic Vowels (Stage 2)
      expect(homeSection?.has('ㅓ')).toBe(true);
      expect(homeSection?.has('ㅏ')).toBe(true);
      expect(homeSection?.has('ㅇ')).toBe(true);
      expect(homeSection?.has('ㄹ')).toBe(true);
      expect(homeSection?.has('ㅗ')).toBe(true);
      expect(homeSection?.has('ㅣ')).toBe(true);
      expect(homeSection?.has('ㅁ')).toBe(true);
      expect(homeSection?.has('ㄴ')).toBe(true);
      expect(homeSection?.has('ㅎ')).toBe(true);
      expect(homeSection?.has('ㅜ')).toBe(true);
      expect(homeSection?.has('ㅡ')).toBe(true);
      expect(homeSection?.size).toBe(11);

      // Top Row section (Stage 3)
      const topSection = getSectionJamosForCheckpoint('cp_top_row');
      expect(topSection).toBeDefined();
      expect(topSection?.has('ㄱ')).toBe(true);
      expect(topSection?.has('ㅅ')).toBe(true);
      expect(topSection?.has('ㅔ')).toBe(true);
      expect(topSection?.size).toBe(10);

      // Bottom Row section (Stage 4)
      const bottomSection = getSectionJamosForCheckpoint('cp_bottom_row');
      expect(bottomSection).toBeDefined();
      expect(bottomSection?.has('ㅋ')).toBe(true);
      expect(bottomSection?.has('ㅌ')).toBe(true);
      expect(bottomSection?.has('ㅊ')).toBe(true);
      expect(bottomSection?.has('ㅍ')).toBe(true);
      expect(bottomSection?.has('ㅠ')).toBe(true);
      expect(bottomSection?.size).toBe(5);

      // Shift Keys section (Stage 5)
      const shiftSection = getSectionJamosForCheckpoint('cp_shift_keys');
      expect(shiftSection).toBeDefined();
      expect(shiftSection?.has('ㄲ')).toBe(true);
      expect(shiftSection?.has('ㅆ')).toBe(true);
      expect(shiftSection?.has('ㅖ')).toBe(true);
      expect(shiftSection?.size).toBe(7);

      // Final checkpoint (cp_master) is exempt
      const masterSection = getSectionJamosForCheckpoint('cp_master');
      expect(masterSection).toBeNull();
    });

    it('correctly detects if a sentence contains any Jamo from a section', () => {
      const topJamos = new Set(['ㄱ', 'ㅅ', 'ㄷ', 'ㅈ', 'ㅂ', 'ㅛ', 'ㅕ', 'ㅑ', 'ㅐ', 'ㅔ']);
      expect(itemUsesAnyJamo('별을 노래하는 마음으로', topJamos)).toBe(true);
      expect(itemUsesAnyJamo('어머니와 아이', topJamos)).toBe(false);

      const shiftJamos = new Set(['ㄲ', 'ㅆ', 'ㄸ', 'ㅉ', 'ㅃ', 'ㅒ', 'ㅖ']);
      expect(itemUsesAnyJamo('꽃집에서 예쁜 꽃을 골라요', shiftJamos)).toBe(true);
      expect(itemUsesAnyJamo('별을 노래하는 마음으로', shiftJamos)).toBe(false);
    });

    it('filters out curriculum sentences that do not use the section Jamos for milestone challenges', () => {
      const dummyCurriculum: LessonItem[] = [
        {
          id: 'home_sent',
          moduleId: 'm1',
          target: '어머니와 함께 나무 아래로 걸어요',
          translation: 'Walk under tree with mother',
        },
        {
          id: 'top_sent',
          moduleId: 'm1',
          target: '가을 바람이 시원하게 불어요',
          translation: 'Autumn breeze blows refreshingly',
        },
      ];

      // Top Row checkpoint target: only sentences using Top Row Jamos should be matched
      const topCheckpointTarget: MasteryTarget = {
        type: 'checkpoint',
        checkpoint: SENTENCE_CHECKPOINTS[1], // cp_top_row
      };
      const topUnlocked = new Set(JAMO_PROGRESSION_ORDER.slice(0, 21).map((i) => i.jamo));

      const items = getEligibleMasteryItems(dummyCurriculum, topUnlocked, topCheckpointTarget);
      // 'top_sent' contains top row keys ('ㄱ', 'ㅂ', 'ㅅ', etc.)
      expect(items.some((i) => i.id === 'top_sent')).toBe(true);
      // 'home_sent' contains NO top row keys, so it must NOT be included from curriculum
      expect(items.some((i) => i.id === 'home_sent')).toBe(false);
    });
  });

  describe('Post-game Consolidation & Final Consonants Practice', () => {
    it('should define all 27 standard Korean batchim in BATCHIM_FOCUS_LIST', async () => {
      const { BATCHIM_FOCUS_LIST, BATCHIM_FOCUS_MAP } = await import('./jamoMastery');
      expect(BATCHIM_FOCUS_LIST.length).toBe(27);

      const expectedBatchim = [
        'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ',
        'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
      ];
      expect(BATCHIM_FOCUS_LIST.map((b) => b.batchim)).toEqual(expectedBatchim);

      for (const b of expectedBatchim) {
        expect(BATCHIM_FOCUS_MAP[b]).toBeDefined();
        expect(BATCHIM_FOCUS_MAP[b].batchim).toBe(b);
        expect(BATCHIM_FOCUS_MAP[b].hand).toBe('left');
        expect(BATCHIM_FOCUS_MAP[b].key.length).toBeGreaterThan(0);
      }
    });

    it('accurately identifies final consonants with hasBatchim', async () => {
      const { hasBatchim } = await import('./jamoMastery');

      // Single consonants
      expect(hasBatchim('책', 'ㄱ')).toBe(true);
      expect(hasBatchim('책', 'ㄴ')).toBe(false);
      expect(hasBatchim('가방', 'ㅇ')).toBe(true);
      expect(hasBatchim('가방', 'ㅂ')).toBe(false);

      // Double consonants
      expect(hasBatchim('밖', 'ㄲ')).toBe(true);
      expect(hasBatchim('밖', 'ㄱ')).toBe(false);
      expect(hasBatchim('있다', 'ㅆ')).toBe(true);
      expect(hasBatchim('있다', 'ㅅ')).toBe(false);

      // Compound batchim
      expect(hasBatchim('닭', 'ㄺ')).toBe(true);
      expect(hasBatchim('닭', 'ㄱ')).toBe(false);
      expect(hasBatchim('닭', 'ㄹ')).toBe(false);
      expect(hasBatchim('값', 'ㅄ')).toBe(true);
      expect(hasBatchim('앉다', 'ㄵ')).toBe(true);
      expect(hasBatchim('외곬', 'ㄽ')).toBe(true);

      // Rare batchim (ㅋ, ㅌ, ㅍ, etc.)
      expect(hasBatchim('부엌', 'ㅋ')).toBe(true);
      expect(hasBatchim('새벽녘', 'ㅋ')).toBe(true);
      expect(hasBatchim('솥', 'ㅌ')).toBe(true);
      expect(hasBatchim('숲', 'ㅍ')).toBe(true);
      expect(hasBatchim('좋다', 'ㅎ')).toBe(true);

      // Multi-syllable sentences
      expect(hasBatchim('어머니가 계시는 따뜻한 부엌', 'ㅋ')).toBe(true);
      expect(hasBatchim('하늘을 바라보아요', 'ㅋ')).toBe(false);
    });

    it('sets and clears activeFocusBatchim correctly for batchim, words, and sentences', async () => {
      const { setMasteryFocusBatchim, getActiveMasteryTarget, setMasteryProgressionLevel, setMasteryCheckpointLevel } =
        await import('./jamoMastery');

      const state = createDefaultMasteryState();
      expect(state.activeFocusBatchim).toBeNull();

      // Batchim target
      setMasteryFocusBatchim(state, 'ㅋ');
      expect(state.activeFocusBatchim).toBe('ㅋ');
      expect(state.activeCheckpointId).toBeNull();

      const target = getActiveMasteryTarget(state);
      expect(target.type).toBe('focus');
      if (target.type === 'focus') {
        expect(target.item.batchim).toBe('ㅋ');
        expect(target.item.name).toBe('키읔');
      }

      // Word practice target
      setMasteryFocusBatchim(state, 'words');
      expect(state.activeFocusBatchim).toBe('words');
      expect(getActiveMasteryTarget(state).type).toBe('consolidation_words');

      // Sentence practice target
      setMasteryFocusBatchim(state, 'sentences');
      expect(state.activeFocusBatchim).toBe('sentences');
      expect(getActiveMasteryTarget(state).type).toBe('consolidation_sentences');

      // Switching level clears focus
      setMasteryProgressionLevel(state, 10);
      expect(state.activeFocusBatchim).toBeNull();

      // Focusing again
      setMasteryFocusBatchim(state, 'ㄺ');
      expect(state.activeFocusBatchim).toBe('ㄺ');

      // Switching checkpoint clears focus
      setMasteryCheckpointLevel(state, 'cp_top_row');
      expect(state.activeFocusBatchim).toBeNull();
    });

    it('unlocks all 44 keys without modifying mastery history when jumping directly to post-game Consolidation', async () => {
      const { setMasteryFocusBatchim, JAMO_PROGRESSION_ORDER } =
        await import('./jamoMastery');

      const state = createDefaultMasteryState();
      expect(state.unlockedCount).toBe(4); // initial Stage 1
      expect(state.jamoStats['ㅋ']?.isMastered).toBe(false);

      // Jump directly to postgame batchim
      setMasteryFocusBatchim(state, 'ㅋ');
      expect(state.unlockedCount).toBe(JAMO_PROGRESSION_ORDER.length);
      expect(state.unlockedCount).toBe(44);

      // Verify that previously unmastered Jamo remains unmastered (not artificially marked)
      expect(state.jamoStats['ㅋ']?.isMastered).toBe(false);

      // Reset and jump directly to words consolidation
      const state2 = createDefaultMasteryState();
      setMasteryFocusBatchim(state2, 'words');
      expect(state2.unlockedCount).toBe(44);

      // Reset and jump directly to sentences consolidation
      const state3 = createDefaultMasteryState();
      setMasteryFocusBatchim(state3, 'sentences');
      expect(state3.unlockedCount).toBe(44);
    });

    it('strictly enforces that 100% of eligible items have the focused batchim in Focus mode', async () => {
      const { getEligibleMasteryItems, hasBatchim, BATCHIM_FOCUS_MAP } =
        await import('./jamoMastery');

      const dummyItems: LessonItem[] = [
        { id: 'item1', moduleId: 'm1', target: '부엌', translation: 'Kitchen' },
        { id: 'item2', moduleId: 'm1', target: '동녘', translation: 'East' },
        { id: 'item3', moduleId: 'm1', target: '나무', translation: 'Tree' },
        { id: 'item4', moduleId: 'm1', target: '물', translation: 'Water' },
        { id: 'item5', moduleId: 'm1', target: '닭고기', translation: 'Chicken meat' },
      ];

      const allUnlocked = new Set(JAMO_PROGRESSION_ORDER.map((i) => i.jamo));

      // Test across multiple batchim targets
      const testBatchim = ['ㅋ', 'ㄺ', 'ㄵ', 'ㄲ', 'ㅄ', 'ㅅ', 'ㅇ', 'ㄴ'];
      for (const batchim of testBatchim) {
        const focusTarget: MasteryTarget = {
          type: 'focus',
          item: BATCHIM_FOCUS_MAP[batchim],
        };

        const eligible = getEligibleMasteryItems(dummyItems, allUnlocked, focusTarget);
        expect(eligible.length).toBeGreaterThan(0);

        for (const item of eligible) {
          const containsBatchim = hasBatchim(item.target, batchim);
          expect(containsBatchim).toBe(true);
        }
      }
    });

    it('returns short/medium words for consolidation_words and long sentences for consolidation_sentences', async () => {
      const { getEligibleMasteryItems } = await import('./jamoMastery');

      const dummyItems: LessonItem[] = [
        { id: 'short1', moduleId: 'm1', target: '사과', translation: 'Apple' },
        { id: 'short2', moduleId: 'm1', target: '안녕하세요', translation: 'Hello' },
        { id: 'long1', moduleId: 'm1', target: '한국어 공부를 시작해 봅시다', translation: 'Let us begin studying Korean' },
        { id: 'long2', moduleId: 'm1', target: '오늘 날씨가 정말 좋습니다', translation: 'The weather is really nice today' },
      ];

      const allUnlocked = new Set(JAMO_PROGRESSION_ORDER.map((i) => i.jamo));

      const wordItems = getEligibleMasteryItems(dummyItems, allUnlocked, { type: 'consolidation_words' });
      expect(wordItems.some((i) => i.id === 'short1')).toBe(true);
      expect(wordItems.some((i) => i.id === 'short2')).toBe(true);
      expect(wordItems.some((i) => i.id === 'long1')).toBe(false);
      expect(wordItems.some((i) => i.id === 'long2')).toBe(false);

      const sentenceItems = getEligibleMasteryItems(dummyItems, allUnlocked, { type: 'consolidation_sentences' });
      expect(sentenceItems.some((i) => i.id === 'long1')).toBe(true);
      expect(sentenceItems.some((i) => i.id === 'long2')).toBe(true);
      expect(sentenceItems.some((i) => i.id === 'short1')).toBe(false);
      expect(sentenceItems.some((i) => i.id === 'short2')).toBe(false);
    });

    it('persists and reloads activeFocusBatchim state from LocalStorage', async () => {
      const { setMasteryFocusBatchim, saveMasteryState, loadMasteryState } =
        await import('./jamoMastery');

      const state = createDefaultMasteryState();
      setMasteryFocusBatchim(state, 'ㄶ');
      saveMasteryState(state);

      const reloaded = loadMasteryState();
      expect(reloaded.activeFocusBatchim).toBe('ㄶ');

      // Test words persistence
      setMasteryFocusBatchim(state, 'words');
      saveMasteryState(state);
      expect(loadMasteryState().activeFocusBatchim).toBe('words');

      // Test sentences persistence
      setMasteryFocusBatchim(state, 'sentences');
      saveMasteryState(state);
      expect(loadMasteryState().activeFocusBatchim).toBe('sentences');
    });
  });

  describe('Item Jamo Decomposition Cache & Metadata', () => {
    it('accurately computes and memoizes required Jamos, constituent Jamos, and batchims', () => {
      const item: LessonItem = {
        id: 'test_chicken',
        moduleId: 'm1',
        target: '닭고기',
        translation: 'Chicken meat',
      };

      const meta1 = getItemJamoMetadata(item);
      // '닭' has ㄷ, ㅏ, ㄹ, ㄱ (basic) + ㄺ (compound batchim); '고' has ㄱ, ㅗ; '기' has ㄱ, ㅣ
      expect(meta1.requiredJamos).toContain('ㄷ');
      expect(meta1.requiredJamos).toContain('ㅏ');
      expect(meta1.requiredJamos).toContain('ㄹ');
      expect(meta1.requiredJamos).toContain('ㄱ');
      expect(meta1.requiredJamos).toContain('ㄺ');
      expect(meta1.requiredJamos).toContain('ㅗ');
      expect(meta1.requiredJamos).toContain('ㅣ');
      expect(meta1.batchims.has('ㄺ')).toBe(true);

      // Verify reference equality for WeakMap memoization
      const meta2 = getItemJamoMetadata(item);
      expect(meta2).toBe(meta1);

      // Verify string-based memoization
      const stringMeta1 = getItemJamoMetadata('넓다');
      expect(stringMeta1.batchims.has('ㄼ')).toBe(true);
      expect(stringMeta1.requiredJamos).toContain('ㄼ');
      const stringMeta2 = getItemJamoMetadata('넓다');
      expect(stringMeta2).toBe(stringMeta1);
    });

    it('returns empty structures gracefully for empty target strings', () => {
      const emptyMeta = getItemJamoMetadata('');
      expect(emptyMeta.requiredJamos).toEqual([]);
      expect(emptyMeta.allJamos.size).toBe(0);
      expect(emptyMeta.batchims.size).toBe(0);
    });
  });

  describe('Error-Weighted Rolling Review in selectNextMasteryItem', () => {
    it('prioritizes vocabulary containing struggling keys with low rolling accuracy', () => {
      const state = createDefaultMasteryState();
      const items: LessonItem[] = [
        { id: '1', moduleId: 'm1', target: '아이', translation: 'child' },
        { id: '2', moduleId: 'm1', target: '오이', translation: 'cucumber' },
      ];

      // Mark all keys with high accuracy
      for (const key of Object.keys(state.jamoStats)) {
        state.jamoStats[key].totalAttempts = 20;
        state.jamoStats[key].correctAttempts = 20;
        state.jamoStats[key].recentHistory = new Array(20).fill(true);
      }

      // 'ㅏ' has poor accuracy (50%), so words containing 'ㅏ' ('아이') get boosted
      state.jamoStats['ㅏ'].totalAttempts = 20;
      state.jamoStats['ㅏ'].correctAttempts = 10;
      state.jamoStats['ㅏ'].recentHistory = new Array(10).fill(false).concat(new Array(10).fill(true));

      let countItem1 = 0;
      let countItem2 = 0;

      for (let i = 0; i < 500; i++) {
        const chosen = selectNextMasteryItem(items, null, state.jamoStats);
        if (chosen.id === '1') {
          countItem1++;
        } else {
          countItem2++;
        }
      }

      // Item 1 (containing struggling key 'ㅏ') should be selected significantly more often
      expect(countItem1).toBeGreaterThan(countItem2 * 2);
    });

    it('returns starter item if eligible items list is empty', () => {
      const chosen = selectNextMasteryItem([], null, {});
      expect(chosen.id).toBe('empty-mastery');
    });
  });
});
