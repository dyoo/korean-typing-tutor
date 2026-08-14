import type { LessonItem } from '../types/korean';
import type {
  MasteryState,
  JamoStats,
  JamoProgressionItem,
  MasteryAttemptResult,
} from '../types/mastery';
import { decomposeStringToJamos } from './hangulDecompose';
import { FINAL_CONSONANT_STANDALONE, HANGUL_BASE } from './hangulTables';

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
  { jamo: 'ㄶ', key: 'sg', combination: ['ㄴ', 'ㅎ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
  { jamo: 'ㄵ', key: 'sw', combination: ['ㄴ', 'ㅈ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
  { jamo: 'ㄺ', key: 'fr', combination: ['ㄹ', 'ㄱ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
  { jamo: 'ㄻ', key: 'fa', combination: ['ㄹ', 'ㅁ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
  { jamo: 'ㄼ', key: 'fq', combination: ['ㄹ', 'ㅂ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
  { jamo: 'ㅄ', key: 'qt', combination: ['ㅂ', 'ㅅ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
  { jamo: 'ㅀ', key: 'fg', combination: ['ㄹ', 'ㅎ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
  { jamo: 'ㄳ', key: 'rt', combination: ['ㄱ', 'ㅅ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
  { jamo: 'ㄾ', key: 'fx', combination: ['ㄹ', 'ㅌ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
  { jamo: 'ㄿ', key: 'fv', combination: ['ㄹ', 'ㅍ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
  { jamo: 'ㄽ', key: 'ft', combination: ['ㄹ', 'ㅅ'], hand: 'left', stage: 6, stageName: 'Compound Batchim' },
];

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

  return {
    mode: 'mastery',
    unlockedCount: 4, // Initial Stage 1 keys: ㅓ, ㅏ, ㅇ, ㄹ
    jamoStats,
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
    if (!raw) return createDefaultMasteryState();

    const parsed = JSON.parse(raw);
    const defaultState = createDefaultMasteryState();

    const unlockedCount =
      typeof parsed.unlockedCount === 'number' &&
      parsed.unlockedCount >= 4 &&
      parsed.unlockedCount <= JAMO_PROGRESSION_ORDER.length
        ? parsed.unlockedCount
        : 4;

    const mode = parsed.mode === 'curriculum' ? 'curriculum' : 'mastery';

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
            lastPracticed: typeof stats.lastPracticed === 'number' ? stats.lastPracticed : undefined,
          };
        }
      }
    }

    return {
      mode,
      unlockedCount,
      jamoStats,
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
 * Sets the mastery unlocked count to a specific level (clamped between 4 and 35).
 * Optionally marks all unlocked Jamos before the active target as mastered.
 */
export function setMasteryProgressionLevel(
  state: MasteryState,
  level: number,
  markPrecedingMastered = true,
): void {
  const clamped = Math.max(4, Math.min(level, JAMO_PROGRESSION_ORDER.length));
  state.unlockedCount = clamped;

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
        // Stage 1 clean slate: all keys unmastered with zero attempts
        stats.isMastered = false;
        stats.totalAttempts = 0;
        stats.correctAttempts = 0;
        stats.recentHistory = [];
      } else if (i < clamped - 1) {
        // Preceding keys are marked as mastered
        stats.isMastered = true;
      } else {
        // The active frontier key (i === clamped - 1) and all locked keys beyond (i >= clamped)
        // are explicitly set to unmastered so the frontier key is actively learned as the candidate
        stats.isMastered = false;
        stats.totalAttempts = 0;
        stats.correctAttempts = 0;
        stats.recentHistory = [];
      }
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
  if (stats.recentHistory.length === 0) return 1.0;
  const correct = stats.recentHistory.filter(Boolean).length;
  return correct / stats.recentHistory.length;
}

/**
 * Calculates percentage progress (0 to 100) towards mastery for a single Jamo.
 */
export function calculateJamoProgress(stats?: JamoStats): number {
  if (!stats) return 0;
  if (stats.isMastered) return 100;
  if (stats.totalAttempts === 0) return 0;
  const accuracy = calculateJamoAccuracy(stats);
  const attemptRatio = Math.min(stats.totalAttempts, MIN_MASTERY_ATTEMPTS) / MIN_MASTERY_ATTEMPTS;
  return Math.min(100, Math.max(0, Math.round(attemptRatio * accuracy * 100)));
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
  if (isCorrect) stats.correctAttempts += 1;
  stats.recentHistory.push(isCorrect);
  if (stats.recentHistory.length > ROLLING_WINDOW_SIZE) {
    stats.recentHistory.shift();
  }
  stats.lastPracticed = Date.now();

  const accuracy = calculateJamoAccuracy(stats);
  let newlyMastered = false;
  let newlyUnlockedJamo: string | undefined = undefined;

  // Evaluate Mastery Criteria: at least 20 attempts with >= 95% rolling accuracy
  if (!stats.isMastered && stats.totalAttempts >= MIN_MASTERY_ATTEMPTS && accuracy >= MIN_MASTERY_ACCURACY) {
    stats.isMastered = true;
    newlyMastered = true;

    // If all currently unlocked Jamos are mastered and more remain, unlock the next one
    const unlockedSet = getUnlockedJamos(state);
    const allUnlockedMastered = Array.from(unlockedSet).every(
      (j) => state.jamoStats[j]?.isMastered ?? false,
    );

    if (allUnlockedMastered && state.unlockedCount < JAMO_PROGRESSION_ORDER.length) {
      const nextIndex = state.unlockedCount;
      state.unlockedCount += 1;
      newlyUnlockedJamo = JAMO_PROGRESSION_ORDER[nextIndex].jamo;
    }
  }

  return {
    jamo,
    isCorrect,
    accuracy,
    attemptsCount: stats.totalAttempts,
    newlyMastered,
    newlyUnlockedJamo,
  };
}

/** Set of all 11 Korean compound final consonants (겹받침). */
export const COMPOUND_BATCHIM_SET = new Set([
  'ㄳ', 'ㄵ', 'ㄶ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅄ',
]);

/**
 * Helper to determine if a character is a Hangul Jamo (compatibility or standard Unicode Jamo).
 */
export function isHangulJamo(char: string): boolean {
  if (!char) return false;
  const code = char.charCodeAt(0);
  return (code >= 0x3131 && code <= 0x318e) || (code >= 0x1100 && code <= 0x11ff);
}

/**
 * Validates whether all of an item's constituent Hangul Jamos belong to the unlocked Jamo set.
 * Syllables with compound final consonants (겹받침) also require their specific compound
 * batchim to be unlocked in the progression sequence.
 */
export function isItemEligible(item: LessonItem, unlockedJamos: Set<string>): boolean {
  if (!item.target || item.target.trim() === '') return false;

  // 1. Verify that all decomposed basic Jamos are unlocked
  const jamos = decomposeStringToJamos(item.target);
  if (jamos.length === 0) return false;
  if (!jamos.every((j) => !isHangulJamo(j) || unlockedJamos.has(j))) {
    return false;
  }

  // 2. Verify that compound final consonants (겹받침) are unlocked
  for (const char of item.target) {
    const code = char.charCodeAt(0) - HANGUL_BASE;
    if (code >= 0 && code <= 11171) {
      const finalConsonantIndex = code % 28;
      if (finalConsonantIndex > 0) {
        const finalChar = FINAL_CONSONANT_STANDALONE[finalConsonantIndex];
        if (finalChar && COMPOUND_BATCHIM_SET.has(finalChar) && !unlockedJamos.has(finalChar)) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Filters an entire curriculum item list to only those items whose Jamos are all unlocked.
 */
export function getEligibleMasteryItems(
  allItems: LessonItem[],
  unlockedJamos: Set<string>,
): LessonItem[] {
  const eligible = allItems.filter((item) => isItemEligible(item, unlockedJamos));

  // Fallback: If no multi-character words match the initial small subset of Jamos,
  // return single/compound syllables composed of the unlocked Jamos.
  if (eligible.length === 0) {
    const fallbackList: LessonItem[] = [];
    const basicCombinations = ['어', '아', '얼', '라', '알', '러', '어라', '알아', '얼마', '오이', '아이'];
    for (const word of basicCombinations) {
      const jamos = decomposeStringToJamos(word);
      if (jamos.every((j) => unlockedJamos.has(j))) {
        fallbackList.push({
          id: `mastery-fallback-${word}`,
          moduleId: 'mastery',
          target: word,
          translation: 'Practice',
        });
      }
    }
    return fallbackList.length > 0
      ? fallbackList
      : [
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
 * - Early stage (0–30% progress): Strongly biases toward 1–2 character words.
 * - Mid stage (30–70% progress): Biases toward 2–4 character core vocabulary.
 * - Advanced stage (70–100% progress): Unlocks full breadth, including longer phrases and sentences.
 */
export function getAdaptiveLengthMultiplier(targetLength: number, progressPercent: number): number {
  if (progressPercent < 30) {
    if (targetLength <= 2) return 4.0;
    if (targetLength <= 4) return 1.0;
    return 0.2;
  } else if (progressPercent < 70) {
    if (targetLength >= 2 && targetLength <= 4) return 3.0;
    if (targetLength === 1) return 1.5;
    if (targetLength <= 8) return 1.0;
    return 0.5;
  } else {
    if (targetLength >= 3) return 1.5;
    return 1.0;
  }
}

/**
 * Selects the next exercise item from eligible items, biasing selection toward words
 * that contain the active learning Jamo, struggling Jamos, and scaling target word
 * length adaptively based on the active Jamo's progress.
 */
export function selectNextMasteryItem(
  eligibleItems: LessonItem[],
  activeJamo: string | null,
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

  // Filter out the item just finished to prevent immediate repetition if choices exist
  const candidates =
    eligibleItems.length > 1 && currentItemId
      ? eligibleItems.filter((i) => i.id !== currentItemId)
      : eligibleItems;

  const pool = candidates.length > 0 ? candidates : eligibleItems;
  if (pool.length === 1) {
    return pool[0];
  }

  const activeStats = activeJamo ? jamoStats[activeJamo] : undefined;
  const activeProgress = activeStats ? calculateJamoProgress(activeStats) : 100;
  const isActiveCompoundBatchim = activeJamo ? COMPOUND_BATCHIM_SET.has(activeJamo) : false;

  // Assign weights to items based on whether they contain active/struggling Jamos and adaptive word length
  const weightedList: { item: LessonItem; weight: number }[] = [];

  for (const item of pool) {
    const jamos = decomposeStringToJamos(item.target);
    let jamoWeight = 1;

    for (const j of jamos) {
      if (j === activeJamo) {
        jamoWeight += 3; // 3x multiplier for the active learning Jamo
      }
      const stats = jamoStats[j];
      if (stats && stats.totalAttempts > 0) {
        const acc = calculateJamoAccuracy(stats);
        if (acc < 0.9) {
          jamoWeight += 2; // Extra weight for struggling Jamos
        }
      }
    }

    // If active learning target is a compound batchim (e.g. ㄺ, ㅄ, ㄶ), check syllables directly
    if (isActiveCompoundBatchim && activeJamo) {
      for (const char of item.target) {
        const code = char.charCodeAt(0) - HANGUL_BASE;
        if (code >= 0 && code <= 11171) {
          const finalIndex = code % 28;
          if (finalIndex > 0 && FINAL_CONSONANT_STANDALONE[finalIndex] === activeJamo) {
            jamoWeight += 6; // 6x multiplier for words featuring the target compound batchim!
          }
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

  return eligibleItems[Math.floor(Math.random() * eligibleItems.length)];
}
