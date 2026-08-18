import type { LessonItem } from '../types/korean';
import type {
  MasteryState,
  JamoStats,
  JamoProgressionItem,
  JamoStageGroup,
  SentenceCheckpoint,
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
    title: 'Home Row Sentences',
    afterJamoIndex: 11, // 'ㅡ'
    requiredCompletions: 15,
  },
  {
    id: 'cp_top_row',
    stage: 3,
    stageName: 'Top Row',
    title: 'Top + Home Row Sentences',
    afterJamoIndex: 21, // 'ㅔ'
    requiredCompletions: 15,
  },
  {
    id: 'cp_bottom_row',
    stage: 4,
    stageName: 'Bottom Row',
    title: 'Full Alphabet Sentences',
    afterJamoIndex: 26, // 'ㅠ'
    requiredCompletions: 15,
  },
  {
    id: 'cp_shift_keys',
    stage: 5,
    stageName: 'Shift Keys',
    title: 'Shift Key Sentences',
    afterJamoIndex: 33, // 'ㅖ'
    requiredCompletions: 15,
  },
  {
    id: 'cp_master',
    stage: 6,
    stageName: 'Compound Batchim',
    title: 'Master Review Passages',
    afterJamoIndex: 44, // 'ㄽ'
    requiredCompletions: 15,
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

/**
 * Returns the default mastery progress state starting with the 4 home-row index keys unlocked.
 */
export function createDefaultMasteryState(): MasteryState {
  const jamoStats: Record<string, JamoStats> = {};
  for (const item of JAMO_PROGRESSION_ORDER) {
    jamoStats[item.jamo] = {
      totalAttempts: 0,
      correctAttempts: 0,
      recentHistory: [],
      isMastered: false,
    };
  }

  const sentenceCheckpointStats: Record<string, { completedCount: number; isMastered: boolean }> =
    {};
  for (const cp of SENTENCE_CHECKPOINTS) {
    sentenceCheckpointStats[cp.id] = {
      completedCount: 0,
      isMastered: false,
    };
  }

  return {
    mode: 'mastery',
    unlockedCount: 4, // Initial Stage 1 keys: ㅓ, ㅏ, ㅇ, ㄹ
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

    const unlockedCount =
      typeof parsed.unlockedCount === 'number' &&
      parsed.unlockedCount >= 4 &&
      parsed.unlockedCount <= JAMO_PROGRESSION_ORDER.length
        ? parsed.unlockedCount
        : 4;

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
  const count = Math.max(4, Math.min(state.unlockedCount, JAMO_PROGRESSION_ORDER.length));
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
  const clamped = Math.max(4, Math.min(level, JAMO_PROGRESSION_ORDER.length));
  state.unlockedCount = clamped;
  state.activeCheckpointId = null;

  if (markPrecedingMastered) {
    for (let i = 0; i < JAMO_PROGRESSION_ORDER.length; i++) {
      const jamo = JAMO_PROGRESSION_ORDER[i].jamo;
      let stats = state.jamoStats[jamo];
      if (!stats) {
        stats = {
          totalAttempts: 0,
          correctAttempts: 0,
          recentHistory: [],
          isMastered: false,
        };
        state.jamoStats[jamo] = stats;
      }
      if (clamped === 4) {
        stats.isMastered = false;
        stats.totalAttempts = 0;
        stats.correctAttempts = 0;
        stats.recentHistory = [];
      } else if (i < clamped - 1) {
        stats.isMastered = true;
      } else {
        stats.isMastered = false;
        stats.totalAttempts = 0;
        stats.correctAttempts = 0;
        stats.recentHistory = [];
      }
    }

    if (!state.sentenceCheckpointStats) {
      state.sentenceCheckpointStats = {};
    }

    for (const cp of SENTENCE_CHECKPOINTS) {
      if (!state.sentenceCheckpointStats[cp.id]) {
        state.sentenceCheckpointStats[cp.id] = { completedCount: 0, isMastered: false };
      }
      if (clamped === 4) {
        state.sentenceCheckpointStats[cp.id] = { completedCount: 0, isMastered: false };
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
      stats = { totalAttempts: 0, correctAttempts: 0, recentHistory: [], isMastered: false };
      state.jamoStats[jamo] = stats;
    }
    if (i < cp.afterJamoIndex) {
      stats.isMastered = true;
    } else {
      stats.isMastered = false;
      stats.totalAttempts = 0;
      stats.correctAttempts = 0;
      stats.recentHistory = [];
    }
  }

  // Preceding checkpoints are mastered; active checkpoint is reset to 0
  for (const item of SENTENCE_CHECKPOINTS) {
    if (!state.sentenceCheckpointStats[item.id]) {
      state.sentenceCheckpointStats[item.id] = { completedCount: 0, isMastered: false };
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
  const count = Math.max(4, Math.min(state.unlockedCount, JAMO_PROGRESSION_ORDER.length));
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

/**
 * Records a single sentence completion during a sentence checkpoint.
 */
export function recordSentenceCompletion(
  state: MasteryState,
  checkpointId: string,
): { newlyMastered: boolean; newlyUnlockedJamo?: string } {
  if (!state.sentenceCheckpointStats) {
    state.sentenceCheckpointStats = {};
  }
  let stats = state.sentenceCheckpointStats[checkpointId];
  if (!stats) {
    stats = { completedCount: 0, isMastered: false };
    state.sentenceCheckpointStats[checkpointId] = stats;
  }

  stats.completedCount += 1;
  const cp = SENTENCE_CHECKPOINTS.find((c) => c.id === checkpointId);
  const targetCount = cp?.requiredCompletions ?? 15;

  let newlyMastered = false;
  let newlyUnlockedJamo: string | undefined = undefined;

  if (!stats.isMastered && stats.completedCount >= targetCount) {
    stats.isMastered = true;
    newlyMastered = true;
    state.activeCheckpointId = null;

    // Check if more Jamos remain to unlock
    if (state.unlockedCount < JAMO_PROGRESSION_ORDER.length) {
      const nextIndex = state.unlockedCount;
      state.unlockedCount += 1;
      newlyUnlockedJamo = JAMO_PROGRESSION_ORDER[nextIndex].jamo;

      const nextStats = state.jamoStats[newlyUnlockedJamo];
      if (nextStats) {
        nextStats.isMastered = false;
        nextStats.totalAttempts = 0;
        nextStats.correctAttempts = 0;
        nextStats.recentHistory = [];
        nextStats.lastPracticed = undefined;
      }
    }
  }

  return { newlyMastered, newlyUnlockedJamo };
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
    stats = {
      totalAttempts: 0,
      correctAttempts: 0,
      recentHistory: [],
      isMastered: false,
    };
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

      if (allUnlockedMastered && state.unlockedCount < JAMO_PROGRESSION_ORDER.length) {
        const nextIndex = state.unlockedCount;
        state.unlockedCount += 1;
        newlyUnlockedJamo = JAMO_PROGRESSION_ORDER[nextIndex].jamo;

        const nextStats = state.jamoStats[newlyUnlockedJamo];
        if (nextStats) {
          nextStats.isMastered = false;
          nextStats.totalAttempts = 0;
          nextStats.correctAttempts = 0;
          nextStats.recentHistory = [];
          nextStats.lastPracticed = undefined;
        }
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
export function isHangulJamo(char: string): boolean {
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
 * Filters and aggregates eligible items for mastery mode.
 * During Jamo stages, strictly restricts the pool to short words/phrases (<= 12 chars).
 * During Sentence checkpoints, serves medium-to-long sentences (>= 8 chars).
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
    const matchingCurriculum = allItems.filter(
      (item) => item.target.length >= 8 && isItemEligible(item, unlockedJamos),
    );
    const combined = [...curatedSentences, ...matchingCurriculum];
    return combined.length > 0 ? combined : curatedSentences;
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

  const combinedPool = [...curatedJamoWords, ...shortCurriculum];

  const seenTargets = new Set<string>();
  const eligible: LessonItem[] = [];
  for (const item of combinedPool) {
    if (!seenTargets.has(item.target)) {
      seenTargets.add(item.target);
      eligible.push(item);
    }
  }

  if (eligible.length === 0) {
    return [
      {
        id: 'mastery-starter',
        moduleId: 'mastery',
        target: '아',
        translation: 'Ah',
      },
    ];
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
export function itemContainsJamo(item: LessonItem, jamo: string): boolean {
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
    return {
      id: 'empty-mastery',
      moduleId: 'mastery',
      target: '아',
      translation: 'Ah',
    };
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
