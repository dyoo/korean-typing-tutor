import type { LessonItem } from '../types/korean';
import type {
  MasteryState,
  JamoStats,
  JamoProgressionItem,
  MasteryAttemptResult,
} from '../types/mastery';
import { decomposeStringToJamos } from './hangulDecompose';

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

  // Stage 2: Remaining Home Row Keys
  { jamo: 'ㅗ', key: 'h', hand: 'right', stage: 2, stageName: 'Home Row' },
  { jamo: 'ㅣ', key: 'l', hand: 'right', stage: 2, stageName: 'Home Row' },
  { jamo: 'ㅁ', key: 'a', hand: 'left', stage: 2, stageName: 'Home Row' },
  { jamo: 'ㄴ', key: 's', hand: 'left', stage: 2, stageName: 'Home Row' },
  { jamo: 'ㅎ', key: 'g', hand: 'left', stage: 2, stageName: 'Home Row' },

  // Stage 3: Top Row Keys
  { jamo: 'ㄱ', key: 'r', hand: 'left', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅅ', key: 't', hand: 'left', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㄷ', key: 'e', hand: 'left', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅈ', key: 'w', hand: 'left', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅂ', key: 'q', hand: 'left', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅜ', key: 'n', hand: 'right', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅡ', key: 'm', hand: 'right', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅕ', key: 'u', hand: 'right', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅑ', key: 'i', hand: 'right', stage: 3, stageName: 'Top Row' },
  { jamo: 'ㅛ', key: 'y', hand: 'right', stage: 3, stageName: 'Top Row' },
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

  // Stage 6: Punctuation
  { jamo: ',', key: ',', hand: 'right', stage: 6, stageName: 'Punctuation' },
  { jamo: '.', key: '.', hand: 'right', stage: 6, stageName: 'Punctuation' },
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

/**
 * Validates whether 100% of an item's constituent Jamos belong to the unlocked Jamo set.
 */
export function isItemEligible(item: LessonItem, unlockedJamos: Set<string>): boolean {
  if (!item.target || item.target.trim() === '') return false;
  const jamos = decomposeStringToJamos(item.target);
  if (jamos.length === 0) return false;

  return jamos.every((j) => j === ' ' || unlockedJamos.has(j));
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
 * Selects the next exercise item from eligible items, biasing selection toward words
 * that contain the active learning Jamo or Jamos with lower accuracy.
 */
export function selectNextMasteryItem(
  eligibleItems: LessonItem[],
  activeJamo: string | null,
  jamoStats: Record<string, JamoStats>,
): LessonItem {
  if (eligibleItems.length === 0) {
    return {
      id: 'empty-mastery',
      moduleId: 'mastery',
      target: '아',
      translation: 'Ah',
    };
  }

  if (eligibleItems.length === 1) {
    return eligibleItems[0];
  }

  // Assign weights to items based on whether they contain active/struggling Jamos
  const weightedList: { item: LessonItem; weight: number }[] = [];

  for (const item of eligibleItems) {
    const jamos = decomposeStringToJamos(item.target);
    let weight = 1;

    for (const j of jamos) {
      if (j === activeJamo) {
        weight += 3; // 3x multiplier for the active learning Jamo
      }
      const stats = jamoStats[j];
      if (stats && stats.totalAttempts > 0) {
        const acc = calculateJamoAccuracy(stats);
        if (acc < 0.9) {
          weight += 2; // Extra weight for struggling Jamos
        }
      }
    }

    weightedList.push({ item, weight });
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
