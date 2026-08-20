import type { LessonItem } from '../types/korean';
import type {
  MasteryState,
  JamoStats,
  JamoProgressionItem,
  JamoStageGroup,
  SentenceCheckpoint,
  SentenceCheckpointStats,
  MasteryTarget,
  MasteryAttemptResult,
} from '../types/mastery';
import { decomposeStringToJamos, decomposeSyllable } from './hangulDecompose';
import {
  MASTERY_JAMO_VOCABULARY,
  MASTERY_CHECKPOINT_SENTENCES,
} from '../content/masteryVocabulary';

/** Storage key used for persisting Jamo mastery progress in LocalStorage. */
const MASTERY_STORAGE_KEY = 'korean_tutor_mastery';

/** Minimum keystrokes required on a Jamo before mastery evaluation can pass. */
const MIN_MASTERY_ATTEMPTS = 20;

/** Minimum rolling accuracy ratio (95%) required to graduate a Jamo to Mastered. */
const MIN_MASTERY_ACCURACY = 0.95;

/** Maximum length of the sliding accuracy history window for each Jamo. */
const ROLLING_WINDOW_SIZE = 20;

/**
 * Minimum number of unlocked Jamos in the progression sequence.
 * The four Stage 1 home-row index keys (ㅓ, ㅏ, ㅇ, ㄹ) are always available.
 */
const MIN_UNLOCKED_COUNT = 4;

/**
 * Ordered Dubeolsik (2-set) Jamo progression sequence based on ergonomic
 * home-row outward touch-typing principles.
 */
export const JAMO_PROGRESSION_ORDER: JamoProgressionItem[] = [
  // Stage 1: Home Row Index Keys (Immediate feedback with basic vowels/consonants)
  { jamo: 'ㅓ', key: 'j', hand: 'right', stage: 1, stageName: 'Home Row Index Keys' },
  { jamo: 'ㅏ', key: 'k', hand: 'right', stage: 1, stageName: 'Home Row Index Keys' },
  { jamo: 'ㅇ', key: 'd', hand: 'left', stage: 1, stageName: 'Home Row Index Keys' },
  { jamo: 'ㄹ', key: 'f', hand: 'left', stage: 1, stageName: 'Home Row Index Keys' },

  // Stage 2: Remaining Home Row & Fundamental Vowels
  { jamo: 'ㅗ', key: 'h', hand: 'right', stage: 2, stageName: 'Home Row' },
  { jamo: 'ㅣ', key: 'l', hand: 'right', stage: 2, stageName: 'Home Row' },
  { jamo: 'ㅁ', key: 'a', hand: 'left', stage: 2, stageName: 'Home Row' },
  { jamo: 'ㄴ', key: 's', hand: 'left', stage: 2, stageName: 'Home Row' },
  { jamo: 'ㅎ', key: 'g', hand: 'left', stage: 2, stageName: 'Home Row' },
  { jamo: 'ㅜ', key: 'n', hand: 'right', stage: 2, stageName: 'Basic Vowels' },
  { jamo: 'ㅡ', key: 'm', hand: 'right', stage: 2, stageName: 'Basic Vowels' },

  // Stage 3: Top Row Keys
  { jamo: 'ㄱ', key: 'r', hand: 'left', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅅ', key: 't', hand: 'left', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㄷ', key: 'e', hand: 'left', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅈ', key: 'w', hand: 'left', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅂ', key: 'q', hand: 'left', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅛ', key: 'y', hand: 'right', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅕ', key: 'u', hand: 'right', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅑ', key: 'i', hand: 'right', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅐ', key: 'o', hand: 'right', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅔ', key: 'p', hand: 'right', stage: 3, stageName: 'Top Row' },

  // Stage 4: Bottom Row Keys
  { jamo: 'ㅋ', key: 'z', hand: 'left', stage: 4, stageName: 'Bottom Row' },
  { jamo: 'ㅌ', key: 'x', hand: 'left', stage: 4, stageName: 'Bottom Row' },
  { jamo: 'ㅊ', key: 'c', hand: 'left', stage: 4, stageName: 'Bottom Row' },
  { jamo: 'ㅍ', key: 'v', hand: 'left', stage: 4, stageName: 'Bottom Row' },
  { jamo: 'ㅠ', key: 'b', hand: 'right', stage: 4, stageName: 'Bottom Row' },

  // Stage 5: Shift Key Double Consonants & Vowels
  { jamo: 'ㄲ', key: 'r', shift: true, hand: 'left', stage: 5, stageName: 'Shift Keys' },
  { jamo: 'ㅆ', key: 't', shift: true, hand: 'left', stage: 5, stageName: 'Shift Keys' },
  { jamo: 'ㄸ', key: 'e', shift: true, hand: 'left', stage: 5, stageName: 'Shift Keys' },
  { jamo: 'ㅉ', key: 'w', shift: true, hand: 'left', stage: 5, stageName: 'Shift Keys' },
  { jamo: 'ㅃ', key: 'q', shift: true, hand: 'left', stage: 5, stageName: 'Shift Keys' },
  { jamo: 'ㅒ', key: 'o', shift: true, hand: 'right', stage: 5, stageName: 'Shift Keys' },
  { jamo: 'ㅖ', key: 'p', shift: true, hand: 'right', stage: 5, stageName: 'Shift Keys' },

  // Stage 6: Compound Final Consonants (겹받침)
  {
    jamo: 'ㄶ',
    key: 'sg',
    combination: ['ㄴ', 'ㅎ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
  {
    jamo: 'ㄵ',
    key: 'sw',
    combination: ['ㄴ', 'ㅈ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
  {
    jamo: 'ㄺ',
    key: 'fr',
    combination: ['ㄹ', 'ㄱ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
  {
    jamo: 'ㄻ',
    key: 'fa',
    combination: ['ㄹ', 'ㅁ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
  {
    jamo: 'ㄼ',
    key: 'fq',
    combination: ['ㄹ', 'ㅂ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
  {
    jamo: 'ㅄ',
    key: 'qt',
    combination: ['ㅂ', 'ㅅ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
  {
    jamo: 'ㅀ',
    key: 'fg',
    combination: ['ㄹ', 'ㅎ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
  {
    jamo: 'ㄳ',
    key: 'rt',
    combination: ['ㄱ', 'ㅅ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
  {
    jamo: 'ㄾ',
    key: 'fx',
    combination: ['ㄹ', 'ㅌ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
  {
    jamo: 'ㄿ',
    key: 'fv',
    combination: ['ㄹ', 'ㅍ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
  {
    jamo: 'ㄽ',
    key: 'ft',
    combination: ['ㄹ', 'ㅅ'],
    hand: 'left',
    stage: 6,
    stageName: 'Compound Batchim',
  },
];

/**
 * Interleaved sentence milestone checkpoints between key learning sections.
 */
export const SENTENCE_CHECKPOINTS: SentenceCheckpoint[] = [
  {
    id: 'cp_home_row',
    stage: 2,
    stageName: 'Home Row',
    title: 'Home',
    afterJamoIndex: 11, // 'ㅡ'
    requiredCompletions: 10,
  },
  {
    id: 'cp_top_row',
    stage: 3,
    stageName: 'Top Row',
    title: 'Top',
    afterJamoIndex: 21, // 'ㅔ'
    requiredCompletions: 10,
  },
  {
    id: 'cp_bottom_row',
    stage: 4,
    stageName: 'Bottom Row',
    title: 'Alphabet',
    afterJamoIndex: 26, // 'ㅠ'
    requiredCompletions: 10,
  },
  {
    id: 'cp_shift_keys',
    stage: 5,
    stageName: 'Shift Keys',
    title: 'Shift',
    afterJamoIndex: 33, // 'ㅖ'
    requiredCompletions: 10,
  },
  {
    id: 'cp_master',
    stage: 6,
    stageName: 'Compound Batchim',
    title: 'Mastery',
    afterJamoIndex: 44, // 'ㄽ'
    requiredCompletions: 10,
  },
];

/**
 * Groups `JAMO_PROGRESSION_ORDER` into stages and attaches sentence checkpoints.
 */
export const JAMO_STAGES: JamoStageGroup[] = (() => {
  const stageMap = new Map<number, JamoProgressionItem[]>();
  for (const item of JAMO_PROGRESSION_ORDER) {
    const group = stageMap.get(item.stage) ?? [];
    group.push(item);
    stageMap.set(item.stage, group);
  }
  return Array.from(stageMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([stageNum, items]) => ({
      stageNum,
      stageName: items[0].stageName,
      items,
      checkpoint: SENTENCE_CHECKPOINTS.find((cp) => cp.stage === stageNum),
    }));
})();

/** Creates a fresh zeroed JamoStats entry. */
function createEmptyJamoStats(): JamoStats {
  return {
    totalAttempts: 0,
    correctAttempts: 0,
    recentHistory: [],
    isMastered: false,
  };
}

/**
 * Resets a JamoStats entry to its zeroed state.
 * Note: intentionally does NOT clear `lastPracticed` — the manual
 * level-setting paths preserve the practice timestamp.
 */
function resetJamoStats(stats: JamoStats): void {
  stats.isMastered = false;
  stats.totalAttempts = 0;
  stats.correctAttempts = 0;
  stats.recentHistory = [];
}

/** Creates a fresh zeroed SentenceCheckpointStats entry. */
function createEmptyCheckpointStats(): SentenceCheckpointStats {
  return { completedCount: 0, isMastered: false };
}

/**
 * Clamps an unlocked Jamo count into the valid range
 * (MIN_UNLOCKED_COUNT .. JAMO_PROGRESSION_ORDER.length).
 */
function clampUnlockedCount(count: number): number {
  return Math.max(MIN_UNLOCKED_COUNT, Math.min(count, JAMO_PROGRESSION_ORDER.length));
}

/** Removes duplicate items sharing the same target, preserving first-seen order. */
function dedupeByTarget(items: LessonItem[]): LessonItem[] {
  const seenTargets = new Set<string>();
  const eligible: LessonItem[] = [];
  for (const item of items) {
    if (!seenTargets.has(item.target)) {
      seenTargets.add(item.target);
      eligible.push(item);
    }
  }
  return eligible;
}

/**
 * Unlocks the next Jamo in the progression sequence and resets its stats,
 * including the `lastPracticed` timestamp (unlike manual level resets).
 * Returns the newly unlocked Jamo, or null if everything is already unlocked.
 */
function unlockNextJamo(state: MasteryState): string | null {
  if (state.unlockedCount >= JAMO_PROGRESSION_ORDER.length) {
    return null;
  }
  const nextIndex = state.unlockedCount;
  state.unlockedCount += 1;
  const jamo = JAMO_PROGRESSION_ORDER[nextIndex].jamo;
  const nextStats = state.jamoStats[jamo];
  if (nextStats) {
    resetJamoStats(nextStats);
    nextStats.lastPracticed = undefined;
  }
  return jamo;
}

/** Fallback lesson item returned when the mastery pool has no eligible items. */
function createStarterItem(id: string): LessonItem {
  return {
    id,
    moduleId: 'mastery',
    target: '아',
    translation: 'Ah',
  };
}

/**
 * Returns the default mastery progress state starting with the 4 home-row index keys unlocked.
 */
export function createDefaultMasteryState(): MasteryState {
  const jamoStats: Record<string, JamoStats> = {};
  for (const item of JAMO_PROGRESSION_ORDER) {
    jamoStats[item.jamo] = createEmptyJamoStats();
  }

  const sentenceCheckpointStats: Record<string, SentenceCheckpointStats> = {};
  for (const cp of SENTENCE_CHECKPOINTS) {
    sentenceCheckpointStats[cp.id] = createEmptyCheckpointStats();
  }

  return {
    mode: 'mastery',
    unlockedCount: MIN_UNLOCKED_COUNT, // Initial Stage 1 keys: ㅓ, ㅏ, ㅇ, ㄹ
    activeCheckpointId: null,
    jamoStats,
    sentenceCheckpointStats,
  };
}

/**
 * Loads the user's MasteryState from LocalStorage.
 * Falls back to default state if not found or corrupted.
 */
export function loadMasteryState(): MasteryState {
  try {
    if (typeof localStorage === 'undefined') {
      return createDefaultMasteryState();
    }
    const raw = localStorage.getItem(MASTERY_STORAGE_KEY);
    if (!raw) {
      return createDefaultMasteryState();
    }

    const parsed = JSON.parse(raw);
    const defaultState = createDefaultMasteryState();

    // Note: unlike clampUnlockedCount, an out-of-range persisted value resets
    // to the minimum rather than clamping to the maximum (corruption fallback).
    const unlockedCount =
      typeof parsed.unlockedCount === 'number' &&
      parsed.unlockedCount >= MIN_UNLOCKED_COUNT &&
      parsed.unlockedCount <= JAMO_PROGRESSION_ORDER.length
        ? parsed.unlockedCount
        : MIN_UNLOCKED_COUNT;

    const mode = parsed.mode === 'curriculum' ? 'curriculum' : 'mastery';
    const activeCheckpointId =
      typeof parsed.activeCheckpointId === 'string' ? parsed.activeCheckpointId : null;

    const jamoStats = { ...defaultState.jamoStats };
    if (parsed.jamoStats && typeof parsed.jamoStats === 'object') {
      for (const item of JAMO_PROGRESSION_ORDER) {
        const stats = parsed.jamoStats[item.jamo];
        if (stats && typeof stats === 'object') {
          jamoStats[item.jamo] = {
            totalAttempts: typeof stats.totalAttempts === 'number' ? stats.totalAttempts : 0,
            correctAttempts: typeof stats.correctAttempts === 'number' ? stats.correctAttempts : 0,
            recentHistory: Array.isArray(stats.recentHistory)
              ? stats.recentHistory.slice(-ROLLING_WINDOW_SIZE)
              : [],
            isMastered: typeof stats.isMastered === 'boolean' ? stats.isMastered : false,
            lastPracticed:
              typeof stats.lastPracticed === 'number' ? stats.lastPracticed : undefined,
          };
        }
      }
    }

    const sentenceCheckpointStats = { ...defaultState.sentenceCheckpointStats };
    if (parsed.sentenceCheckpointStats && typeof parsed.sentenceCheckpointStats === 'object') {
      for (const cp of SENTENCE_CHECKPOINTS) {
        const stats = parsed.sentenceCheckpointStats[cp.id];
        if (stats && typeof stats === 'object') {
          sentenceCheckpointStats[cp.id] = {
            completedCount: typeof stats.completedCount === 'number' ? stats.completedCount : 0,
            isMastered: typeof stats.isMastered === 'boolean' ? stats.isMastered : false,
          };
        }
      }
    }

    return {
      mode,
      unlockedCount,
      activeCheckpointId,
      jamoStats,
      sentenceCheckpointStats,
    };
  } catch {
    return createDefaultMasteryState();
  }
}

/**
 * Persists the user's MasteryState into LocalStorage.
 */
export function saveMasteryState(state: MasteryState): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(MASTERY_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // Graceful fallback if LocalStorage is unavailable or restricted
  }
}

/**
 * Returns a Set of Jamo characters currently unlocked for practice.
 */
export function getUnlockedJamos(state: MasteryState): Set<string> {
  const count = clampUnlockedCount(state.unlockedCount);
  const set = new Set<string>();
  for (let i = 0; i < count; i++) {
    set.add(JAMO_PROGRESSION_ORDER[i].jamo);
  }
  return set;
}

/**
 * Checks whether an unmastered sentence checkpoint is currently active or due.
 */
export function getActiveCheckpointForState(state: MasteryState): SentenceCheckpoint | null {
  if (state.activeCheckpointId) {
    const cp = SENTENCE_CHECKPOINTS.find((c) => c.id === state.activeCheckpointId);
    if (cp) {
      return cp;
    }
  }

  // Look for the lowest checkpoint whose Jamos are unlocked & mastered, but checkpoint is unmastered
  for (const cp of SENTENCE_CHECKPOINTS) {
    if (state.unlockedCount >= cp.afterJamoIndex) {
      let allPrecedingMastered = true;
      for (let i = 0; i < cp.afterJamoIndex; i++) {
        const j = JAMO_PROGRESSION_ORDER[i].jamo;
        if (!state.jamoStats[j]?.isMastered) {
          allPrecedingMastered = false;
          break;
        }
      }

      const cpStats = state.sentenceCheckpointStats?.[cp.id];
      if (allPrecedingMastered && (!cpStats || !cpStats.isMastered)) {
        return cp;
      }
    }
  }

  return null;
}

/**
 * Returns the active learning target (either a specific Jamo or a Sentence Checkpoint).
 */
export function getActiveMasteryTarget(state: MasteryState): MasteryTarget {
  const checkpoint = getActiveCheckpointForState(state);
  if (checkpoint) {
    return { type: 'checkpoint', checkpoint };
  }

  const activeJamo = getActiveLearningJamo(state);
  return {
    type: 'jamo',
    item: activeJamo ?? JAMO_PROGRESSION_ORDER[0],
  };
}

/**
 * Sets the mastery unlocked count to a specific level (clamped between 4 and 44).
 * Optionally marks all unlocked Jamos before the active target as mastered.
 */
export function setMasteryProgressionLevel(
  state: MasteryState,
  level: number,
  markPrecedingMastered = true,
): void {
  const clamped = clampUnlockedCount(level);
  state.unlockedCount = clamped;
  state.activeCheckpointId = null;

  if (markPrecedingMastered) {
    for (let i = 0; i < JAMO_PROGRESSION_ORDER.length; i++) {
      const jamo = JAMO_PROGRESSION_ORDER[i].jamo;
      let stats = state.jamoStats[jamo];
      if (!stats) {
        stats = createEmptyJamoStats();
        state.jamoStats[jamo] = stats;
      }
      // Jamos before the active target are mastered; everything else is reset.
      if (clamped > MIN_UNLOCKED_COUNT && i < clamped - 1) {
        stats.isMastered = true;
      } else {
        resetJamoStats(stats);
      }
    }

    if (!state.sentenceCheckpointStats) {
      state.sentenceCheckpointStats = {};
    }

    for (const cp of SENTENCE_CHECKPOINTS) {
      if (!state.sentenceCheckpointStats[cp.id]) {
        state.sentenceCheckpointStats[cp.id] = createEmptyCheckpointStats();
      }
      if (clamped === MIN_UNLOCKED_COUNT) {
        state.sentenceCheckpointStats[cp.id] = createEmptyCheckpointStats();
      } else if (cp.afterJamoIndex < clamped) {
        state.sentenceCheckpointStats[cp.id].isMastered = true;
        state.sentenceCheckpointStats[cp.id].completedCount = cp.requiredCompletions;
      } else {
        state.sentenceCheckpointStats[cp.id].isMastered = false;
        state.sentenceCheckpointStats[cp.id].completedCount = 0;
      }
    }
  }
}

/**
 * Manually jumps to a specific sentence checkpoint milestone.
 */
export function setMasteryCheckpointLevel(state: MasteryState, checkpointId: string): void {
  const cp = SENTENCE_CHECKPOINTS.find((c) => c.id === checkpointId);
  if (!cp) {
    return;
  }

  state.unlockedCount = cp.afterJamoIndex;
  state.activeCheckpointId = checkpointId;

  if (!state.sentenceCheckpointStats) {
    state.sentenceCheckpointStats = {};
  }

  // Preceding Jamos are mastered
  for (let i = 0; i < JAMO_PROGRESSION_ORDER.length; i++) {
    const jamo = JAMO_PROGRESSION_ORDER[i].jamo;
    let stats = state.jamoStats[jamo];
    if (!stats) {
      stats = createEmptyJamoStats();
      state.jamoStats[jamo] = stats;
    }
    if (i < cp.afterJamoIndex) {
      stats.isMastered = true;
    } else {
      resetJamoStats(stats);
    }
  }

  // Preceding checkpoints are mastered; active checkpoint is reset to 0
  for (const item of SENTENCE_CHECKPOINTS) {
    if (!state.sentenceCheckpointStats[item.id]) {
      state.sentenceCheckpointStats[item.id] = createEmptyCheckpointStats();
    }
    if (item.afterJamoIndex < cp.afterJamoIndex) {
      state.sentenceCheckpointStats[item.id].isMastered = true;
      state.sentenceCheckpointStats[item.id].completedCount = item.requiredCompletions;
    } else {
      state.sentenceCheckpointStats[item.id].isMastered = false;
      state.sentenceCheckpointStats[item.id].completedCount = 0;
    }
  }
}

/**
 * Returns the currently active learning Jamo (the newest unlocked Jamo that hasn't yet achieved mastery).
 */
export function getActiveLearningJamo(state: MasteryState): JamoProgressionItem | null {
  const count = clampUnlockedCount(state.unlockedCount);
  for (let i = count - 1; i >= 0; i--) {
    const item = JAMO_PROGRESSION_ORDER[i];
    const stats = state.jamoStats[item.jamo];
    if (!stats || !stats.isMastered) {
      return item;
    }
  }
  return JAMO_PROGRESSION_ORDER[count - 1] ?? null;
}

/**
 * Calculates rolling accuracy for a given Jamo from its recent attempt history.
 */
export function calculateJamoAccuracy(stats: JamoStats): number {
  if (stats.recentHistory.length === 0) {
    return 1.0;
  }
  const correct = stats.recentHistory.filter(Boolean).length;
  return correct / stats.recentHistory.length;
}

/**
 * Calculates percentage progress (0 to 100) towards mastery for a single Jamo.
 */
export function calculateJamoProgress(stats?: JamoStats): number {
  if (!stats) {
    return 0;
  }
  if (stats.isMastered) {
    return 100;
  }
  if (stats.totalAttempts === 0) {
    return 0;
  }
  const accuracy = calculateJamoAccuracy(stats);
  const attemptRatio = Math.min(stats.totalAttempts, MIN_MASTERY_ATTEMPTS) / MIN_MASTERY_ATTEMPTS;
  return Math.min(100, Math.max(0, Math.round(attemptRatio * accuracy * 100)));
}

export interface SentenceCompletionResult {
  newlyMastered: boolean;
  newlyUnlockedJamo?: string;
  isAllMasteryComplete?: boolean;
}

/**
 * Records a single sentence completion during a sentence checkpoint.
 */
export function recordSentenceCompletion(
  state: MasteryState,
  checkpointId: string,
): SentenceCompletionResult {
  if (!state.sentenceCheckpointStats) {
    state.sentenceCheckpointStats = {};
  }
  let stats = state.sentenceCheckpointStats[checkpointId];
  if (!stats) {
    stats = createEmptyCheckpointStats();
    state.sentenceCheckpointStats[checkpointId] = stats;
  }

  stats.completedCount += 1;
  const cp = SENTENCE_CHECKPOINTS.find((c) => c.id === checkpointId);
  const targetCount = cp?.requiredCompletions ?? 10;

  let newlyMastered = false;
  let newlyUnlockedJamo: string | undefined = undefined;
  let isAllMasteryComplete = false;

  if (!stats.isMastered && stats.completedCount >= targetCount) {
    stats.isMastered = true;
    newlyMastered = true;
    state.activeCheckpointId = null;

    // If graduating the final milestone (cp_master), flag complete mastery
    const lastCheckpoint = SENTENCE_CHECKPOINTS[SENTENCE_CHECKPOINTS.length - 1];
    if (checkpointId === lastCheckpoint.id) {
      isAllMasteryComplete = true;
    }

    // Check if more Jamos remain to unlock
    newlyUnlockedJamo = unlockNextJamo(state) ?? undefined;
  }

  return { newlyMastered, newlyUnlockedJamo, isAllMasteryComplete };
}

/**
 * Checks if the learner has graduated all checkpoints and unlocked all Jamos.
 */
export function isAllMasteryComplete(state: MasteryState): boolean {
  const lastCheckpoint = SENTENCE_CHECKPOINTS[SENTENCE_CHECKPOINTS.length - 1];
  return (
    state.unlockedCount >= JAMO_PROGRESSION_ORDER.length &&
    state.sentenceCheckpointStats?.[lastCheckpoint.id]?.isMastered === true
  );
}

/**
 * Records a single keystroke outcome for a target Jamo and evaluates mastery promotion.
 */
export function recordJamoAttempt(
  state: MasteryState,
  jamo: string,
  isCorrect: boolean,
): MasteryAttemptResult {
  let stats = state.jamoStats[jamo];
  if (!stats) {
    stats = createEmptyJamoStats();
    state.jamoStats[jamo] = stats;
  }

  stats.totalAttempts += 1;
  if (isCorrect) {
    stats.correctAttempts += 1;
  }
  stats.recentHistory.push(isCorrect);
  if (stats.recentHistory.length > ROLLING_WINDOW_SIZE) {
    stats.recentHistory.shift();
  }
  stats.lastPracticed = Date.now();

  const accuracy = calculateJamoAccuracy(stats);
  let newlyMastered = false;
  let newlyUnlockedJamo: string | undefined = undefined;
  let newlyUnlockedCheckpoint: string | undefined = undefined;

  // Evaluate Mastery Criteria: at least 20 attempts with >= 95% rolling accuracy
  if (
    !stats.isMastered &&
    stats.totalAttempts >= MIN_MASTERY_ATTEMPTS &&
    accuracy >= MIN_MASTERY_ACCURACY
  ) {
    stats.isMastered = true;
    newlyMastered = true;

    // Check if mastering this Jamo unlocks a Sentence Checkpoint
    const cp = getActiveCheckpointForState(state);
    if (cp) {
      newlyUnlockedCheckpoint = cp.id;
    } else {
      const unlockedSet = getUnlockedJamos(state);
      const allUnlockedMastered = Array.from(unlockedSet).every(
        (j) => state.jamoStats[j]?.isMastered ?? false,
      );

      if (allUnlockedMastered) {
        newlyUnlockedJamo = unlockNextJamo(state) ?? undefined;
      }
    }
  }

  return {
    jamo,
    isCorrect,
    accuracy,
    attemptsCount: stats.totalAttempts,
    newlyMastered,
    newlyUnlockedJamo,
    newlyUnlockedCheckpoint,
  };
}

/** Set of all 11 Korean compound final consonants (겹받침). */
export const COMPOUND_BATCHIM_SET = new Set([
  'ㄳ',
  'ㄵ',
  'ㄶ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅄ',
]);

/**
 * Helper to determine if a character is a Hangul Jamo (compatibility or standard Unicode Jamo).
 */
function isHangulJamo(char: string): boolean {
  if (!char) {
    return false;
  }
  const code = char.charCodeAt(0);
  return (code >= 0x3131 && code <= 0x318e) || (code >= 0x1100 && code <= 0x11ff);
}

/**
 * Validates whether all of an item's constituent Hangul Jamos belong to the unlocked Jamo set.
 * Syllables with compound final consonants (겹받침) also require their specific compound
 * batchim to be unlocked in the progression sequence.
 */
export function isItemEligible(item: LessonItem, unlockedJamos: Set<string>): boolean {
  if (!item.target || item.target.trim() === '') {
    return false;
  }

  // 1. Verify that all decomposed basic Jamos are unlocked
  const jamos = decomposeStringToJamos(item.target);
  if (jamos.length === 0) {
    return false;
  }
  if (!jamos.every((j) => !isHangulJamo(j) || unlockedJamos.has(j))) {
    return false;
  }

  // 2. Verify that compound final consonants (겹받침) are unlocked
  for (const char of item.target) {
    const finalChar = decomposeSyllable(char)?.finalConsonant;
    if (finalChar && COMPOUND_BATCHIM_SET.has(finalChar) && !unlockedJamos.has(finalChar)) {
      return false;
    }
  }

  return true;
}

/**
 * Returns the set of Jamos specifically introduced in the section corresponding to a sentence checkpoint.
 * - `cp_home_row`: Home row section (combines Stage 1 Home Row Index Keys and Stage 2 Home Row & Basic Vowels).
 * - `cp_top_row`: Top row section (Stage 3).
 * - `cp_bottom_row`: Bottom row section (Stage 4).
 * - `cp_shift_keys`: Shift keys section (Stage 5).
 * - `cp_master`: Returns null as the final milestone is exempt from section-specific restrictions.
 */
export function getSectionJamosForCheckpoint(checkpointId: string): Set<string> | null {
  if (checkpointId === 'cp_home_row') {
    return new Set(
      JAMO_PROGRESSION_ORDER.filter((item) => item.stage === 1 || item.stage === 2).map(
        (item) => item.jamo,
      ),
    );
  }
  if (checkpointId === 'cp_top_row') {
    return new Set(
      JAMO_PROGRESSION_ORDER.filter((item) => item.stage === 3).map((item) => item.jamo),
    );
  }
  if (checkpointId === 'cp_bottom_row') {
    return new Set(
      JAMO_PROGRESSION_ORDER.filter((item) => item.stage === 4).map((item) => item.jamo),
    );
  }
  if (checkpointId === 'cp_shift_keys') {
    return new Set(
      JAMO_PROGRESSION_ORDER.filter((item) => item.stage === 5).map((item) => item.jamo),
    );
  }
  return null;
}

/**
 * Checks if a Hangul target string contains at least one Jamo from the specified set of Jamos.
 * Accounts for initial consonants, vowels, and final consonants.
 */
export function itemUsesAnyJamo(text: string, targetJamos: Set<string>): boolean {
  if (!text || targetJamos.size === 0) {
    return false;
  }
  for (const char of text) {
    const decomp = decomposeSyllable(char);
    if (decomp) {
      if (decomp.initialConsonant && targetJamos.has(decomp.initialConsonant)) {
        return true;
      }
      if (decomp.vowel && targetJamos.has(decomp.vowel)) {
        return true;
      }
      if (decomp.finalConsonant && targetJamos.has(decomp.finalConsonant)) {
        return true;
      }
    } else if (targetJamos.has(char)) {
      return true;
    }
  }
  // Also check decomposed constituent basic Jamos
  const jamos = decomposeStringToJamos(text);
  for (const j of jamos) {
    if (targetJamos.has(j)) {
      return true;
    }
  }
  return false;
}

/**
 * Filters and aggregates eligible items for mastery mode.
 * During Jamo stages, strictly restricts the pool to short words/phrases (<= 12 chars).
 * During Sentence checkpoints, serves medium-to-long sentences (>= 8 chars) that use
 * Jamos introduced in that milestone's section (with cp_home_row handling both home row
 * index keys and home row, and cp_master exempt).
 */
export function getEligibleMasteryItems(
  allItems: LessonItem[],
  unlockedJamos: Set<string>,
  activeTarget?: MasteryTarget | null,
): LessonItem[] {
  // If active target is a sentence checkpoint, return curated sentence bank + matching curriculum sentences
  if (activeTarget && activeTarget.type === 'checkpoint') {
    const cpId = activeTarget.checkpoint.id;
    const curatedSentences = MASTERY_CHECKPOINT_SENTENCES[cpId] ?? [];
    const sectionJamos = getSectionJamosForCheckpoint(cpId);

    const matchingCurriculum = allItems.filter((item) => {
      if (item.target.length < 8 || !isItemEligible(item, unlockedJamos)) {
        return false;
      }
      // For milestone challenges (except the last milestone), the sentences must use jamo used in that section.
      if (sectionJamos && sectionJamos.size > 0) {
        return itemUsesAnyJamo(item.target, sectionJamos);
      }
      return true;
    });

    const eligible = dedupeByTarget([...curatedSentences, ...matchingCurriculum]);
    return eligible.length > 0 ? eligible : curatedSentences;
  }

  // For Jamo stages: RESTRICT TO SHORT WORDS (<= 12 characters)
  const curatedJamoWords: LessonItem[] = [];
  for (const jamo of unlockedJamos) {
    const words = MASTERY_JAMO_VOCABULARY[jamo];
    if (words) {
      curatedJamoWords.push(...words);
    }
  }

  const shortCurriculum = allItems.filter(
    (item) => item.target.length <= 12 && isItemEligible(item, unlockedJamos),
  );

  const eligible = dedupeByTarget([...curatedJamoWords, ...shortCurriculum]);

  if (eligible.length === 0) {
    return [createStarterItem('mastery-starter')];
  }

  return eligible;
}

/**
 * Calculates a progressive length multiplier based on the active Jamo's mastery progress.
 */
export function getAdaptiveLengthMultiplier(targetLength: number, progressPercent: number): number {
  if (progressPercent < 30) {
    if (targetLength <= 2) {
      return 4.0;
    }
    if (targetLength <= 4) {
      return 1.0;
    }
    return 0.2;
  } else if (progressPercent < 70) {
    if (targetLength >= 2 && targetLength <= 4) {
      return 3.0;
    }
    if (targetLength === 1) {
      return 1.5;
    }
    if (targetLength <= 8) {
      return 1.0;
    }
    return 0.5;
  } else {
    if (targetLength >= 3) {
      return 1.5;
    }
    return 1.0;
  }
}

/**
 * Probability (0–1) that each exercise will feature the active learning Jamo.
 */
const FOCUS_JAMO_PROBABILITY = 0.4;

/**
 * Checks whether a lesson item contains the specified Jamo character.
 */
function itemContainsJamo(item: LessonItem, jamo: string): boolean {
  const jamos = decomposeStringToJamos(item.target);
  if (jamos.includes(jamo)) {
    return true;
  }

  if (COMPOUND_BATCHIM_SET.has(jamo)) {
    for (const char of item.target) {
      if (decomposeSyllable(char)?.finalConsonant === jamo) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Selects the next exercise item.
 */
export function selectNextMasteryItem(
  eligibleItems: LessonItem[],
  activeTarget: MasteryTarget | string | null,
  jamoStats: Record<string, JamoStats>,
  currentItemId?: string,
): LessonItem {
  if (eligibleItems.length === 0) {
    return createStarterItem('empty-mastery');
  }

  const candidates =
    eligibleItems.length > 1 && currentItemId
      ? eligibleItems.filter((i) => i.id !== currentItemId)
      : eligibleItems;

  const pool = candidates.length > 0 ? candidates : eligibleItems;
  if (pool.length === 1) {
    return pool[0];
  }

  const isCheckpoint =
    typeof activeTarget === 'object' && activeTarget !== null && activeTarget.type === 'checkpoint';

  if (isCheckpoint) {
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const activeJamoChar =
    typeof activeTarget === 'string'
      ? activeTarget
      : activeTarget && activeTarget.type === 'jamo'
        ? activeTarget.item.jamo
        : null;

  // Pass 1: Focus Pool Decision
  let selectionPool = pool;
  if (activeJamoChar) {
    const focusPool = pool.filter((item) => itemContainsJamo(item, activeJamoChar));
    if (focusPool.length > 0 && Math.random() < FOCUS_JAMO_PROBABILITY) {
      selectionPool = focusPool;
    }
  }

  // Pass 2: Weighted Random Selection
  const activeStats = activeJamoChar ? jamoStats[activeJamoChar] : undefined;
  const activeProgress = activeStats ? calculateJamoProgress(activeStats) : 100;

  const weightedList: { item: LessonItem; weight: number }[] = [];

  for (const item of selectionPool) {
    const jamos = decomposeStringToJamos(item.target);
    let jamoWeight = 1;

    for (const j of jamos) {
      const stats = jamoStats[j];
      if (stats && stats.totalAttempts > 0) {
        const acc = calculateJamoAccuracy(stats);
        if (acc < 0.9) {
          jamoWeight += 2;
        }
      }
    }

    const lengthMultiplier = getAdaptiveLengthMultiplier(item.target.length, activeProgress);
    const finalWeight = jamoWeight * lengthMultiplier;

    weightedList.push({ item, weight: finalWeight });
  }

  const totalWeight = weightedList.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;

  for (const { item, weight } of weightedList) {
    random -= weight;
    if (random <= 0) {
      return item;
    }
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
