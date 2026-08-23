import type { LessonItem } from './korean';

/** A user-imported custom flashcard deck (e.g. from Anki .apkg, TSV, or URL). */
export interface CustomDeck {
  /** Unique identifier for the custom deck module (e.g. "custom_deck_1700000000000"). */
  id: string;
  /** Human-readable title of the deck. */
  title: string;
  /** Original filename or source URL. */
  filename: string;
  /** Number of valid Korean items in this deck. */
  itemCount: number;
  /** Timestamp (ms) when this deck was imported. */
  importedAt: number;
  /** Array of lesson items parsed from the deck. */
  items: LessonItem[];
}
