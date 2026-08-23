/** Structured decomposition result for a single Hangul syllable. */
export interface SyllableDecomposition {
  initialConsonant: string;
  vowel: string;
  finalConsonant: string | null;
  raw?: string;
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
  itemCount?: number;
  category?: string;
}

/** Lesson item domain model for practice exercises. */
export interface LessonItem {
  id: string;
  moduleId: string;
  target: string;
  pronunciation?: string | null;
  translation?: string | null;
  attribution?: string | null;
}

/** Structure of the imported content dataset containing modules and lesson items. */
export interface CurriculumData {
  modules: ModuleDefinition[];
  items: LessonItem[];
}
