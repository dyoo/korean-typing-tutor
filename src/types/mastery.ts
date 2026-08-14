/** Application practice mode: manual curriculum module selection or spaced-repetition Jamo mastery. */
export type TutorMode = 'curriculum' | 'mastery';

/** Tracking statistics for a single Jamo character. */
export interface JamoStats {
  /** Total keystroke attempts for this Jamo. */
  totalAttempts: number;
  /** Total correct keystroke attempts. */
  correctAttempts: number;
  /** Rolling window of the most recent attempts (boolean array, max length 20). */
  recentHistory: boolean[];
  /** Whether the user has met the mastery criteria for this Jamo. */
  isMastered: boolean;
  /** Timestamp of the last practice session. */
  lastPracticed?: number;
}

/** Persistent state of the user's Jamo mastery progress. */
export interface MasteryState {
  /** Active application mode ('curriculum' or 'mastery'). */
  mode: TutorMode;
  /** Number of unlocked Jamos from the progression order (starting at 4). */
  unlockedCount: number;
  /** Per-Jamo statistics map keyed by Jamo character. */
  jamoStats: Record<string, JamoStats>;
}

/** Metadata for each Jamo in the progression sequence. */
export interface JamoProgressionItem {
  jamo: string;
  key: string;
  shift?: boolean;
  hand: 'left' | 'right';
  stage: number;
  stageName: string;
}

/** Result of checking or recording a Jamo attempt. */
export interface MasteryAttemptResult {
  jamo: string;
  isCorrect: boolean;
  accuracy: number;
  attemptsCount: number;
  newlyMastered: boolean;
  newlyUnlockedJamo?: string;
}
