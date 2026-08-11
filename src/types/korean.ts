/** Types of Jamo components in a Hangul syllable block. */
export type JamoType = 'choseong' | 'jungseong' | 'jongseong';

/** Mapping definition for QWERTY keys to Hangul Jamo. */
export interface JamoMapping {
  key: string;
  jamo: string;
  type: JamoType;
}

/** State container for active Hangul syllable composition. */
export interface CompositionState {
  chosung: string | null;
  jungseong: string | null;
  jongseong: string | null;
}

/** Error report entry for character mismatch tracking. */
export interface ErrorReport {
  index: number;
  isError: boolean;
}

/** Module definition metadata for practice levels. */
export interface ModuleDefinition {
  id: string;
  title: string;
  description: string;
}

/** Lesson item domain model for practice exercises. */
export interface LessonItem {
  id: string;
  moduleId: string;
  type: 'syllable' | 'word' | 'sentence';
  target: string;
  pronunciation?: string | null;
  translation?: string | null;
}
