/**
 * @file masteryPool.ts
 * @description Explicit mastery exercise pool and history navigation container.
 * Decouples heavy O(N) curriculum filtering from per-exercise sampling,
 * and maintains an exercise history stack enabling backward and forward navigation.
 */

import type { LessonItem } from '../types/korean';
import type { MasteryTarget, JamoStats } from '../types/mastery';
import { getEligibleMasteryItems, selectNextMasteryItem } from './jamoMastery';

/** Maximum number of visited exercises preserved in the backward navigation stack. */
const MAX_HISTORY_LENGTH = 100;

export class MasteryPool {
  private eligiblePool: LessonItem[] = [];
  private history: LessonItem[] = [];
  private historyIndex = -1;
  private currentTarget: MasteryTarget | null = null;
  private unlockedKey = '';

  /**
   * Generates a stable string key representing the unlocked Jamo set.
   */
  private getUnlockedKey(unlockedJamos: Set<string>): string {
    return Array.from(unlockedJamos).sort().join('');
  }

  /**
   * Checks whether the current pool already matches the active target and unlocked Jamo set.
   */
  public isPoolValid(activeTarget: MasteryTarget, unlockedJamos: Set<string>): boolean {
    if (this.eligiblePool.length === 0 || !this.currentTarget) {
      return false;
    }
    if (this.unlockedKey !== this.getUnlockedKey(unlockedJamos)) {
      return false;
    }

    if (this.currentTarget.type !== activeTarget.type) {
      return false;
    }

    if (this.currentTarget.type === 'jamo' && activeTarget.type === 'jamo') {
      return this.currentTarget.item.jamo === activeTarget.item.jamo;
    }

    if (this.currentTarget.type === 'checkpoint' && activeTarget.type === 'checkpoint') {
      return this.currentTarget.checkpoint.id === activeTarget.checkpoint.id;
    }

    if (this.currentTarget.type === 'focus' && activeTarget.type === 'focus') {
      return this.currentTarget.item.batchim === activeTarget.item.batchim;
    }

    if (
      (this.currentTarget.type === 'consolidation_vowel' &&
        activeTarget.type === 'consolidation_vowel') ||
      (this.currentTarget.type === 'consolidation_consonant' &&
        activeTarget.type === 'consolidation_consonant')
    ) {
      return this.currentTarget.item.jamo === activeTarget.item.jamo;
    }

    return true;
  }

  /**
   * Explicitly rebuilds the eligible candidate pool from the full curriculum.
   * Invoked ONLY on stage/milestone progression transitions, manual level jumps, or deck imports.
   * Generates and returns the initial exercise item for the newly built pool.
   */
  public rebuild(
    allItems: LessonItem[],
    unlockedJamos: Set<string>,
    activeTarget: MasteryTarget,
    jamoStats?: Record<string, JamoStats>,
  ): LessonItem {
    this.currentTarget = activeTarget;
    this.unlockedKey = this.getUnlockedKey(unlockedJamos);
    this.eligiblePool = getEligibleMasteryItems(allItems, unlockedJamos, activeTarget);
    this.history = [];
    this.historyIndex = -1;

    // Sample initial item for this pool
    const initialItem = selectNextMasteryItem(
      this.eligiblePool,
      this.currentTarget,
      jamoStats ?? {},
    );

    this.history.push(initialItem);
    this.historyIndex = 0;
    return initialItem;
  }

  /**
   * Advances to the next exercise.
   * If the user previously navigated backwards, advances forward along the existing history path.
   * Otherwise, samples a new candidate from the eligible pool and appends it to history.
   */
  public next(jamoStats?: Record<string, JamoStats>, excludeId?: string): LessonItem {
    // If we are currently navigating behind the forward edge of history, move forward
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      return this.history[this.historyIndex];
    }

    // Sample new exercise from the already-filtered pool
    const nextItem = selectNextMasteryItem(
      this.eligiblePool,
      this.currentTarget,
      jamoStats ?? {},
      excludeId,
    );

    this.history.push(nextItem);
    if (this.history.length > MAX_HISTORY_LENGTH) {
      this.history.shift();
    }
    this.historyIndex = this.history.length - 1;

    return nextItem;
  }

  /**
   * Navigates backwards to the previous exercise in history.
   * Returns null if already at the beginning of the history stack.
   */
  public previous(): LessonItem | null {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      return this.history[this.historyIndex];
    }
    return null;
  }

  /** Returns true if a previous exercise exists in the history stack. */
  public canGoBack(): boolean {
    return this.historyIndex > 0;
  }

  /** Returns true if a future exercise exists ahead in the history stack. */
  public canGoForward(): boolean {
    return this.historyIndex < this.history.length - 1;
  }

  /** Returns the current active exercise item in the pool. */
  public getCurrent(): LessonItem | null {
    return this.history[this.historyIndex] ?? null;
  }

  /** Returns the entire filtered candidate pool for the active target. */
  public getPool(): LessonItem[] {
    return this.eligiblePool;
  }

  /** Returns the current history stack. */
  public getHistory(): LessonItem[] {
    return [...this.history];
  }

  /** Returns the current pointer index within the history stack. */
  public getHistoryIndex(): number {
    return this.historyIndex;
  }
}
