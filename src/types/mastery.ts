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
  /** Currently active consolidation mode ('words', 'sentences') or batchim character in post-game Consolidation mode (e.g. 'ㄺ', 'ㅋ', etc.). */
  activeFocusBatchim?: string | null;
  /** Per-Jamo statistics map keyed by Jamo character. */
  jamoStats: Record<string, JamoStats>;
  /** Per-checkpoint completion stats map keyed by checkpoint ID. */
  sentenceCheckpointStats: Record<string, SentenceCheckpointStats>;
}

/** Metadata for each Jamo in the progression sequence. */
export interface JamoProgressionItem {
  readonly jamo: string;
  readonly key: string;
  readonly shift?: boolean;
  readonly hand: 'left' | 'right';
  readonly stage: number;
  readonly stageName: string;
  readonly combination?: readonly [string, string];
}

/** Definition for an interleaved sentence milestone checkpoint. */
export interface SentenceCheckpoint {
  readonly id: string;
  readonly stage: number;
  readonly stageName: string;
  readonly title: string;
  readonly afterJamoIndex: number;
  readonly requiredCompletions: number;
}

/** Metadata for a specific Jamo (vowel, consonant, or batchim) focus target in post-game Consolidation. */
export interface JamoFocusItem {
  readonly jamo: string;
  readonly name?: string;
  readonly key: string;
  readonly shift?: boolean;
  readonly hand: 'left' | 'right';
  readonly combination?: readonly [string, string];
}

/** Metadata for a final consonant (받침) focus target in the post-game section. */
export interface BatchimFocusItem extends JamoFocusItem {
  readonly batchim: string;
}

/** Active target in mastery mode (either a Jamo key, a Sentence Checkpoint, Word/Sentence Consolidation, Vowel/Consonant Focus, or a Batchim Focus). */
export type MasteryTarget =
  | { readonly type: 'jamo'; readonly item: JamoProgressionItem }
  | { readonly type: 'checkpoint'; readonly checkpoint: SentenceCheckpoint }
  | { readonly type: 'consolidation_words' }
  | { readonly type: 'consolidation_sentences' }
  | { readonly type: 'consolidation_vowel'; readonly item: JamoFocusItem }
  | { readonly type: 'consolidation_consonant'; readonly item: JamoFocusItem }
  | { readonly type: 'focus'; readonly item: BatchimFocusItem };

/** A grouped stage of the Jamo progression sequence (for sidebar display). */
export interface JamoStageGroup {
  /** Numeric stage identifier (1-based). */
  readonly stageNum: number;
  /** Human-readable stage label shared by all items in the group. */
  readonly stageName: string;
  /** Jamos belonging to this stage, in progression order. */
  readonly items: readonly JamoProgressionItem[];
  /** Optional sentence checkpoint at the end of this stage. */
  readonly checkpoint?: SentenceCheckpoint;
}

/** Result of checking or recording a Jamo attempt. */
export interface MasteryAttemptResult {
  readonly jamo: string;
  readonly isCorrect: boolean;
  readonly accuracy: number;
  readonly attemptsCount: number;
  readonly newlyMastered: boolean;
  readonly newlyUnlockedJamo?: string;
  readonly newlyUnlockedCheckpoint?: string;
}
