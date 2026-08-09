import { HangulEngine, checkErrors } from '../utils/koreanEngine';
import type { ErrorReport, LessonItem } from '../types/korean';

/** Supported level filter types for targeted practice. */
export type LevelFilter = 'all' | 'l1' | 'l2' | 'l3' | 'l4';

/** Result object returned when a keystroke is processed by the TutorSession controller. */
export interface KeyResult {
  isMatch: boolean;
  isItemCompleted: boolean;
  isTutorialComplete: boolean;
  advanced: boolean;
}

/**
 * TutorSession Controller.
 * Decouples session state management, lesson tracking, level filtering,
 * randomized item shuffling, and keystroke composition routing from the UI.
 */
export class TutorSession {
  private allItems: LessonItem[];
  private activeItems: LessonItem[] = [];
  private selectedFilter: LevelFilter = 'all';
  private shouldShuffle: boolean;
  private currentIndex = 0;
  private userInput = '';
  private errors: ErrorReport[] = [];
  private accuracy = 100;
  private isItemCompleted = false;
  private engine: HangulEngine;

  constructor(items: LessonItem[], defaultFilter: LevelFilter = 'all', shuffle = true) {
    this.allItems = items;
    this.selectedFilter = defaultFilter;
    this.shouldShuffle = shuffle;
    this.engine = new HangulEngine();
    this.applyFilterAndShuffle();
  }

  /**
   * Fisher-Yates array shuffling algorithm.
   * Ensures practice items are presented in randomized order.
   */
  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = arr[i];
      const target = arr[j];
      if (temp !== undefined && target !== undefined) {
        arr[i] = target;
        arr[j] = temp;
      }
    }
    return arr;
  }

  /**
   * Filters all curriculum items by selected module level and shuffles order.
   */
  private applyFilterAndShuffle(): void {
    let filtered: LessonItem[];

    if (this.selectedFilter === 'all') {
      filtered = [...this.allItems];
    } else {
      filtered = this.allItems.filter(item => item.id.startsWith(this.selectedFilter));
    }

    if (filtered.length === 0) {
      filtered = [...this.allItems];
    }

    this.activeItems = this.shouldShuffle ? this.shuffle(filtered) : filtered;
    this.resetSessionState();
  }

  /** Sets the active level filter module and reshuffles lessons. */
  public setFilter(filter: LevelFilter, shuffle = true): void {
    this.selectedFilter = filter;
    this.shouldShuffle = shuffle;
    this.applyFilterAndShuffle();
  }

  /** Returns current active filter mode. */
  public getFilter(): LevelFilter {
    return this.selectedFilter;
  }

  /** Returns current target lesson item. */
  public getCurrentItem(): LessonItem {
    return this.activeItems[this.currentIndex] ?? this.allItems[0];
  }

  /** Returns 0-indexed position in active lesson module. */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /** Returns total items in current active module. */
  public getTotalItems(): number {
    return this.activeItems.length;
  }

  /** Returns current composed Hangul input string. */
  public getUserInput(): string {
    return this.userInput;
  }

  /** Returns error flags for each character index. */
  public getErrors(): ErrorReport[] {
    return this.errors;
  }

  /** Returns accuracy percentage (0-100%). */
  public getAccuracy(): number {
    return this.accuracy;
  }

  /** Returns whether current item is completed. */
  public getIsItemCompleted(): boolean {
    return this.isItemCompleted;
  }

  /** Returns module progress percentage (0-100%). */
  public getProgressPercentage(): number {
    if (this.activeItems.length === 0) return 0;
    return Math.round(((this.currentIndex + 1) / this.activeItems.length) * 100);
  }

  /**
   * Formats combined Romanization and English translation text.
   * Example: 'sagwa · apple' or 'ga'.
   */
  public getDisplayText(item = this.getCurrentItem()): string {
    if (!item) return '';
    const parts: string[] = [];
    if (item.pronunciation) {
      parts.push(item.pronunciation);
    }
    if (item.translation) {
      parts.push(item.translation);
    }
    return parts.join(' · ');
  }

  /**
   * Processes single keyboard input.
   * Handles Hangul composition, manual Enter/Space progression, and Backspace decomposition.
   */
  public processKey(key: string): KeyResult {
    if (key === 'Tab' || key === 'Escape') {
      return { isMatch: false, isItemCompleted: this.isItemCompleted, isTutorialComplete: false, advanced: false };
    }

    if (this.isItemCompleted) {
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        const isTutorialComplete = this.advanceLevel();
        return { isMatch: true, isItemCompleted: false, isTutorialComplete, advanced: true };
      }
      if (key === 'Backspace') {
        this.userInput = this.engine.handleKey('Backspace');
        const currentTarget = this.getCurrentItem().target;
        this.errors = checkErrors(currentTarget, this.userInput);
        this.isItemCompleted = (this.userInput === currentTarget);
        const correctChars = this.errors.filter(err => !err.isError).length;
        this.accuracy = this.userInput.length > 0 ? Math.round((correctChars / this.userInput.length) * 100) : 100;
        return { isMatch: this.isItemCompleted, isItemCompleted: this.isItemCompleted, isTutorialComplete: false, advanced: false };
      }
      return { isMatch: false, isItemCompleted: true, isTutorialComplete: false, advanced: false };
    }

    if (key === 'Backspace' || key.length === 1) {
      this.userInput = this.engine.handleKey(key);
      const currentTarget = this.getCurrentItem().target;
      this.errors = checkErrors(currentTarget, this.userInput);

      const correctChars = this.errors.filter(err => !err.isError).length;
      this.accuracy = this.userInput.length > 0 ? Math.round((correctChars / this.userInput.length) * 100) : 100;

      if (this.userInput === currentTarget) {
        this.isItemCompleted = true;
        return { isMatch: true, isItemCompleted: true, isTutorialComplete: false, advanced: false };
      }
    }

    return { isMatch: false, isItemCompleted: false, isTutorialComplete: false, advanced: false };
  }

  /**
   * Resets composition state and advances to next item.
   * Reshuffles items when wrapping back to beginning upon completion.
   */
  public advanceLevel(): boolean {
    this.engine.reset();
    this.userInput = '';
    this.errors = [];
    this.isItemCompleted = false;

    if (this.currentIndex < this.activeItems.length - 1) {
      this.currentIndex++;
      return false;
    } else {
      this.currentIndex = 0;
      if (this.shouldShuffle) {
        this.activeItems = this.shuffle(this.activeItems);
      }
      return true;
    }
  }

  /** Resets state back to initial level position. */
  private resetSessionState(): void {
    this.engine.reset();
    this.currentIndex = 0;
    this.userInput = '';
    this.errors = [];
    this.accuracy = 100;
    this.isItemCompleted = false;
  }

  /** Resets session and reshuffles items. */
  public resetSession(): void {
    if (this.shouldShuffle) {
      this.activeItems = this.shuffle(this.activeItems);
    }
    this.resetSessionState();
  }
}
