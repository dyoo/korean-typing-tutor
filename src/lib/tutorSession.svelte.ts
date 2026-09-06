import { SvelteSet } from 'svelte/reactivity';
import { HangulEngine } from '../utils/hangulEngine';
import { checkErrors } from '../utils/hangulMatch';
import { getPronunciation } from '../utils/romanizer';
import {
  loadMasteryState,
  saveMasteryState,
  createDefaultMasteryState,
  getUnlockedJamos,
  getActiveLearningJamo,
  getActiveCheckpointForState,
  getActiveMasteryTarget,
  recordSentenceCompletion,
  setMasteryProgressionLevel,
  setMasteryCheckpointLevel,
  setMasteryFocusBatchim,
  JAMO_PROGRESSION_ORDER,
  commitExerciseMasteryAttempts,
} from '../utils/jamoMastery';
import { MasteryPool } from '../utils/masteryPool';
import { decomposeStringToJamos } from '../utils/hangulDecompose';
import {
  loadCustomDecks,
  saveCustomDeck,
  deleteCustomDeck,
  getLoadedCustomDecks,
} from '../utils/customDecks';
import {
  loadSpeedMetricsStore,
  resetSpeedMetricsStore,
  ExerciseSpeedTracker,
  getJamoKpmStats,
  getCategoryKpmStats,
} from '../utils/speedTracker';
import type { SpeedMetricsStore } from '../utils/speedTracker';
import type { CurriculumData, ErrorReport, LessonItem, ModuleDefinition } from '../types/korean';
import type {
  TutorMode,
  MasteryState,
  JamoProgressionItem,
  SentenceCheckpoint,
  MasteryTarget,
} from '../types/mastery';
import type { CustomDeck } from '../types/customDecks';
import type { DeepReadonly } from '../types/readonly';

export type { CurriculumData };

/** Result object returned when a keystroke is processed by the TutorSession controller. */
interface KeyResult {
  readonly isMatch: boolean;
  readonly isItemCompleted: boolean;
  readonly isTutorialComplete: boolean;
  readonly advanced: boolean;
  readonly newlyUnlockedJamo?: string;
}

/**
 * TutorSession Controller.
 * Decouples session state management, curriculum module tracking,
 * randomized item shuffling, and keystroke composition routing from the UI.
 */
export class TutorSession {
  private baseItems: DeepReadonly<LessonItem[]>;
  private baseModules: DeepReadonly<ModuleDefinition[]>;
  private allItems: DeepReadonly<LessonItem[]> = $state.raw([]);
  private modules: DeepReadonly<ModuleDefinition[]> = $state.raw([]);
  private customDecks: DeepReadonly<CustomDeck[]> = $state.raw(getLoadedCustomDecks());
  private activeItems: DeepReadonly<LessonItem[]> = $state.raw([]);
  private currentIndex = $state(0);
  private selectedFilter: string | readonly string[] = $state('all');
  private shouldShuffle = $state(true);

  private userInput = $state('');
  private inputCursorIndex = $state(0);
  private suffix = $state('');
  private errors: DeepReadonly<ErrorReport[]> = $state.raw([]);
  private accuracy = $state(100);
  private isItemCompleted = $state(false);
  private cachedTarget: string | null = null;
  private currentTargetJamos: DeepReadonly<string[]> = $state.raw([]);
  private engine: HangulEngine;

  private mode: TutorMode = $state('mastery');
  private masteryState: MasteryState = $state(loadMasteryState());
  private speedStore: SpeedMetricsStore = $state(loadSpeedMetricsStore());
  private speedTracker = new ExerciseSpeedTracker();
  private masteryPool = new MasteryPool();
  private isMasteryGraduationPending: boolean = $state(false);
  private currentTargetType: MasteryTarget['type'] = 'jamo';
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private promptSlotErrors = new SvelteSet<number>();

  constructor(
    data: CurriculumData | readonly LessonItem[],
    defaultFilter: string | readonly string[] = 'all',
    shuffle = true,
  ) {
    if ('items' in data) {
      this.baseItems = data.items ?? [];
      this.baseModules = data.modules ?? [];
    } else {
      this.baseItems = data;
      this.baseModules = [
        {
          id: 'all',
          title: 'All Lessons',
          description: 'Comprehensive practice across all modules',
        },
      ];
    }

    this.rebuildModulesAndItems();
    this.selectedFilter = defaultFilter;
    this.shouldShuffle = shuffle;
    this.engine = new HangulEngine();
    this.mode = this.masteryState.mode ?? 'mastery';
    this.applyFilterAndShuffle();
  }

  /** Rebuilds effective modules and allItems by combining built-in curriculum with user custom decks. */
  private rebuildModulesAndItems(): void {
    const customModules: ModuleDefinition[] = this.customDecks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      description: `${deck.itemCount} flashcard items imported from ${deck.filename}`,
      itemCount: deck.itemCount,
      category: 'custom',
    }));
    this.modules = [...this.baseModules, ...customModules];

    const customItems: LessonItem[] = this.customDecks.flatMap((deck) => deck.items);
    this.allItems = [...this.baseItems, ...customItems];
  }

  /** Fisher-Yates shuffle algorithm for randomized practice order. */
  private shuffle<T>(array: readonly T[]): T[] {
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

  /** Explicitly rebuilds the candidate pool from allItems when stage, milestone, or custom decks change. */
  private refreshMasteryPool(): void {
    const unlocked = getUnlockedJamos(this.masteryState);
    const activeTarget = getActiveMasteryTarget(this.masteryState);
    this.currentTargetType = activeTarget.type;
    const initialItem = this.masteryPool.rebuild(
      this.allItems,
      unlocked,
      activeTarget,
      this.masteryState.jamoStats,
    );
    this.activeItems = this.masteryPool.getPool();
    const idx = this.activeItems.findIndex((i) => i.id === initialItem.id);
    this.currentIndex = idx >= 0 ? idx : 0;
  }

  /** Samples next exercise from the already-filtered pool in O(1) time without rescanning allItems. */
  private selectNextMasteryExercise(excludeItemId?: string): void {
    const unlocked = getUnlockedJamos(this.masteryState);
    const activeTarget = getActiveMasteryTarget(this.masteryState);
    this.currentTargetType = activeTarget.type;

    if (!this.masteryPool.isPoolValid(activeTarget, unlocked)) {
      this.refreshMasteryPool();
      return;
    }

    const nextItem = this.masteryPool.next(this.masteryState.jamoStats, excludeItemId);
    this.activeItems = this.masteryPool.getPool();
    const nextIndex = this.activeItems.findIndex((i) => i.id === nextItem.id);
    this.currentIndex = nextIndex >= 0 ? nextIndex : 0;
  }

  /** Filters items by active mode / module ID(s) and applies shuffling. */
  private applyFilterAndShuffle(): void {
    if (this.mode === 'mastery') {
      this.refreshMasteryPool();
    } else {
      let filtered: LessonItem[];
      if (typeof this.selectedFilter === 'string') {
        if (this.selectedFilter === 'all') {
          filtered = [...this.allItems];
        } else {
          const filter = this.selectedFilter;
          filtered = this.allItems.filter(
            (item) => item.moduleId === filter || item.id.startsWith(filter),
          );
        }
      } else {
        if (this.selectedFilter.includes('all')) {
          filtered = [...this.allItems];
        } else if (this.selectedFilter.length === 0) {
          filtered = [];
        } else {
          const allowedSet = new Set(this.selectedFilter); // eslint-disable-line svelte/prefer-svelte-reactivity
          filtered = this.allItems.filter((item) => allowedSet.has(item.moduleId));
        }
      }

      this.activeItems = this.shouldShuffle ? this.shuffle(filtered) : filtered;
      this.currentIndex = 0;
    }

    this.resetSessionState();
  }

  /** Returns active application mode ('curriculum' or 'mastery'). */
  public getMode(): TutorMode {
    return this.mode;
  }

  /** Cancels any scheduled debounced save timer. */
  private cancelScheduledSave(): void {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
  }

  /** Sets active application mode and refreshes item queue. */
  public setMode(mode: TutorMode): void {
    this.cancelScheduledSave();
    this.mode = mode;
    this.masteryState.mode = mode;
    saveMasteryState(this.masteryState);
    this.applyFilterAndShuffle();
  }

  /** Returns the current user mastery state. */
  public getMasteryState(): MasteryState {
    return this.masteryState;
  }

  /** Returns set of unlocked Jamos in mastery mode. */
  public getUnlockedJamos(): ReadonlySet<string> {
    return getUnlockedJamos(this.masteryState);
  }

  /** Returns the active learning Jamo in mastery mode. */
  public getActiveLearningJamo(): JamoProgressionItem | null {
    return getActiveLearningJamo(this.masteryState);
  }

  /** Returns the active mastery target (Jamo key or Sentence Checkpoint). */
  public getActiveMasteryTarget(): MasteryTarget {
    return getActiveMasteryTarget(this.masteryState);
  }

  /** Returns the active sentence checkpoint if currently in a sentence stage. */
  public getActiveCheckpoint(): SentenceCheckpoint | null {
    return getActiveCheckpointForState(this.masteryState);
  }

  /** Resets user mastery progress back to default Stage 1 keys. */
  public resetMasteryProgress(): void {
    this.cancelScheduledSave();
    this.masteryState = createDefaultMasteryState();
    this.masteryState.mode = this.mode;
    saveMasteryState(this.masteryState);
    this.applyFilterAndShuffle();
  }

  /** Manually sets the mastery progression level (unlocked count). */
  public setMasteryProgressionLevel(level: number): void {
    this.cancelScheduledSave();
    setMasteryProgressionLevel(this.masteryState, level, true);
    saveMasteryState(this.masteryState);
    this.applyFilterAndShuffle();
  }

  /** Manually jumps to a specific sentence checkpoint. */
  public setMasteryCheckpointLevel(checkpointId: string): void {
    this.cancelScheduledSave();
    setMasteryCheckpointLevel(this.masteryState, checkpointId);
    saveMasteryState(this.masteryState);
    this.applyFilterAndShuffle();
  }

  /** Manually focuses practice on words, sentences, or a specific final consonant (받침) in post-game Consolidation mode. */
  public setMasteryFocusBatchim(target: string): void {
    this.cancelScheduledSave();
    setMasteryFocusBatchim(this.masteryState, target);
    saveMasteryState(this.masteryState);
    this.applyFilterAndShuffle();
  }

  /** Manually focuses practice on a consolidation target in post-game mode. */
  public setMasteryConsolidationTarget(target: string): void {
    this.setMasteryFocusBatchim(target);
  }

  /** Manually unlocks the next Jamo in the progression sequence. */
  public unlockNextJamoManually(): string | undefined {
    if (this.masteryState.unlockedCount < JAMO_PROGRESSION_ORDER.length) {
      this.cancelScheduledSave();
      const nextIndex = this.masteryState.unlockedCount;
      this.masteryState.unlockedCount += 1;
      const nextJamo = JAMO_PROGRESSION_ORDER[nextIndex].jamo;
      saveMasteryState(this.masteryState);
      this.applyFilterAndShuffle();
      return nextJamo;
    }
    return undefined;
  }

  /** Updates active module filter and reshuffles items. */
  public setFilter(filterId: string | readonly string[], shuffle = true): void {
    this.selectedFilter = filterId;
    this.shouldShuffle = shuffle;
    this.applyFilterAndShuffle();
  }

  /** Returns active filter module ID or array of IDs. */
  public getSelectedFilter(): string | readonly string[] {
    return this.selectedFilter;
  }

  /** Returns all available module definitions. */
  public getModules(): DeepReadonly<ModuleDefinition[]> {
    return this.modules;
  }

  /** Returns all user-imported custom flashcard decks. */
  public getCustomDecks(): DeepReadonly<CustomDeck[]> {
    return this.customDecks;
  }

  /**
   * Asynchronously hydrates custom decks from IndexedDB (or fallback).
   * Rebuilds modules and allItems upon completion.
   */
  public async initCustomDecks(): Promise<DeepReadonly<CustomDeck[]>> {
    this.customDecks = await loadCustomDecks();
    this.rebuildModulesAndItems();
    return this.customDecks;
  }

  /** Registers and persists a newly imported custom deck. */
  public async addCustomDeck(deck: CustomDeck): Promise<void> {
    const existingIndex = this.customDecks.findIndex((d) => d.id === deck.id);
    if (existingIndex >= 0) {
      this.customDecks = this.customDecks.map((d, i) => (i === existingIndex ? deck : d));
    } else {
      this.customDecks = [...this.customDecks, deck];
    }
    this.rebuildModulesAndItems();
    if (typeof this.selectedFilter !== 'string') {
      if (!this.selectedFilter.includes(deck.id)) {
        this.selectedFilter = [...this.selectedFilter, deck.id];
      }
    } else if (this.selectedFilter !== 'all') {
      this.selectedFilter = [this.selectedFilter, deck.id];
    }
    this.applyFilterAndShuffle();
    this.resetSessionState();
    await saveCustomDeck(deck);
  }

  /** Deletes a custom deck by ID from storage and session. */
  public async removeCustomDeck(deckId: string): Promise<void> {
    this.customDecks = this.customDecks.filter((d) => d.id !== deckId);
    this.rebuildModulesAndItems();
    if (typeof this.selectedFilter !== 'string') {
      this.selectedFilter = this.selectedFilter.filter((id) => id !== deckId);
      if (this.selectedFilter.length === 0) {
        this.selectedFilter = 'all';
      }
    } else if (this.selectedFilter === deckId) {
      this.selectedFilter = 'all';
    }
    this.applyFilterAndShuffle();
    this.resetSessionState();
    await deleteCustomDeck(deckId);
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
        target: '',
        pronunciation: '',
        translation:
          this.mode === 'mastery'
            ? 'No eligible words found for current Jamos.'
            : 'No modules selected. Please select at least one module in the menu.',
      };
    }
    return (
      this.activeItems[this.currentIndex] ?? {
        id: 'fallback',
        moduleId: 'all',
        target: '가',
        pronunciation: 'ga',
        translation: null,
      }
    );
  }

  /**
   * Returns up to `count` upcoming lesson items after the current exercise.
   */
  public getUpcomingItems(count: number = 5): DeepReadonly<LessonItem[]> {
    if (this.activeItems.length <= 1) {
      return [];
    }
    const upcoming: LessonItem[] = [];
    const limit = Math.min(count, this.activeItems.length - 1);
    for (let i = 1; i <= limit; i++) {
      const nextIdx = (this.currentIndex + i) % this.activeItems.length;
      upcoming.push(this.activeItems[nextIdx]);
    }
    return upcoming;
  }

  /** Returns composed user input string. */
  public getUserInput(): string {
    return this.userInput;
  }

  /** Returns active input cursor index. */
  public getInputCursorIndex(): number {
    return this.inputCursorIndex;
  }

  /** Sets active input cursor index and re-hydrates engine with prefix. */
  public setInputCursorIndex(index: number): void {
    const clamped = Math.max(0, Math.min(this.userInput.length, Math.floor(index)));
    const prefix = this.userInput.slice(0, clamped);
    this.suffix = this.userInput.slice(clamped);
    this.inputCursorIndex = clamped;
    this.engine.resetTo(prefix);
  }

  /** Returns error flags for each character index. */
  public getErrors(): DeepReadonly<ErrorReport[]> {
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
    if (this.activeItems.length === 0) {
      return 0;
    }
    return Math.round(((this.currentIndex + 1) / this.activeItems.length) * 100);
  }

  /** Formats combined Romanization and English translation text based on active settings. */
  public getDisplayText(
    item: LessonItem,
    options: { showPronunciation?: boolean; showTranslation?: boolean },
  ): string {
    if (!item) {
      return '';
    }
    const showPron = options.showPronunciation ?? true;
    const showTrans = options.showTranslation ?? true;
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

  /** Helper to construct standardized KeyResult response objects. */
  private makeResult(
    isMatch = false,
    isItemCompleted = this.isItemCompleted,
    isTutorialComplete = false,
    advanced = false,
    newlyUnlockedJamo?: string,
  ): KeyResult {
    return { isMatch, isItemCompleted, isTutorialComplete, advanced, newlyUnlockedJamo };
  }

  /**
   * Lazily decomposes and caches the current target item's Jamos.
   * Re-decomposes only when the target string identity changes across exercise prompts.
   */
  private ensureTargetJamos(): DeepReadonly<string[]> {
    const currentTarget = this.getCurrentItem().target;
    if (this.cachedTarget !== currentTarget) {
      this.cachedTarget = currentTarget;
      this.currentTargetJamos = currentTarget ? decomposeStringToJamos(currentTarget) : [];
    }
    return this.currentTargetJamos;
  }

  /**
   * Identifies the current target Jamo expected at the typing cursor.
   */
  private getCurrentExpectedJamo(inputJamos?: readonly string[]): string | null {
    const targetJamos = this.ensureTargetJamos();
    if (targetJamos.length === 0) {
      return null;
    }

    const effectiveInputJamos = inputJamos ?? decomposeStringToJamos(this.userInput);

    if (effectiveInputJamos.length < targetJamos.length) {
      return targetJamos[effectiveInputJamos.length];
    }
    return null;
  }

  /**
   * Schedules a debounced save to LocalStorage.
   * Waits 30 seconds of inactivity before writing to avoid mobile I/O heat and battery drain.
   */
  private scheduleSave(): void {
    this.cancelScheduledSave();
    this.saveTimeout = setTimeout(() => {
      saveMasteryState(this.masteryState);
      this.saveTimeout = null;
    }, 30000);
  }

  /** Immediately saves any pending mastery state to LocalStorage. */
  public flushPendingSave(): void {
    this.cancelScheduledSave();
    saveMasteryState(this.masteryState);
  }

  /** Processes single keyboard input. */
  public processKey(key: string): KeyResult {
    if (key === 'Tab' || key === 'Escape' || this.activeItems.length === 0) {
      return this.makeResult();
    }

    // Navigation Keys
    if (key === 'ArrowLeft') {
      this.setInputCursorIndex(this.inputCursorIndex - 1);
    } else if (key === 'ArrowRight') {
      this.setInputCursorIndex(this.inputCursorIndex + 1);
    } else if (key === 'Home') {
      this.setInputCursorIndex(0);
    } else if (key === 'End') {
      this.setInputCursorIndex(this.userInput.length);
    }

    if (key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End') {
      return this.makeResult();
    }

    const currentTarget = this.getCurrentItem().target;

    if (this.isItemCompleted) {
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        const isTutorialComplete = this.advanceLevel();
        return this.makeResult(true, false, isTutorialComplete, true);
      }
      if (key === 'Backspace' || key === 'Delete') {
        this.isItemCompleted = false;
      } else {
        return this.makeResult(false, true);
      }
    }

    const hasExistingErrorBefore = this.errors.some((err) => err.isError);
    const userInputBefore = this.userInput;
    const inputJamosBefore = decomposeStringToJamos(userInputBefore);
    const expectedJamoBefore = this.getCurrentExpectedJamo(inputJamosBefore);

    // Forward Delete Key
    if (key === 'Delete') {
      if (this.suffix.length > 0) {
        this.suffix = this.suffix.slice(1);
        this.userInput = this.engine.getComposedText() + this.suffix;
      }
    } else if (key === 'Backspace' || key.length === 1) {
      const newPrefix = this.engine.handleKey(key);
      this.inputCursorIndex = newPrefix.length;
      this.userInput = newPrefix + this.suffix;
    }

    this.errors = checkErrors(currentTarget, this.userInput);
    const correctChars = this.errors.filter((err) => !err.isError).length;
    this.accuracy =
      this.userInput.length > 0 ? Math.round((correctChars / this.userInput.length) * 100) : 100;

    const currentInputJamos = decomposeStringToJamos(this.userInput);
    const isCorrectKey =
      currentInputJamos.length > 0 &&
      expectedJamoBefore !== null &&
      currentInputJamos[currentInputJamos.length - 1] === expectedJamoBefore;

    this.speedTracker.recordKeystroke(key, expectedJamoBefore ?? undefined, isCorrectKey);

    // In Mastery Mode, track per-slot error telemetry without mutating mastery state mid-exercise.
    // If the learner makes an error on an expected target slot, record it in promptSlotErrors.
    // Subsequent mistyped keys while already in an error state are ignored to prevent penalizing future untouched slots.
    if (this.mode === 'mastery' && key.length === 1) {
      if (!isCorrectKey && expectedJamoBefore && !hasExistingErrorBefore) {
        const slotIndex = inputJamosBefore.length;
        this.promptSlotErrors.add(slotIndex);
      }
    }

    if (currentTarget.length > 0 && this.userInput === currentTarget) {
      this.isItemCompleted = true;
      this.speedTracker.finalizeExercise(
        this.speedStore,
        currentTarget,
        this.getCurrentItem().moduleId,
        this.getCurrentExpectedJamo() ?? undefined,
      );
      this.flushPendingSave();
      return this.makeResult(true, true, false, false, undefined);
    }

    return this.makeResult(false, this.isItemCompleted, false, false, undefined);
  }

  /**
   * Commits all mastery learning progress (Jamo attempts, checkpoint sentence completions,
   * graduation checks) for completed exercises.
   *
   * Hard Invariant: This method returns false immediately if `this.isItemCompleted` is false,
   * ensuring that abandoned or skipped exercises NEVER mutate learner mastery or progression.
   */
  private commitMasteryProgress(currentItem: LessonItem, activeTarget: MasteryTarget): boolean {
    if (!this.isItemCompleted) {
      return false;
    }

    let isComplete = false;

    // 1. Commit Jamo mastery attempts across all target characters
    commitExerciseMasteryAttempts(
      this.masteryState,
      currentItem.target,
      this.currentTargetJamos,
      this.promptSlotErrors,
      getActiveLearningJamo(this.masteryState),
    );

    // 2. If the completed item was part of a sentence checkpoint, record sentence completion
    if (this.currentTargetType === 'checkpoint' && activeTarget.type === 'checkpoint') {
      const compRes = recordSentenceCompletion(this.masteryState, activeTarget.checkpoint.id);
      if (compRes.isAllMasteryComplete) {
        this.isMasteryGraduationPending = true;
        isComplete = true;
      }
    }

    return isComplete;
  }

  /** Advances curriculum index in Free-form mode. Returns true if wrapped around. */
  private advanceCurriculumIndex(): boolean {
    let isComplete = false;
    this.currentIndex += 1;
    if (this.currentIndex >= this.activeItems.length) {
      this.currentIndex = 0;
      isComplete = true;
      if (this.shouldShuffle) {
        this.activeItems = this.shuffle(this.activeItems);
      }
    }
    return isComplete;
  }

  /** Advances to next lesson item, returning true if wrapped around. */
  public advanceLevel(): boolean {
    if (this.activeItems.length === 0) {
      this.resetSessionState();
      return false;
    }

    let isComplete: boolean;

    if (this.mode === 'mastery') {
      const currentItem = this.getCurrentItem();
      const activeTarget = getActiveMasteryTarget(this.masteryState);

      isComplete = this.commitMasteryProgress(currentItem, activeTarget);

      this.flushPendingSave();

      const newTarget = getActiveMasteryTarget(this.masteryState);
      const unlocked = getUnlockedJamos(this.masteryState);

      if (!this.masteryPool.isPoolValid(newTarget, unlocked)) {
        this.refreshMasteryPool();
      } else {
        this.selectNextMasteryExercise(currentItem?.id);
      }
    } else {
      isComplete = this.advanceCurriculumIndex();
    }

    this.resetSessionState();
    return isComplete;
  }

  /**
   * Skips the current exercise without committing any accuracy, attempt, or milestone progress.
   * Completely bypasses the mastery progress commit pipeline to guarantee zero side-effects.
   */
  public skipExercise(): void {
    if (this.activeItems.length === 0) {
      this.resetSessionState();
      return;
    }

    // Explicitly reset completion flag and pending errors before advancing
    this.isItemCompleted = false;
    this.promptSlotErrors.clear();
    this.speedTracker.reset();

    if (this.mode === 'mastery') {
      const currentItem = this.getCurrentItem();
      this.selectNextMasteryExercise(currentItem?.id);
    } else {
      this.advanceCurriculumIndex();
    }

    this.resetSessionState();
  }

  /** Navigates to the previous exercise in the history stack if available. */
  public previousExercise(): boolean {
    if (this.mode !== 'mastery') {
      if (this.currentIndex > 0) {
        this.currentIndex -= 1;
        this.resetSessionState();
        return true;
      }
      return false;
    }

    const prev = this.masteryPool.previous();
    if (prev) {
      this.activeItems = this.masteryPool.getPool();
      const idx = this.activeItems.findIndex((i) => i.id === prev.id);
      this.currentIndex = idx >= 0 ? idx : 0;
      this.resetSessionState();
      return true;
    }
    return false;
  }

  /** Returns true if previous exercise is available in history. */
  public canGoBack(): boolean {
    if (this.mode !== 'mastery') {
      return this.currentIndex > 0;
    }
    return this.masteryPool.canGoBack();
  }

  /** Returns true if forward exercise is available in history. */
  public canGoForward(): boolean {
    if (this.mode !== 'mastery') {
      return this.currentIndex < this.activeItems.length - 1;
    }
    return this.masteryPool.canGoForward();
  }

  /** Checks if full mastery path was newly completed. */
  public getIsMasteryGraduationPending(): boolean {
    return this.isMasteryGraduationPending;
  }

  /** Clears the pending mastery graduation flag. */
  public clearMasteryGraduationPending(): void {
    this.isMasteryGraduationPending = false;
  }

  /** Returns cached decomposed Jamos for the active target item. */
  public getCurrentTargetJamos(): DeepReadonly<string[]> {
    return this.ensureTargetJamos();
  }

  /** Resets dynamic typing state for current lesson item. */
  public resetSessionState(): void {
    this.userInput = '';
    this.inputCursorIndex = 0;
    this.suffix = '';
    this.errors = [];
    this.accuracy = 100;
    this.isItemCompleted = false;
    this.promptSlotErrors.clear();
    this.engine.reset();
    this.speedTracker.reset();
    this.cachedTarget = null;
    this.ensureTargetJamos();
  }

  /** Manually resets entire session back to index 0. */
  public resetSession(): void {
    this.currentIndex = 0;
    if (this.shouldShuffle && this.mode !== 'mastery') {
      this.activeItems = this.shuffle(this.activeItems);
    }
    this.resetSessionState();
  }

  /** Returns the current speed metrics store. */
  public getSpeedStore(): SpeedMetricsStore {
    return this.speedStore;
  }

  /** Returns calculated KPM and latency statistics for a specific Jamo. */
  public getJamoKpm(
    jamo: string,
  ): { readonly kpm: number; readonly averageIkiMs: number; readonly attempts: number } | null {
    return getJamoKpmStats(this.speedStore, jamo);
  }

  /** Returns calculated KPM, accuracy, and count for a category ('words' or 'sentences'). */
  public getCategoryKpm(category: 'words' | 'sentences'): {
    readonly kpm: number;
    readonly accuracy: number;
    readonly count: number;
    readonly bestKpm: number;
  } | null {
    return getCategoryKpmStats(this.speedStore, category);
  }

  /** Resets all speed and KPM statistics across all exercises and Jamos. */
  public resetSpeedMetrics(): void {
    resetSpeedMetricsStore(this.speedStore);
    this.speedTracker.reset();
  }
}
