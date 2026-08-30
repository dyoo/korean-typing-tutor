/**
 * Korean Keys-Per-Minute (KPM / 타수) & Inter-Keystroke Interval (IKI) Engine
 *
 * Implements canonical target stroke arithmetic (타수), pause clamping (2.0s),
 * gross/net throughput calculations, per-Jamo latency diagnostics, and bounded
 * localStorage persistence (<55 KB) matching KPM.md.
 */

import { decomposeSyllable } from './hangulDecompose';
import { isHangulSyllable } from './hangulTables';

/** Persistent LocalStorage key for speed metrics. */
export const SPEED_STORAGE_KEY = 'korean_typing_tutor_speed_metrics_v1';

/** Idle threshold (2.0 seconds) to prevent pauses from skewing speed metrics. */
const MAX_PAUSE_MS = 2000;

/** Minimal baseline duration (100 ms) to prevent division by zero. */
const MIN_ACTIVE_DURATION_MS = 100;

/** Maximum records kept in the FIFO exercise history ring buffer. */
const MAX_RECENT_HISTORY = 200;

/** Maximum bigram transitions tracked to preserve bounded memory. */
const MAX_BIGRAM_ENTRIES = 300;

/** In-memory keystroke event representation during an active exercise prompt. */
export interface KeystrokeEvent {
  key: string;
  jamo?: string;
  fromJamo?: string;
  timestamp: number;
  rawIkiMs: number;
  clampedIkiMs: number;
  isCorrect: boolean;
}

/** Aggregated latency metrics for a specific Jamo character. */
interface JamoLatencyStats {
  totalAttempts: number;
  totalIkiMs: number;
  averageIkiMs: number;
  fastestIkiMs: number;
  recentIki: number[];
}

type JamoLatencyMap = Record<string, JamoLatencyStats>;

/** Latency and error tracking between consecutive key transitions. */
interface BigramTransitionStats {
  fromJamo: string;
  toJamo: string;
  totalAttempts: number;
  totalIkiMs: number;
  averageIkiMs: number;
  errorCount: number;
}

type BigramTransitionMap = Record<string, BigramTransitionStats>;

/** Snapshot of a completed exercise prompt's speed metrics. */
export interface ExerciseSpeedRecord {
  id: string;
  timestamp: number;
  targetText: string;
  targetStrokes: number;
  rawKeystrokes: number;
  activeDurationMs: number;
  errorCount: number;
  backspaceCount: number;
  netKpm: number;
  grossKpm: number;
  accuracy: number;
  medianIkiMs: number;
  moduleId?: string;
  jamoId?: string;
  category?: 'words' | 'sentences' | 'jamo';
}

/** Master persistent storage schema for all typing speed analytics. */
export interface SpeedMetricsStore {
  version: 1;
  totalTargetStrokes: number;
  totalRawKeystrokes: number;
  totalActiveTimeMs: number;
  totalErrors: number;
  totalBackspaces: number;
  totalExercisesCompleted: number;
  bestNetKpm: number;
  jamoLatency: JamoLatencyMap;
  bigramLatency: BigramTransitionMap;
  recentHistory: ExerciseSpeedRecord[];
}

/**
 * Double/tense consonants and shifted vowels that count as 1 functional stroke.
 */
const SHIFTED_JAMOS = new Set(['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ', 'ㅒ', 'ㅖ']);

/**
 * Compound vowels and their stroke counts.
 */
const COMPOUND_VOWEL_STROKES: Record<string, number> = {
  ㅘ: 2,
  ㅙ: 3,
  ㅚ: 2,
  ㅝ: 2,
  ㅞ: 2,
  ㅟ: 2,
  ㅢ: 2,
};

/**
 * Compound final consonants (겹받침) that count as 2 strokes.
 */
const COMPOUND_BATCHIM_STROKES = new Set([
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
 * Calculates the canonical target strokes (타수) of a text string according to Korean typing standards.
 *
 * Rules:
 * - Simple Jamo: 1 stroke
 * - Shifted Jamo (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ, ㅒ, ㅖ): 1 stroke
 * - Compound Vowels (ㅘ, ㅝ, ㅚ, ㅞ, ㅟ, ㅢ): 2 strokes (ㅙ: 3 strokes)
 * - Compound Final Consonants (ㄳ, ㄵ, ㄶ, ㄺ, ㄻ, ㄼ, ㄽ, ㄾ, ㄿ, ㅀ, ㅄ): 2 strokes
 * - Whitespace & Punctuation: 1 stroke each
 */
export function countCanonicalStrokes(target: string): number {
  if (!target) {
    return 0;
  }

  let strokes = 0;

  for (let i = 0; i < target.length; i++) {
    const char = target[i];

    if (isHangulSyllable(char)) {
      const decomp = decomposeSyllable(char);
      if (decomp) {
        // Initial consonant
        strokes += 1;

        // Vowel
        if (decomp.vowel) {
          strokes += COMPOUND_VOWEL_STROKES[decomp.vowel] ?? 1;
        }

        // Final consonant (if present)
        if (decomp.finalConsonant) {
          if (COMPOUND_BATCHIM_STROKES.has(decomp.finalConsonant)) {
            strokes += 2;
          } else {
            strokes += 1;
          }
        }
      }
    } else if (SHIFTED_JAMOS.has(char)) {
      strokes += 1;
    } else if (COMPOUND_VOWEL_STROKES[char]) {
      strokes += COMPOUND_VOWEL_STROKES[char];
    } else if (COMPOUND_BATCHIM_STROKES.has(char)) {
      strokes += 2;
    } else if (char.trim() === '') {
      strokes += 1; // Whitespace
    } else {
      // Punctuation, standalone Jamos, or alphanumeric characters
      strokes += 1;
    }
  }

  return strokes;
}

/**
 * Creates a blank, initialized SpeedMetricsStore.
 */
export function createDefaultSpeedMetricsStore(): SpeedMetricsStore {
  return {
    version: 1,
    totalTargetStrokes: 0,
    totalRawKeystrokes: 0,
    totalActiveTimeMs: 0,
    totalErrors: 0,
    totalBackspaces: 0,
    totalExercisesCompleted: 0,
    bestNetKpm: 0,
    jamoLatency: {},
    bigramLatency: {},
    recentHistory: [],
  };
}

/**
 * Loads speed metrics from LocalStorage with bounded size guarantees and schema validation.
 */
export function loadSpeedMetricsStore(): SpeedMetricsStore {
  try {
    if (typeof localStorage === 'undefined') {
      return createDefaultSpeedMetricsStore();
    }
    const raw = localStorage.getItem(SPEED_STORAGE_KEY);
    if (!raw) {
      return createDefaultSpeedMetricsStore();
    }
    const parsed = JSON.parse(raw);
    const store = createDefaultSpeedMetricsStore();

    if (parsed && typeof parsed === 'object') {
      store.totalTargetStrokes =
        typeof parsed.totalTargetStrokes === 'number' ? parsed.totalTargetStrokes : 0;
      store.totalRawKeystrokes =
        typeof parsed.totalRawKeystrokes === 'number' ? parsed.totalRawKeystrokes : 0;
      store.totalActiveTimeMs =
        typeof parsed.totalActiveTimeMs === 'number' ? parsed.totalActiveTimeMs : 0;
      store.totalErrors = typeof parsed.totalErrors === 'number' ? parsed.totalErrors : 0;
      store.totalBackspaces =
        typeof parsed.totalBackspaces === 'number' ? parsed.totalBackspaces : 0;
      store.totalExercisesCompleted =
        typeof parsed.totalExercisesCompleted === 'number' ? parsed.totalExercisesCompleted : 0;
      store.bestNetKpm = typeof parsed.bestNetKpm === 'number' ? parsed.bestNetKpm : 0;

      if (parsed.jamoLatency && typeof parsed.jamoLatency === 'object') {
        store.jamoLatency = parsed.jamoLatency;
      }
      if (parsed.bigramLatency && typeof parsed.bigramLatency === 'object') {
        store.bigramLatency = parsed.bigramLatency;
      }
      if (Array.isArray(parsed.recentHistory)) {
        store.recentHistory = parsed.recentHistory.slice(-MAX_RECENT_HISTORY);
      }
    }

    return store;
  } catch {
    return createDefaultSpeedMetricsStore();
  }
}

/**
 * Saves speed metrics to LocalStorage, ensuring ring buffer bounds are strictly preserved.
 */
export function saveSpeedMetricsStore(store: SpeedMetricsStore): void {
  try {
    if (typeof localStorage !== 'undefined') {
      // Ensure history buffer never exceeds limit
      if (store.recentHistory.length > MAX_RECENT_HISTORY) {
        store.recentHistory = store.recentHistory.slice(-MAX_RECENT_HISTORY);
      }
      localStorage.setItem(SPEED_STORAGE_KEY, JSON.stringify(store));
    }
  } catch {
    // Graceful fallback if storage is full or restricted
  }
}

/**
 * Tracks intra-exercise keystroke events and computes active duration, KPM, and latency diagnostics.
 */
export class ExerciseSpeedTracker {
  private events: KeystrokeEvent[] = [];
  private lastTimestamp: number | null = null;
  private lastJamo: string | null = null;

  /**
   * Records a keystroke event.
   */
  public recordKeystroke(key: string, jamo?: string, isCorrect = true): void {
    const now = performance.now();
    let rawIkiMs = 0;
    let clampedIkiMs = 0;

    if (this.lastTimestamp !== null) {
      rawIkiMs = Math.max(0, now - this.lastTimestamp);
      clampedIkiMs = Math.min(rawIkiMs, MAX_PAUSE_MS);
    }

    const event: KeystrokeEvent = {
      key,
      jamo,
      fromJamo: this.lastJamo ?? undefined,
      timestamp: now,
      rawIkiMs,
      clampedIkiMs,
      isCorrect,
    };

    this.events.push(event);
    this.lastTimestamp = now;
    if (jamo) {
      this.lastJamo = jamo;
    }
  }

  /**
   * Resets active keystroke stream.
   */
  public reset(): void {
    this.events = [];
    this.lastTimestamp = null;
    this.lastJamo = null;
  }

  /**
   * Computes the active typing duration (ms), summing clamped intervals.
   */
  public getActiveDurationMs(): number {
    if (this.events.length <= 1) {
      return MIN_ACTIVE_DURATION_MS;
    }

    let sum = 0;
    for (let i = 1; i < this.events.length; i++) {
      sum += this.events[i].clampedIkiMs;
    }

    return Math.max(sum, MIN_ACTIVE_DURATION_MS);
  }

  /**
   * Finalizes the current exercise prompt, updates the master store, and returns the generated speed record.
   */
  public finalizeExercise(
    store: SpeedMetricsStore,
    targetText: string,
    moduleId?: string,
    jamoId?: string,
  ): ExerciseSpeedRecord | null {
    const rawKeystrokes = this.events.length;
    if (rawKeystrokes === 0 || !targetText) {
      this.reset();
      return null;
    }

    const targetStrokes = countCanonicalStrokes(targetText);
    const activeDurationMs = this.getActiveDurationMs();
    const durationMinutes = activeDurationMs / 60000;

    const netKpm = Math.round(targetStrokes / durationMinutes);
    const grossKpm = Math.round(rawKeystrokes / durationMinutes);

    let errorCount = 0;
    let backspaceCount = 0;
    const ikiList: number[] = [];

    for (let i = 0; i < this.events.length; i++) {
      const ev = this.events[i];
      if (!ev.isCorrect) {
        errorCount++;
      }
      if (ev.key === 'Backspace' || ev.key === 'backspace') {
        backspaceCount++;
      }
      if (i > 0) {
        ikiList.push(ev.clampedIkiMs);
      }

      // Update per-Jamo latency stats on correct keystrokes
      if (ev.jamo && ev.isCorrect && i > 0) {
        let stats = store.jamoLatency[ev.jamo];
        const clampedIki = Math.max(1, ev.clampedIkiMs);
        if (!stats) {
          stats = {
            totalAttempts: 0,
            totalIkiMs: 0,
            averageIkiMs: 0,
            fastestIkiMs: clampedIki,
            recentIki: [],
          };
          store.jamoLatency[ev.jamo] = stats;
        }
        stats.totalAttempts += 1;
        stats.totalIkiMs += clampedIki;
        stats.averageIkiMs = Math.max(1, Math.round(stats.totalIkiMs / stats.totalAttempts));
        if (clampedIki < stats.fastestIkiMs || stats.fastestIkiMs === 0) {
          stats.fastestIkiMs = Math.round(clampedIki);
        }
        stats.recentIki.push(Math.round(clampedIki));
        if (stats.recentIki.length > 10) {
          stats.recentIki.shift();
        }
      }

      // Update bigram transition stats
      if (ev.fromJamo && ev.jamo && i > 0) {
        const bigramKey = `${ev.fromJamo}->${ev.jamo}`;
        let bgStats = store.bigramLatency[bigramKey];
        if (!bgStats) {
          bgStats = {
            fromJamo: ev.fromJamo,
            toJamo: ev.jamo,
            totalAttempts: 0,
            totalIkiMs: 0,
            averageIkiMs: 0,
            errorCount: 0,
          };
          // Enforce bounded key map
          if (Object.keys(store.bigramLatency).length < MAX_BIGRAM_ENTRIES) {
            store.bigramLatency[bigramKey] = bgStats;
          }
        }
        if (bgStats) {
          bgStats.totalAttempts += 1;
          if (ev.isCorrect) {
            const clampedIki = Math.max(1, ev.clampedIkiMs);
            bgStats.totalIkiMs += clampedIki;
            bgStats.averageIkiMs = Math.max(
              1,
              Math.round(bgStats.totalIkiMs / bgStats.totalAttempts),
            );
          } else {
            bgStats.errorCount += 1;
          }
        }
      }
    }

    // Median IKI
    let medianIkiMs = 0;
    if (ikiList.length > 0) {
      ikiList.sort((a, b) => a - b);
      const mid = Math.floor(ikiList.length / 2);
      medianIkiMs =
        ikiList.length % 2 !== 0 ? ikiList[mid] : Math.round((ikiList[mid - 1] + ikiList[mid]) / 2);
    }

    const accuracy =
      rawKeystrokes > 0
        ? Math.round(((rawKeystrokes - errorCount) / rawKeystrokes) * 1000) / 10
        : 100;

    let category: 'words' | 'sentences' | 'jamo' = 'words';
    if (targetText.length >= 8 || targetText.includes(' ')) {
      category = 'sentences';
    } else if (targetText.length <= 1 && !isHangulSyllable(targetText)) {
      category = 'jamo';
    }

    const record: ExerciseSpeedRecord = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      targetText,
      targetStrokes,
      rawKeystrokes,
      activeDurationMs: Math.round(activeDurationMs),
      errorCount,
      backspaceCount,
      netKpm,
      grossKpm,
      accuracy,
      medianIkiMs,
      moduleId,
      jamoId,
      category,
    };

    // Update cumulative lifetime store
    store.totalTargetStrokes += targetStrokes;
    store.totalRawKeystrokes += rawKeystrokes;
    store.totalActiveTimeMs += Math.round(activeDurationMs);
    store.totalErrors += errorCount;
    store.totalBackspaces += backspaceCount;
    store.totalExercisesCompleted += 1;

    // Only prompts with >= 3 canonical strokes qualify for best record (outlier protection)
    if (targetStrokes >= 3 && netKpm > store.bestNetKpm) {
      store.bestNetKpm = netKpm;
    }

    // Add to history ring buffer
    store.recentHistory.push(record);
    if (store.recentHistory.length > MAX_RECENT_HISTORY) {
      store.recentHistory.shift();
    }

    this.reset();
    saveSpeedMetricsStore(store);

    return record;
  }
}

/**
 * Retrieves the effective KPM speed and latency stats for a specific Jamo character.
 *
 * Stroke KPM = 60000 / averageIkiMs.
 */
export function getJamoKpmStats(
  store: SpeedMetricsStore,
  jamo: string,
): { kpm: number; averageIkiMs: number; attempts: number } | null {
  if (!store || !jamo) {
    return null;
  }

  const stats = store.jamoLatency[jamo];
  if (!stats || stats.totalAttempts === 0) {
    return null;
  }

  const avgIki = Math.max(1, stats.averageIkiMs);
  const kpm = Math.round(60000 / avgIki);
  return {
    kpm,
    averageIkiMs: avgIki,
    attempts: stats.totalAttempts,
  };
}

/**
 * Retrieves rolling speed and accuracy stats for a specific category ('words' | 'sentences').
 */
export function getCategoryKpmStats(
  store: SpeedMetricsStore,
  category: 'words' | 'sentences',
): { kpm: number; accuracy: number; count: number; bestKpm: number } | null {
  if (!store || !store.recentHistory || store.recentHistory.length === 0) {
    return null;
  }

  const matches = store.recentHistory.filter((r) => r.category === category);
  if (matches.length === 0) {
    return null;
  }

  let totalNetKpm = 0;
  let totalAccuracy = 0;
  let bestKpm = 0;

  for (const m of matches) {
    totalNetKpm += m.netKpm;
    totalAccuracy += m.accuracy;
    if (m.netKpm > bestKpm) {
      bestKpm = m.netKpm;
    }
  }

  return {
    kpm: Math.round(totalNetKpm / matches.length),
    accuracy: Math.round((totalAccuracy / matches.length) * 10) / 10,
    count: matches.length,
    bestKpm,
  };
}

/**
 * Resets all speed statistics and metrics in the store back to initial empty values and persists to storage.
 */
export function resetSpeedMetricsStore(store: SpeedMetricsStore): void {
  store.totalTargetStrokes = 0;
  store.totalRawKeystrokes = 0;
  store.totalActiveTimeMs = 0;
  store.totalErrors = 0;
  store.totalBackspaces = 0;
  store.totalExercisesCompleted = 0;
  store.bestNetKpm = 0;
  store.recentHistory = [];
  store.jamoLatency = {};
  store.bigramLatency = {};
  saveSpeedMetricsStore(store);
}
