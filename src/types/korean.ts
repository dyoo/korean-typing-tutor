import type { Brand } from './brand';

/** Structured decomposition result for a single Hangul syllable. */
export interface SyllableDecomposition {
  readonly initialConsonant: string;
  readonly vowel: string;
  readonly finalConsonant: string | null;
  readonly raw?: string;
}

/** Error report entry for character mismatch tracking. */
export interface ErrorReport {
  readonly index: number;
  readonly isError: boolean;
}

/** Module definition metadata for practice levels. */
export interface ModuleDefinition {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly itemCount?: number;
  readonly category?: string;
}

/** Lesson item domain model for practice exercises. */
export interface LessonItem {
  readonly id: string;
  readonly moduleId: string;
  readonly target: string;
  readonly pronunciation?: string | null;
  readonly translation?: string | null;
  readonly attribution?: string | null;
}

/** Structure of the imported content dataset containing modules and lesson items. */
export interface CurriculumData {
  readonly modules: readonly ModuleDefinition[];
  readonly items: readonly LessonItem[];
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
