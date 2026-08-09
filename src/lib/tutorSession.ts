import { HangulEngine, checkErrors } from '../utils/koreanEngine';
import type { ErrorReport, LessonItem } from '../types/korean';

/** Result object returned when a keystroke is processed by the TutorSession controller. */
export interface KeyResult {
  isMatch: boolean;
  isItemCompleted: boolean;
  isTutorialComplete: boolean;
  advanced: boolean;
}

/**
 * TutorSession Controller.
 * Decouples session state management, lesson tracking, keystroke routing,
 * and level progression from the Svelte UI view component.
 */
export class TutorSession {
  private items: LessonItem[];
  private currentIndex = 0;
  private userInput = '';
  private errors: ErrorReport[] = [];
  private accuracy = 100;
  private isItemCompleted = false;
  private engine: HangulEngine;

  constructor(items: LessonItem[]) {
    this.items = items;
    this.engine = new HangulEngine();
  }

  /** Returns the current target lesson item. */
  public getCurrentItem(): LessonItem {
    return this.items[this.currentIndex];
  }

  /** Returns the 0-indexed position of the current lesson item. */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /** Returns the total number of items in the current curriculum module. */
  public getTotalItems(): number {
    return this.items.length;
  }

  /** Returns the composed Hangul string typed so far by the user. */
  public getUserInput(): string {
    return this.userInput;
  }

  /** Returns error flags for each character position. */
  public getErrors(): ErrorReport[] {
    return this.errors;
  }

  /** Returns calculated accuracy percentage (0-100%). */
  public getAccuracy(): number {
    return this.accuracy;
  }

  /** Returns whether the current target item has been successfully completed. */
  public getIsItemCompleted(): boolean {
    return this.isItemCompleted;
  }

  /** Returns current lesson completion progress percentage (0-100%). */
  public getProgressPercentage(): number {
    if (this.items.length === 0) return 0;
    return Math.round(((this.currentIndex + 1) / this.items.length) * 100);
  }

  /**
   * Processes a single keyboard input.
   * Handles Hangul composition, completion detection, manual level advancement (Enter/Space),
   * and backspace decomposition even after item completion.
   */
  public processKey(key: string): KeyResult {
    if (key === 'Tab' || key === 'Escape') {
      return { isMatch: false, isItemCompleted: this.isItemCompleted, isTutorialComplete: false, advanced: false };
    }

    // --- State: Word is already completed ---
    if (this.isItemCompleted) {
      // Enter or Space deliberate action advances to next level
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        const isTutorialComplete = this.advanceLevel();
        return { isMatch: true, isItemCompleted: false, isTutorialComplete, advanced: true };
      }
      // Backspace allows user to decompose completed word and re-type for practice
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

    // --- State: In-progress typing ---
    if (key === 'Backspace' || key.length === 1) {
      this.userInput = this.engine.handleKey(key);
      const currentTarget = this.getCurrentItem().target;
      this.errors = checkErrors(currentTarget, this.userInput);

      const correctChars = this.errors.filter(err => !err.isError).length;
      this.accuracy = this.userInput.length > 0 ? Math.round((correctChars / this.userInput.length) * 100) : 100;

      // Check if user input matches target word
      if (this.userInput === currentTarget) {
        this.isItemCompleted = true;
        return { isMatch: true, isItemCompleted: true, isTutorialComplete: false, advanced: false };
      }
    }

    return { isMatch: false, isItemCompleted: false, isTutorialComplete: false, advanced: false };
  }

  /**
   * Resets composition state and advances to the next lesson item.
   * Returns true if the entire curriculum module has been completed.
   */
  public advanceLevel(): boolean {
    this.engine.reset();
    this.userInput = '';
    this.errors = [];
    this.isItemCompleted = false;

    if (this.currentIndex < this.items.length - 1) {
      this.currentIndex++;
      return false;
    } else {
      this.currentIndex = 0;
      return true;
    }
  }

  /**
   * Resets the session back to Level 1.
   */
  public resetSession(): void {
    this.engine.reset();
    this.currentIndex = 0;
    this.userInput = '';
    this.errors = [];
    this.accuracy = 100;
    this.isItemCompleted = false;
  }
}
