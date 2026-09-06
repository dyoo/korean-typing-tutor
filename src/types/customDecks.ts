import type { LessonItem } from './korean';

/** A user-imported custom flashcard deck (e.g. from Anki .apkg, TSV, or URL). */
export interface CustomDeck {
  /** Unique identifier for the custom deck module (e.g. "custom_deck_1700000000000"). */
  readonly id: string;
  /** Human-readable title of the deck. */
  readonly title: string;
  /** Original filename or source URL. */
  readonly filename: string;
  /** Number of valid Korean items in this deck. */
  readonly itemCount: number;
  /** Timestamp (ms) when this deck was imported. */
  readonly importedAt: number;
  /** Array of lesson items parsed from the deck. */
  readonly items: readonly LessonItem[];
}
