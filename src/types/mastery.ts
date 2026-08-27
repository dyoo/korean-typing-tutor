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
  /** Timestamp (ms) of the last practice keystroke. */
  lastPracticed?: number;
}

/** Tracking statistics for a sentence milestone checkpoint. */
export interface SentenceCheckpointStats {
  /** Number of completed sentences during this milestone. */
  completedCount: number;
  /** Whether the user has achieved the required sentence completions (e.g. 10). */
  isMastered: boolean;
}

/** Persistent state of the user's Jamo mastery progress. */
export interface MasteryState {
  /** Active application mode ('curriculum' or 'mastery'). */
  mode: TutorMode;
  /** Number of unlocked Jamos from the progression order (starting at 4, max 44). */
  unlockedCount: number;
  /** ID of the currently active sentence milestone checkpoint (if in a sentence stage). */
  activeCheckpointId?: string | null;
  /** Currently active batchim character in post-game Focus mode (e.g. 'ㄺ', 'ㅋ', etc.). */
  activeFocusBatchim?: string | null;
  /** Per-Jamo statistics map keyed by Jamo character. */
  jamoStats: Record<string, JamoStats>;
  /** Per-checkpoint completion stats map keyed by checkpoint ID. */
  sentenceCheckpointStats: Record<string, SentenceCheckpointStats>;
}

/** Metadata for each Jamo in the progression sequence. */
export interface JamoProgressionItem {
  jamo: string;
  key: string;
  shift?: boolean;
  hand: 'left' | 'right';
  stage: number;
  stageName: string;
  combination?: [string, string];
}

/** Definition for an interleaved sentence milestone checkpoint. */
export interface SentenceCheckpoint {
  id: string;
  stage: number;
  stageName: string;
  title: string;
  afterJamoIndex: number;
  requiredCompletions: number;
}

/** Metadata for a final consonant (받침) focus target in the post-game section. */
export interface BatchimFocusItem {
  batchim: string;
  name?: string;
  key: string;
  shift?: boolean;
  hand: 'left' | 'right';
  combination?: [string, string];
}

/** Active target in mastery mode (either a Jamo key, a Sentence Checkpoint, or a Batchim Focus). */
export type MasteryTarget =
  | { type: 'jamo'; item: JamoProgressionItem }
  | { type: 'checkpoint'; checkpoint: SentenceCheckpoint }
  | { type: 'focus'; item: BatchimFocusItem };

/** A grouped stage of the Jamo progression sequence (for sidebar display). */
export interface JamoStageGroup {
  /** Numeric stage identifier (1-based). */
  stageNum: number;
  /** Human-readable stage label shared by all items in the group. */
  stageName: string;
  /** Jamos belonging to this stage, in progression order. */
  items: JamoProgressionItem[];
  /** Optional sentence checkpoint at the end of this stage. */
  checkpoint?: SentenceCheckpoint;
}

/** Result of checking or recording a Jamo attempt. */
export interface MasteryAttemptResult {
  jamo: string;
  isCorrect: boolean;
  accuracy: number;
  attemptsCount: number;
  newlyMastered: boolean;
  newlyUnlockedJamo?: string;
  newlyUnlockedCheckpoint?: string;
}
