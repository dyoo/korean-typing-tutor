import { HangulEngine, checkErrors } from '../utils/koreanEngine';
import { getPronunciation } from '../utils/romanizer';
import type { ErrorReport, LessonItem, ModuleDefinition } from '../types/korean';

/** Structure of the imported content dataset containing modules and lesson items. */
export interface CurriculumData {
  modules: ModuleDefinition[];
  items: LessonItem[];
}

/** Result object returned when a keystroke is processed by the TutorSession controller. */
export interface KeyResult {
  isMatch: boolean;
  isItemCompleted: boolean;
  isTutorialComplete: boolean;
  advanced: boolean;
}

/**
 * TutorSession Controller.
 * Decouples session state management, curriculum module tracking,
 * randomized item shuffling, and keystroke composition routing from the UI.
 */
export class TutorSession {
  private allItems: LessonItem[];
  private modules: ModuleDefinition[];
  private activeItems: LessonItem[] = [];
  private selectedFilter: string | string[] = 'all';
  private shouldShuffle: boolean;
  private currentIndex = 0;
  private userInput = '';
  private errors: ErrorReport[] = [];
  private accuracy = 100;
  private isItemCompleted = false;
  private engine: HangulEngine;

  constructor(data: CurriculumData | LessonItem[], defaultFilter: string | string[] = 'all', shuffle = true) {
    if (Array.isArray(data)) {
      this.allItems = data;
      this.modules = [
        { id: 'all', title: 'All Lessons', description: 'Comprehensive practice across all modules' }
      ];
    } else {
      this.allItems = data.items ?? [];
      this.modules = data.modules ?? [];
    }

    this.selectedFilter = defaultFilter;
    this.shouldShuffle = shuffle;
    this.engine = new HangulEngine();
    this.applyFilterAndShuffle();
  }

  /** Fisher-Yates shuffle algorithm for randomized practice order. */
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

  /** Filters items by active module ID(s) and applies shuffling. */
  private applyFilterAndShuffle(): void {
    let filtered: LessonItem[];

    if (Array.isArray(this.selectedFilter)) {
      if (this.selectedFilter.includes('all')) {
        filtered = [...this.allItems];
      } else if (this.selectedFilter.length === 0) {
        filtered = [];
      } else {
        const allowedSet = new Set(this.selectedFilter);
        filtered = this.allItems.filter(item => allowedSet.has(item.moduleId));
      }
    } else if (this.selectedFilter === 'all') {
      filtered = [...this.allItems];
    } else {
      filtered = this.allItems.filter(item => item.moduleId === this.selectedFilter || item.id.startsWith(this.selectedFilter as string));
    }

    this.activeItems = this.shouldShuffle ? this.shuffle(filtered) : filtered;
    this.resetSessionState();
  }

  /** Updates active module filter and reshuffles items. */
  public setFilter(filterId: string | string[], shuffle = true): void {
    this.selectedFilter = filterId;
    this.shouldShuffle = shuffle;
    this.applyFilterAndShuffle();
  }

  /** Returns active filter module ID or array of IDs. */
  public getFilter(): string | string[] {
    return this.selectedFilter;
  }

  /** Returns active filter module ID or array of IDs. */
  public getSelectedFilter(): string | string[] {
    return this.selectedFilter;
  }

  /** Returns all available module definitions. */
  public getModules(): ModuleDefinition[] {
    return this.modules;
  }

  /** Returns total items count in active module. */
  public getTotalItems(): number {
    return this.activeItems.length;
  }

  /** Returns current item index (0-indexed). */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /** Returns currently active lesson item. */
  public getCurrentItem(): LessonItem {
    if (this.activeItems.length === 0) {
      return {
        id: 'empty',
        moduleId: '',
        type: 'word',
        target: '',
        pronunciation: '',
        translation: 'No modules selected. Please select at least one module in the menu.'
      };
    }
    return this.activeItems[this.currentIndex] ?? {
      id: 'fallback',
      moduleId: 'all',
      type: 'syllable',
      target: '가',
      pronunciation: 'ga',
      translation: null
    };
  }

  /** Returns composed user input string. */
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

  /** Formats combined Romanization and English translation text based on active settings. */
  public getDisplayText(item = this.getCurrentItem(), options?: { showPronunciation?: boolean; showTranslation?: boolean }): string {
    if (!item) return '';
    const showPron = options?.showPronunciation ?? true;
    const showTrans = options?.showTranslation ?? true;
    const parts: string[] = [];
    const pron = getPronunciation(item);
    if (showPron && pron) {
      parts.push(pron);
    }
    if (showTrans && item.translation) {
      parts.push(item.translation);
    }
    return parts.join(' · ');
  }

  /** Processes single keyboard input. */
  public processKey(key: string): KeyResult {
    if (key === 'Tab' || key === 'Escape' || this.activeItems.length === 0) {
      return { isMatch: false, isItemCompleted: false, isTutorialComplete: false, advanced: false };
    }

    const currentTarget = this.getCurrentItem().target;

    if (this.isItemCompleted) {
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        const isTutorialComplete = this.advanceLevel();
        return { isMatch: true, isItemCompleted: false, isTutorialComplete, advanced: true };
      }
      if (key === 'Backspace') {
        this.userInput = this.engine.handleKey('Backspace');
        this.errors = checkErrors(currentTarget, this.userInput);
        this.isItemCompleted = (currentTarget.length > 0 && this.userInput === currentTarget);
        const correctChars = this.errors.filter(err => !err.isError).length;
        this.accuracy = this.userInput.length > 0 ? Math.round((correctChars / this.userInput.length) * 100) : 100;
        return { isMatch: this.isItemCompleted, isItemCompleted: this.isItemCompleted, isTutorialComplete: false, advanced: false };
      }
      return { isMatch: false, isItemCompleted: true, isTutorialComplete: false, advanced: false };
    }

    if (key === 'Backspace' || key.length === 1) {
      this.userInput = this.engine.handleKey(key);
      this.errors = checkErrors(currentTarget, this.userInput);

      const correctChars = this.errors.filter(err => !err.isError).length;
      this.accuracy = this.userInput.length > 0 ? Math.round((correctChars / this.userInput.length) * 100) : 100;

      if (currentTarget.length > 0 && this.userInput === currentTarget) {
        this.isItemCompleted = true;
        return { isMatch: true, isItemCompleted: true, isTutorialComplete: false, advanced: false };
      }
    }

    return { isMatch: false, isItemCompleted: false, isTutorialComplete: false, advanced: false };
  }

  /** Advances to next item in module and reshuffles when cycling back. */
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
