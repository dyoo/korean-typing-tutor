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
  recordJamoAttempt,
  recordSentenceCompletion,
  getEligibleMasteryItems,
  selectNextMasteryItem,
  setMasteryProgressionLevel,
  setMasteryCheckpointLevel,
  setMasteryFocusBatchim,
  JAMO_PROGRESSION_ORDER,
  COMPOUND_BATCHIM_SET,
} from '../utils/jamoMastery';
import { decomposeStringToJamos, decomposeSyllable } from '../utils/hangulDecompose';
import { loadCustomDecks, saveCustomDeck, deleteCustomDeck } from '../utils/customDecks';
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

export type { CurriculumData };

/** Result object returned when a keystroke is processed by the TutorSession controller. */
interface KeyResult {
  isMatch: boolean;
  isItemCompleted: boolean;
  isTutorialComplete: boolean;
  advanced: boolean;
  newlyUnlockedJamo?: string;
}

/**
 * TutorSession Controller.
 * Decouples session state management, curriculum module tracking,
 * randomized item shuffling, and keystroke composition routing from the UI.
 */
export class TutorSession {
  private baseItems: LessonItem[];
  private baseModules: ModuleDefinition[];
  private allItems: LessonItem[] = $state([]);
  private modules: ModuleDefinition[] = $state([]);
  public customDecks: CustomDeck[] = $state(loadCustomDecks());
  public activeItems: LessonItem[] = $state([]);
  public selectedFilter: string | string[] = $state('all');
  private shouldShuffle: boolean;
  public currentIndex = $state(0);
  public userInput = $state('');
  public inputCursorIndex = $state(0);
  public suffix = $state('');
  public errors: ErrorReport[] = $state([]);
  public accuracy = $state(100);
  public isItemCompleted = $state(false);
  private engine: HangulEngine;

  public mode: TutorMode = $state('mastery');
  public masteryState: MasteryState = $state(loadMasteryState());
  public speedStore: SpeedMetricsStore = $state(loadSpeedMetricsStore());
  private speedTracker = new ExerciseSpeedTracker();
  public isMasteryGraduationPending: boolean = $state(false);
  private currentTargetType: MasteryTarget['type'] = 'jamo';
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;
  private masteryQueue: LessonItem[] = [];

  constructor(
    data: CurriculumData | LessonItem[],
    defaultFilter: string | string[] = 'all',
    shuffle = true,
  ) {
    if (Array.isArray(data)) {
      this.baseItems = data;
      this.baseModules = [
        {
          id: 'all',
          title: 'All Lessons',
          description: 'Comprehensive practice across all modules',
        },
      ];
    } else {
      this.baseItems = data.items ?? [];
      this.baseModules = data.modules ?? [];
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
   * Refills the upcoming Mastery lookahead buffer so upcoming exercises
   * are known deterministically in advance for 100% audio cache hits.
   */
  private refillMasteryQueue(): void {
    if (this.mode !== 'mastery' || this.activeItems.length === 0) {
      return;
    }
    const activeTarget = getActiveMasteryTarget(this.masteryState);
    const activeIdSet = new Set(this.activeItems.map((i) => i.id)); // eslint-disable-line svelte/prefer-svelte-reactivity
    this.masteryQueue = this.masteryQueue.filter((item) => activeIdSet.has(item.id));

    while (this.masteryQueue.length < 5) {
      const lastItem =
        this.masteryQueue[this.masteryQueue.length - 1] ?? this.activeItems[this.currentIndex];
      const next = selectNextMasteryItem(
        this.activeItems,
        activeTarget,
        this.masteryState.jamoStats,
        lastItem?.id,
      );
      this.masteryQueue.push(next);
    }
  }

  /** Updates eligible mastery items and sets the current cursor to the next prioritized item. */
  private updateMasteryItemsAndCursor(excludeItemId?: string): void {
    const unlocked = getUnlockedJamos(this.masteryState);
    const activeTarget = getActiveMasteryTarget(this.masteryState);
    this.currentTargetType = activeTarget.type;
    this.activeItems = getEligibleMasteryItems(this.allItems, unlocked, activeTarget);

    const activeIdSet = new Set(this.activeItems.map((i) => i.id)); // eslint-disable-line svelte/prefer-svelte-reactivity
    this.masteryQueue = this.masteryQueue.filter((item) => activeIdSet.has(item.id));

    if (this.masteryQueue.length === 0) {
      const nextItem = selectNextMasteryItem(
        this.activeItems,
        activeTarget,
        this.masteryState.jamoStats,
        excludeItemId,
      );
      const nextIndex = this.activeItems.findIndex((i) => i.id === nextItem.id);
      this.currentIndex = nextIndex >= 0 ? nextIndex : 0;
    } else {
      const nextItem = this.masteryQueue.shift()!;
      const nextIndex = this.activeItems.findIndex((i) => i.id === nextItem.id);
      this.currentIndex = nextIndex >= 0 ? nextIndex : 0;
    }

    this.refillMasteryQueue();
  }

  /** Filters items by active mode / module ID(s) and applies shuffling. */
  private applyFilterAndShuffle(): void {
    if (this.mode === 'mastery') {
      this.masteryQueue = [];
      this.updateMasteryItemsAndCursor();
    } else {
      let filtered: LessonItem[];
      if (Array.isArray(this.selectedFilter)) {
        if (this.selectedFilter.includes('all')) {
          filtered = [...this.allItems];
        } else if (this.selectedFilter.length === 0) {
          filtered = [];
        } else {
          const allowedSet = new Set(this.selectedFilter); // eslint-disable-line svelte/prefer-svelte-reactivity
          filtered = this.allItems.filter((item) => allowedSet.has(item.moduleId));
        }
      } else if (this.selectedFilter === 'all') {
        filtered = [...this.allItems];
      } else {
        const filter = this.selectedFilter;
        filtered = this.allItems.filter(
          (item) => item.moduleId === filter || item.id.startsWith(filter),
        );
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
  public getUnlockedJamos(): Set<string> {
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
  public setFilter(filterId: string | string[], shuffle = true): void {
    this.selectedFilter = filterId;
    this.shouldShuffle = shuffle;
    this.applyFilterAndShuffle();
  }

  /** Returns active filter module ID or array of IDs. */
  public getSelectedFilter(): string | string[] {
    return this.selectedFilter;
  }

  /** Returns all available module definitions. */
  public getModules(): ModuleDefinition[] {
    return this.modules;
  }

  /** Returns all user-imported custom flashcard decks. */
  public getCustomDecks(): CustomDeck[] {
    return this.customDecks;
  }

  /** Registers and persists a newly imported custom deck. */
  public addCustomDeck(deck: CustomDeck): void {
    saveCustomDeck(deck);
    this.customDecks = loadCustomDecks();
    this.rebuildModulesAndItems();
    if (Array.isArray(this.selectedFilter)) {
      if (!this.selectedFilter.includes(deck.id)) {
        this.selectedFilter = [...this.selectedFilter, deck.id];
      }
    } else if (this.selectedFilter !== 'all') {
      this.selectedFilter = [this.selectedFilter, deck.id];
    }
    this.applyFilterAndShuffle();
    this.resetSessionState();
  }

  /** Deletes a custom deck by ID from storage and session. */
  public removeCustomDeck(deckId: string): void {
    deleteCustomDeck(deckId);
    this.customDecks = loadCustomDecks();
    this.rebuildModulesAndItems();
    if (Array.isArray(this.selectedFilter)) {
      this.selectedFilter = this.selectedFilter.filter((id) => id !== deckId);
      if (this.selectedFilter.length === 0) {
        this.selectedFilter = 'all';
      }
    } else if (this.selectedFilter === deckId) {
      this.selectedFilter = 'all';
    }
    this.applyFilterAndShuffle();
    this.resetSessionState();
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
   * Useful for lookahead audio prefetching and cache warm-up.
   */
  public getUpcomingItems(count: number = 5): LessonItem[] {
    if (this.mode === 'mastery') {
      this.refillMasteryQueue();
      return this.masteryQueue.slice(0, count);
    }

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
    if (this.activeItems.length === 0) {
      return 0;
    }
    return Math.round(((this.currentIndex + 1) / this.activeItems.length) * 100);
  }

  /** Formats combined Romanization and English translation text based on active settings. */
  public getDisplayText(
    item = this.getCurrentItem(),
    options?: { showPronunciation?: boolean; showTranslation?: boolean },
  ): string {
    if (!item) {
      return '';
    }
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
   * Identifies the current target Jamo expected at the typing cursor.
   */
  private getCurrentExpectedJamo(): string | null {
    const currentTarget = this.getCurrentItem().target;
    if (!currentTarget) {
      return null;
    }

    const targetJamos = decomposeStringToJamos(currentTarget);
    const inputJamos = decomposeStringToJamos(this.userInput);

    if (inputJamos.length < targetJamos.length) {
      return targetJamos[inputJamos.length];
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

    const expectedJamoBefore = this.getCurrentExpectedJamo();

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

    let newlyUnlockedJamo: string | undefined = undefined;

    const currentInputJamos = decomposeStringToJamos(this.userInput);
    const isCorrectKey =
      currentInputJamos.length > 0 &&
      expectedJamoBefore !== null &&
      currentInputJamos[currentInputJamos.length - 1] === expectedJamoBefore;

    this.speedTracker.recordKeystroke(key, expectedJamoBefore ?? undefined, isCorrectKey);

    // In Mastery Mode, evaluate Jamo telemetry on printable keys
    if (this.mode === 'mastery' && expectedJamoBefore && key.length === 1) {
      const isCorrect = isCorrectKey;

      const attemptResult = recordJamoAttempt(this.masteryState, expectedJamoBefore, isCorrect);
      if (attemptResult.newlyUnlockedJamo) {
        newlyUnlockedJamo = attemptResult.newlyUnlockedJamo;
      }

      // If active learning target is a compound batchim (e.g. ㄺ, ㅄ, ㄶ), check syllables directly
      const activeItem = getActiveLearningJamo(this.masteryState);
      if (activeItem && COMPOUND_BATCHIM_SET.has(activeItem.jamo)) {
        const lastInputChar = this.userInput[this.userInput.length - 1];
        if (lastInputChar && decomposeSyllable(lastInputChar)?.finalConsonant === activeItem.jamo) {
          const compoundResult = recordJamoAttempt(this.masteryState, activeItem.jamo, isCorrect);
          if (compoundResult.newlyUnlockedJamo) {
            newlyUnlockedJamo = compoundResult.newlyUnlockedJamo;
          }
        }
      }

      this.scheduleSave();
    }

    if (currentTarget.length > 0 && this.userInput === currentTarget) {
      this.isItemCompleted = true;
      this.speedTracker.finalizeExercise(
        this.speedStore,
        currentTarget,
        this.getCurrentItem().moduleId,
        this.getCurrentExpectedJamo() ?? undefined,
      );
      // Immediately save progress to LocalStorage upon finishing the exercise, skipping debounce delay.
      this.flushPendingSave();
      return this.makeResult(true, true, false, false, newlyUnlockedJamo);
    }

    return this.makeResult(false, this.isItemCompleted, false, false, newlyUnlockedJamo);
  }

  /** Advances to next lesson item, returning true if wrapped around. */
  public advanceLevel(): boolean {
    if (this.activeItems.length === 0) {
      this.resetSessionState();
      return false;
    }

    let isComplete = false;

    if (this.mode === 'mastery') {
      const currentItem = this.getCurrentItem();
      const activeTarget = getActiveMasteryTarget(this.masteryState);

      // If the completed item was part of a sentence checkpoint, record sentence completion
      if (this.currentTargetType === 'checkpoint' && activeTarget.type === 'checkpoint') {
        const compRes = recordSentenceCompletion(this.masteryState, activeTarget.checkpoint.id);
        if (compRes.isAllMasteryComplete) {
          this.isMasteryGraduationPending = true;
          isComplete = true;
        }
      }

      this.flushPendingSave();
      this.updateMasteryItemsAndCursor(currentItem.id);
    } else {
      this.currentIndex += 1;
      if (this.currentIndex >= this.activeItems.length) {
        this.currentIndex = 0;
        isComplete = true;
        if (this.shouldShuffle) {
          this.activeItems = this.shuffle(this.activeItems);
        }
      }
    }

    this.resetSessionState();
    return isComplete;
  }

  /** Checks if full mastery path was newly completed. */
  public getIsMasteryGraduationPending(): boolean {
    return this.isMasteryGraduationPending;
  }

  /** Clears the pending mastery graduation flag. */
  public clearMasteryGraduationPending(): void {
    this.isMasteryGraduationPending = false;
  }

  /** Resets dynamic typing state for current lesson item. */
  public resetSessionState(): void {
    this.userInput = '';
    this.inputCursorIndex = 0;
    this.suffix = '';
    this.errors = [];
    this.accuracy = 100;
    this.isItemCompleted = false;
    this.engine.reset();
    this.speedTracker.reset();
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
  public getJamoKpm(jamo: string) {
    return getJamoKpmStats(this.speedStore, jamo);
  }

  /** Returns calculated KPM, accuracy, and count for a category ('words' or 'sentences'). */
  public getCategoryKpm(category: 'words' | 'sentences') {
    return getCategoryKpmStats(this.speedStore, category);
  }

  /** Resets all speed and KPM statistics across all exercises and Jamos. */
  public resetSpeedMetrics(): void {
    resetSpeedMetricsStore(this.speedStore);
    this.speedTracker.reset();
  }
}
