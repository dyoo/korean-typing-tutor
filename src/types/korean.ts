import type { Brand } from './brand';

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

/**  --- Hangul Unicode Arithmetic Indices ---  */

/** Initial consonant (Choseong) index: 0..18 */
export type InitialConsonantIndex = Brand<number, 'InitialConsonantIndex'>;

/** Vowel (Jungseong) index: 0..20 */
export type VowelIndex = Brand<number, 'VowelIndex'>;

/** Final consonant (Jongseong) index: 0..27 (0 = none) */
export type FinalConsonantIndex = Brand<number, 'FinalConsonantIndex'>;

/** --- Hangul Domain Strings --- */

/** A complete Hangul syllable block in the Unicode range  U+AC00..U+D7A3 (e.g., '한', '글'). */
export type HangulSyllable = Brand<string, 'HangulSyllable'>;
