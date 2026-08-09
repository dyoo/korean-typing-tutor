import { HangulEngine, checkErrors } from '../utils/koreanEngine';
import type { ErrorReport, LessonItem } from '../types/korean';

export interface KeyResult {
  isMatch: boolean;
  isItemCompleted: boolean;
  isTutorialComplete: boolean;
  advanced: boolean;
}

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

  public getCurrentItem(): LessonItem {
    return this.items[this.currentIndex];
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  public getTotalItems(): number {
    return this.items.length;
  }

  public getUserInput(): string {
    return this.userInput;
  }

  public getErrors(): ErrorReport[] {
    return this.errors;
  }

  public getAccuracy(): number {
    return this.accuracy;
  }

  public getIsItemCompleted(): boolean {
    return this.isItemCompleted;
  }

  public getProgressPercentage(): number {
    if (this.items.length === 0) return 0;
    return Math.round(((this.currentIndex + 1) / this.items.length) * 100);
  }

  public processKey(key: string): KeyResult {
    if (key === 'Tab' || key === 'Escape') {
      return { isMatch: false, isItemCompleted: this.isItemCompleted, isTutorialComplete: false, advanced: false };
    }

    if (this.isItemCompleted) {
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        const isTutorialComplete = this.advanceLevel();
        return { isMatch: true, isItemCompleted: false, isTutorialComplete, advanced: true };
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

  public resetSession(): void {
    this.engine.reset();
    this.currentIndex = 0;
    this.userInput = '';
    this.errors = [];
    this.accuracy = 100;
    this.isItemCompleted = false;
  }
}
