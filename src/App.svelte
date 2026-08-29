<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import contentData from './content';
  import { TutorSession } from './lib/tutorSession.svelte';
  import type { CurriculumData } from './lib/tutorSession.svelte';
  import { loadSettings, saveSettings, applyTheme } from './lib/settings';
  import type { TutorSettings, ThemeMode } from './lib/settings';
  import {
    calculateTargetCursorIndex,
    calculateInputCursorIndex,
    getWordTokens,
  } from './utils/cursorHelper';
  import { getNextRequiredKeys } from './utils/keyboardHelper';
  import { handleCopyEvent } from './utils/clipboard';
  import {
    JAMO_PROGRESSION_ORDER,
    JAMO_STAGES,
    calculateJamoProgress,
  } from './utils/jamoMastery';
  import VirtualKeyboard from './lib/VirtualKeyboard.svelte';
  import CurriculumSidebar from './lib/CurriculumSidebar.svelte';
  import MasterySidebar from './lib/MasterySidebar.svelte';
  import TargetDisplay from './lib/TargetDisplay.svelte';
  import ExercisePrompt from './lib/ExercisePrompt.svelte';
  import TopBar from './lib/TopBar.svelte';
  import InputDisplay from './lib/InputDisplay.svelte';
  import MasteryCompletionModal from './lib/MasteryCompletionModal.svelte';
  import WelcomeModal from './lib/WelcomeModal.svelte';
  import ImportDeckModal from './lib/ImportDeckModal.svelte';
  import SettingsModal from './lib/SettingsModal.svelte';
  import { ttsController } from './utils/ttsController.svelte';
  import { ALL_CATEGORY_IDS, toggleCategoryGroupIds } from './content/curriculumCategories';
  import type { CurriculumCategory } from './content/curriculumCategories';
  import type { CursorColorMode } from './utils/cursorColor';
  import type { CustomDeck } from './types/customDecks';

  const session = new TutorSession(contentData as CurriculumData, 'all', true);
  let modules = $derived(session.getModules());
  let customDecks = $derived(session.getCustomDecks());

  const initialSettings = loadSettings();
  let settings = $state<TutorSettings>(initialSettings);
  type ActivePanel = 'none' | 'settings' | 'curriculum' | 'mastery';
  let activePanel = $state<ActivePanel>('none');
  let showSettingsModal = $derived(activePanel === 'settings');
  let showCurriculumSidebar = $derived(activePanel === 'curriculum');
  let showMasterySidebar = $derived(activePanel === 'mastery');
  let showMasteryCompletionModal = $state(false);
  let showWelcomeModal = $state(true);
  let showImportDeckModal = $state(false);

  let enabledModuleIds = $state<string[]>(
    Array.isArray(initialSettings.enabledModuleIds)
      ? initialSettings.enabledModuleIds
      : session.getModules().map((m) => m.id),
  );

  let mode = $derived(session.getMode());
  let masteryState = $derived(session.getMasteryState());

  let userInput = $derived(session.getUserInput());
  let errors = $derived(session.getErrors());
  let currentItem = $derived(session.getCurrentItem());
  let isCompleted = $derived(session.getIsItemCompleted());
  let inputElement = $state<HTMLInputElement | null>(null);

  let isLeftShiftPressed = $state(false);
  let isRightShiftPressed = $state(false);

  let sessionCursorIndex = $derived(session.getInputCursorIndex());

  let displayText = $derived(session.getDisplayText(currentItem, settings));
  let wordTokens = $derived(getWordTokens(currentItem.target));

  let activeTargetCursorIndex = $derived(
    calculateTargetCursorIndex(currentItem.target, userInput, isCompleted, sessionCursorIndex),
  );

  let activeInputCursorIndex = $derived(
    calculateInputCursorIndex(userInput, currentItem.target, isCompleted, sessionCursorIndex),
  );

  let activeRequiredKeys = $derived(
    getNextRequiredKeys(currentItem.target, userInput, isCompleted),
  );

  // Conditionally suppress keyboard hints when the setting is disabled.
  let hintKeys = $derived(settings.showKeyboardHint ? activeRequiredKeys : []);

  // Map errors to O(1) lookups by index to avoid O(N^2) .find() calls in child {#each} loops.
  let errorMap = $derived(new Map(errors.map((e) => [e.index, e.isError])));

  let activeMasteryTarget = $derived(session.getActiveMasteryTarget());
  let activeCheckpoint = $derived(session.getActiveCheckpoint());
  let activeLearningJamo = $derived(
    activeMasteryTarget.type === 'jamo' ? activeMasteryTarget.item : null,
  );
  let activeFocusBatchimItem = $derived(
    activeMasteryTarget.type === 'focus' ? activeMasteryTarget.item : null,
  );
  let activeFocusVowelItem = $derived(
    activeMasteryTarget.type === 'consolidation_vowel' ? activeMasteryTarget.item : null,
  );
  let activeFocusConsonantItem = $derived(
    activeMasteryTarget.type === 'consolidation_consonant' ? activeMasteryTarget.item : null,
  );
  let activeConsolidationMode = $derived(
    activeMasteryTarget.type === 'consolidation_words'
      ? 'words'
      : activeMasteryTarget.type === 'consolidation_sentences'
        ? 'sentences'
        : null,
  );
  let activeJamoChar = $derived(
    activeLearningJamo?.jamo ??
      activeFocusBatchimItem?.batchim ??
      activeFocusVowelItem?.jamo ??
      activeFocusConsonantItem?.jamo ??
      null,
  );
  let activeLearningCombination = $derived(
    activeLearningJamo?.combination ??
      activeFocusBatchimItem?.combination ??
      activeFocusVowelItem?.combination ??
      activeFocusConsonantItem?.combination,
  );
  let isPostGame = $derived(
    activeMasteryTarget.type === 'focus' ||
      activeMasteryTarget.type === 'consolidation_words' ||
      activeMasteryTarget.type === 'consolidation_sentences' ||
      activeMasteryTarget.type === 'consolidation_vowel' ||
      activeMasteryTarget.type === 'consolidation_consonant',
  );
  let postGameSubtype = $derived(
    activeConsolidationMode === 'words'
      ? 'Words'
      : activeConsolidationMode === 'sentences'
        ? 'Sentences'
        : activeFocusVowelItem
          ? 'Vowel'
          : activeFocusConsonantItem
            ? 'Consonant'
            : activeFocusBatchimItem
              ? 'Batchim'
              : null,
  );
  let activeJamoLabel = $derived(
    activeConsolidationMode
      ? 'Target:'
      : activeFocusBatchimItem
        ? 'Batchim:'
        : 'Focus:',
  );
  let activeTargetRemaining = $derived(
    activeConsolidationMode === 'words'
      ? 'All Words'
      : activeConsolidationMode === 'sentences'
        ? 'All Sentences'
        : (activeFocusBatchimItem?.name ??
          activeFocusVowelItem?.name ??
          activeFocusConsonantItem?.name ??
          null),
  );
  let activeJamoProgress = $derived(
    activeJamoChar ? calculateJamoProgress(masteryState.jamoStats[activeJamoChar]) : 0,
  );
  let activeCheckpointTitle = $derived(
    activeMasteryTarget.type === 'checkpoint' ? activeMasteryTarget.checkpoint.title : null,
  );
  let activeCheckpointProgress = $derived(
    activeMasteryTarget.type === 'checkpoint'
      ? {
          completed:
            masteryState.sentenceCheckpointStats?.[activeMasteryTarget.checkpoint.id]
              ?.completedCount ?? 0,
          total: activeMasteryTarget.checkpoint.requiredCompletions,
        }
      : null,
  );

  let currentStageNumber = $derived(
    activeLearningJamo?.stage ??
      (activeMasteryTarget.type === 'checkpoint' ? activeMasteryTarget.checkpoint.stage : 1),
  );
  let currentStageName = $derived(
    activeLearningJamo?.stageName ??
      (activeMasteryTarget.type === 'checkpoint'
        ? activeMasteryTarget.checkpoint.stageName
        : 'Home Row'),
  );
  let totalStageCount = $derived(JAMO_STAGES.length);

  function isTouchDevice(): boolean {
    return (
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window)
    );
  }

  function focusInputElement() {
    if (!isTouchDevice()) {
      inputElement?.focus();
    }
  }

  onMount(() => {
    session.setFilter(enabledModuleIds, true);
    applyTheme(settings.theme);
    focusInputElement();

    // Ensure pending debounced saves are flushed if the user navigates away or closes the tab.
    const handleBeforeUnload = () => {
      session.flushPendingSave();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  });

  function handleBeginSession() {
    session.resetSessionState();
    showWelcomeModal = false;
    focusInputElement();
    if (settings.enableTTS && settings.speakOnAppearance) {
      speakCurrentPrompt();
    }
  }

  function handleWindowClick(e: MouseEvent) {
    focusInput(e);
  }

  function focusInput(e?: MouseEvent) {
    if (window.getSelection() && (window.getSelection()?.toString().trim().length ?? 0) > 0) {
      return;
    }
    if (e && e.target) {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'SELECT' ||
        target.tagName === 'OPTION' ||
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.tagName === 'A' ||
        target.closest('select') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('label') ||
        target.closest('.settings-modal') ||
        target.closest('[role="dialog"]')
      ) {
        return;
      }
    }
    focusInputElement();
  }

  function setInputCursorPosition(index: number) {
    session.setInputCursorIndex(index);
    focusInputElement();
  }

  function toggleMode() {
    const newMode = mode === 'curriculum' ? 'mastery' : 'curriculum';
    session.setMode(newMode);
    focusInputElement();
  }

  function handleMasteryLevelChange(level: number) {
    session.setMasteryProgressionLevel(level);
    focusInputElement();
  }

  function handleMasteryCheckpointChange(checkpointId: string) {
    session.setMasteryCheckpointLevel(checkpointId);
    focusInputElement();
  }

  function handleMasteryFocusSelect(batchim: string) {
    session.setMasteryFocusBatchim(batchim);
    focusInputElement();
  }

  function toggleModule(modId: string) {
    if (enabledModuleIds.includes(modId)) {
      if (enabledModuleIds.length === 1) {
        return;
      }
      enabledModuleIds = enabledModuleIds.filter((id) => id !== modId);
    } else {
      enabledModuleIds = [...enabledModuleIds, modId];
    }
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter(enabledModuleIds, true);
  }

  function handleOpenImportDeckModal() {
    showImportDeckModal = true;
  }

  function handleCloseImportDeckModal() {
    showImportDeckModal = false;
    focusInputElement();
  }

  function handleImportDeck(deck: CustomDeck) {
    session.addCustomDeck(deck);
    if (!enabledModuleIds.includes(deck.id)) {
      enabledModuleIds = [...enabledModuleIds, deck.id];
      settings = { ...settings, enabledModuleIds };
      saveSettings(settings);
    }
    focusInputElement();
  }

  function handleDeleteCustomDeck(deckId: string) {
    session.removeCustomDeck(deckId);
    enabledModuleIds = enabledModuleIds.filter((id) => id !== deckId);
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    focusInputElement();
  }

  let collapsedCategoryIds = $state<string[]>(
    loadSettings().collapsedCategoryIds ?? ALL_CATEGORY_IDS,
  );

  let collapsedMasteryStageIds = $state<string[]>(
    loadSettings().collapsedMasteryStageIds ?? [],
  );

  function toggleCategoryCollapse(categoryId: string) {
    if (collapsedCategoryIds.includes(categoryId)) {
      collapsedCategoryIds = collapsedCategoryIds.filter((id) => id !== categoryId);
    } else {
      collapsedCategoryIds = [...collapsedCategoryIds, categoryId];
    }
    settings = { ...settings, collapsedCategoryIds };
    saveSettings(settings);
  }

  function toggleMasteryStageCollapse(stageName: string) {
    if (collapsedMasteryStageIds.includes(stageName)) {
      collapsedMasteryStageIds = collapsedMasteryStageIds.filter((id) => id !== stageName);
    } else {
      collapsedMasteryStageIds = [...collapsedMasteryStageIds, stageName];
    }
    settings = { ...settings, collapsedMasteryStageIds };
    saveSettings(settings);
  }

  function toggleCategoryGroup(category: CurriculumCategory) {
    enabledModuleIds = toggleCategoryGroupIds(category, enabledModuleIds);
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter(enabledModuleIds, true);
  }

  function selectAllModules() {
    enabledModuleIds = modules.map((m) => m.id);
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter('all', true);
  }

  function deselectAllModules() {
    enabledModuleIds = [];
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter(enabledModuleIds, true);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (
      showWelcomeModal ||
      activePanel !== 'none' ||
      showMasteryCompletionModal ||
      showImportDeckModal
    ) {
      if (showWelcomeModal && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
        e.preventDefault();
        // Stop the event from bubbling to window so WelcomeModal's own
        // svelte:window keydown handler doesn't invoke begin a second time.
        e.stopPropagation();
        handleBeginSession();
      }
      return;
    }

    if (e.key === 'Shift') {
      if (e.code === 'ShiftLeft') {
        isLeftShiftPressed = true;
      } else if (e.code === 'ShiftRight') {
        isRightShiftPressed = true;
      } else {
        isLeftShiftPressed = true;
      }
      return;
    }

    // Shortcut: Ctrl+S (Windows/Linux) or Cmd+S (macOS) to speak the current prompt
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      if (settings.enableTTS) {
        speakCurrentPrompt();
      }
      return;
    }

    if (e.key === 'Tab' || e.key === 'Escape' || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    if (
      e.key === 'Backspace' ||
      e.key === 'Delete' ||
      e.key === 'Enter' ||
      e.key === 'ArrowLeft' ||
      e.key === 'ArrowRight' ||
      e.key === 'Home' ||
      e.key === 'End' ||
      e.key.length === 1
    ) {
      e.preventDefault();
      processKeystrokeWithAudio(e.key);
    }
  }

  function processKeystrokeWithAudio(key: string) {
    const wasCompleted = session.getIsItemCompleted();
    const result = session.processKey(key);

    // If graduating full mastery path on the last milestone, show completion dialog
    if (session.getIsMasteryGraduationPending()) {
      showMasteryCompletionModal = true;
      session.clearMasteryGraduationPending();
    }

    // If typing this key newly completed the exercise, trigger audio if enabled
    if (
      !wasCompleted &&
      (result.isItemCompleted || session.getIsItemCompleted()) &&
      settings.enableTTS &&
      settings.speakOnCompletion
    ) {
      console.debug('[App] Exercise completed, triggering speakCurrentPrompt()');
      speakCurrentPrompt();
    }
  }

  function handleKeyup(e: KeyboardEvent) {
    if (e.key === 'Shift') {
      if (e.code === 'ShiftLeft') {
        isLeftShiftPressed = false;
      } else if (e.code === 'ShiftRight') {
        isRightShiftPressed = false;
      } else {
        isLeftShiftPressed = false;
        isRightShiftPressed = false;
      }
    }
  }

  function handleWindowBlur() {
    isLeftShiftPressed = false;
    isRightShiftPressed = false;
  }

  function handleInputPrevent(e: Event) {
    (e.target as HTMLInputElement).value = userInput;
  }

  function handleSkip(e: MouseEvent) {
    e.stopPropagation();
    ttsController.stopAudio();
    session.advanceLevel();
    if (session.getIsMasteryGraduationPending()) {
      showMasteryCompletionModal = true;
      session.clearMasteryGraduationPending();
    }
    focusInputElement();
  }

  function handleCompletionSwitchToFreeForm() {
    showMasteryCompletionModal = false;
    session.setMode('curriculum');
    activePanel = 'curriculum';
    focusInputElement();
  }

  function handleCompletionOpenMasterySidebar() {
    showMasteryCompletionModal = false;
    activePanel = 'mastery';
    focusInputElement();
  }

  function handleCompletionOpenFocusMode() {
    showMasteryCompletionModal = false;
    session.setMasteryFocusBatchim('ㄱ');
    activePanel = 'mastery';
    focusInputElement();
  }

  function handleCompletionModalClose() {
    showMasteryCompletionModal = false;
    focusInputElement();
  }

  function updateSetting<K extends keyof TutorSettings>(key: K, value: TutorSettings[K]) {
    settings = { ...settings, [key]: value };
    saveSettings(settings);
  }

  let isTTSSpeaking = $derived(ttsController.isSpeaking);
  let isTTSLoading = $derived(false);

  function toggleTTS() {
    if (!settings.enableTTS) {
      updateSetting('enableTTS', true);
    } else {
      updateSetting('enableTTS', false);
      ttsController.stopAudio();
    }
  }

  function toggleSpeakOnCompletion() {
    updateSetting('speakOnCompletion', !settings.speakOnCompletion);
  }

  function toggleSpeakOnAppearance() {
    updateSetting('speakOnAppearance', !settings.speakOnAppearance);
  }

  function handleVoiceChange(voice: string) {
    updateSetting('ttsVoice', voice);
  }

  function handleSpeedChange(speed: number) {
    updateSetting('ttsSpeed', speed);
  }

  function speakCurrentPrompt() {
    if (currentItem && currentItem.target) {
      ttsController.speak(
        currentItem.target,
        settings.ttsVoice,
        settings.ttsSpeed ?? 1.0,
      );
    }
    focusInputElement();
  }

  let lastPromptTarget = '';

  $effect(() => {
    const targetText = currentItem?.target;
    const isEnabled = settings.enableTTS;
    const speakOnAppear = settings.speakOnAppearance;

    untrack(() => {
      const isNewTarget = targetText !== lastPromptTarget;
      if (isNewTarget) {
        lastPromptTarget = targetText || '';
        ttsController.stopAudio();
      }

      if (isEnabled && targetText) {
        // If speak on appearance is enabled, pronounce the prompt when it newly appears (once welcome modal is dismissed)
        if (isNewTarget && speakOnAppear && !showWelcomeModal) {
          speakCurrentPrompt();
        }
      }
    });
  });

  function togglePronunciation() {
    updateSetting('showPronunciation', !settings.showPronunciation);
  }

  function toggleTranslation() {
    updateSetting('showTranslation', !settings.showTranslation);
  }

  function toggleVirtualKeyboard() {
    updateSetting('showVirtualKeyboard', !settings.showVirtualKeyboard);
  }

  function toggleKeyboardHint() {
    updateSetting('showKeyboardHint', !settings.showKeyboardHint);
  }

  function toggleKpm() {
    updateSetting('showKpm', !settings.showKpm);
  }

  function handleResetKpm() {
    session.resetSpeedMetrics();
  }

  function handleThemeChange(theme: ThemeMode) {
    updateSetting('theme', theme);
    applyTheme(theme);
  }

  function handleMinFontSizeChange(minFontSizeRem: number) {
    updateSetting('minFontSizeRem', minFontSizeRem);
  }

  function handleMaxFontSizeChange(maxFontSizeRem: number) {
    updateSetting('maxFontSizeRem', maxFontSizeRem);
  }

  function handleToggleLockFontSize() {
    updateSetting('lockFontSize', !settings.lockFontSize);
  }

  function handleCursorColorChange(cursorColor: CursorColorMode) {
    updateSetting('cursorColor', cursorColor);
  }

  function handleVirtualKeySelect(key: string) {
    processKeystrokeWithAudio(key);
  }

  function togglePanel(panel: 'settings' | 'curriculum' | 'mastery', e?: MouseEvent) {
    e?.stopPropagation();
    if (activePanel === panel) {
      activePanel = 'none';
      focusInputElement();
    } else {
      activePanel = panel;
    }
  }

  function closePanel() {
    activePanel = 'none';
    focusInputElement();
  }

  function toggleSettingsModal(e?: MouseEvent) {
    togglePanel('settings', e);
  }

  function toggleCurriculumSidebar(e?: MouseEvent) {
    togglePanel('curriculum', e);
  }

  function toggleMasterySidebar(e?: MouseEvent) {
    togglePanel('mastery', e);
  }

  function handleCopy(e: ClipboardEvent) {
    handleCopyEvent(e);
  }
</script>

<svelte:window onclick={handleWindowClick} onkeyup={handleKeyup} onblur={handleWindowBlur} />

<main
  oncopy={handleCopy}
  class="flex flex-col items-center justify-between h-full h-svh max-h-svh bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom,0px)] md:px-8 md:pt-5 md:pb-5 overflow-hidden transition-colors"
>
  <TopBar
    {mode}
    ontogglemode={toggleMode}
    enabledModuleCount={enabledModuleIds.length}
    totalModuleCount={modules.length}
    masteryUnlockedCount={masteryState.unlockedCount}
    masteryTotalCount={JAMO_PROGRESSION_ORDER.length}
    {currentStageNumber}
    {totalStageCount}
    {currentStageName}
    activeJamoChar={activeJamoChar}
    activeJamoLabel={activeJamoLabel}
    activeLearningCombination={activeLearningCombination}
    activeJamoProgress={activeJamoProgress}
    activeTargetRemaining={activeTargetRemaining}
    {isPostGame}
    {postGameSubtype}
    {activeCheckpointTitle}
    {activeCheckpointProgress}
    ontogglecurriculum={toggleCurriculumSidebar}
    ontogglemastery={toggleMasterySidebar}
    ontogglesettings={toggleSettingsModal}
  />

  <div
    class="w-full max-w-full flex-1 min-h-0 flex flex-col items-center justify-between pt-2 md:pt-4 px-2 md:px-8 overflow-hidden"
  >
    <TargetDisplay
      {wordTokens}
      {errorMap}
      {activeTargetCursorIndex}
      {isCompleted}
      {currentItem}
      {displayText}
      minFontSizeRem={settings.minFontSizeRem}
      maxFontSizeRem={settings.maxFontSizeRem}
      lockFontSize={settings.lockFontSize}
      cursorColor={settings.cursorColor}
      enableTTS={settings.enableTTS}
      {isTTSSpeaking}
      {isTTSLoading}
      onspeak={speakCurrentPrompt}
    />

    <ExercisePrompt {isCompleted} onskip={handleSkip} />
  </div>

  <div
    class="w-full max-w-5xl md:max-w-6xl lg:max-w-7xl flex flex-col items-center pb-0 md:pb-4 shrink-0 px-2 md:px-8"
  >
    <InputDisplay
      bind:inputElement
      {userInput}
      {errorMap}
      {activeInputCursorIndex}
      {isCompleted}
      hasEnabledModules={mode === 'mastery' || enabledModuleIds.length > 0}
      cursorColor={settings.cursorColor}
      onkeydown={handleKeydown}
      onkeyup={handleKeyup}
      oninputprevent={handleInputPrevent}
      onsetcursorposition={setInputCursorPosition}
      onfocuscontainer={focusInput}
    />

    {#if settings.showVirtualKeyboard}
      <div class="w-full flex justify-center">
        <VirtualKeyboard
          activeKeys={hintKeys}
          {mode}
          {masteryState}
          {isLeftShiftPressed}
          {isRightShiftPressed}
          onkeyselect={handleVirtualKeySelect}
        />
      </div>
    {/if}
  </div>
</main>

<CurriculumSidebar
  isOpen={showCurriculumSidebar}
  {enabledModuleIds}
  {collapsedCategoryIds}
  {modules}
  {customDecks}
  onclose={closePanel}
  ontogglemodule={toggleModule}
  ontogglecategorycollapse={toggleCategoryCollapse}
  ontogglecategorygroup={toggleCategoryGroup}
  onselectall={selectAllModules}
  ondeselectall={deselectAllModules}
  onopenimportmodal={handleOpenImportDeckModal}
  ondeletecustomdeck={handleDeleteCustomDeck}
/>

<ImportDeckModal
  isOpen={showImportDeckModal}
  onclose={handleCloseImportDeckModal}
  onimport={handleImportDeck}
/>

<SettingsModal
  isOpen={showSettingsModal}
  {settings}
  onclose={closePanel}
  onthemechange={handleThemeChange}
  ontogglepronunciation={togglePronunciation}
  ontoggletranslation={toggleTranslation}
  ontogglevirtualkeyboard={toggleVirtualKeyboard}
  ontogglekeyboardhint={toggleKeyboardHint}
  ontogglekpm={toggleKpm}
  onresetkpm={handleResetKpm}
  onminfontsizechange={handleMinFontSizeChange}
  onmaxfontsizechange={handleMaxFontSizeChange}
  ontogglelockfontsize={handleToggleLockFontSize}
  oncursorcolorchange={handleCursorColorChange}
  ontoggletts={toggleTTS}
  ontogglespeakoncompletion={toggleSpeakOnCompletion}
  ontogglespeakonappearance={toggleSpeakOnAppearance}
  onvoicechange={handleVoiceChange}
  onspeedchange={handleSpeedChange}
/>

<MasterySidebar
  isOpen={showMasterySidebar}
  masteryUnlockedCount={masteryState.unlockedCount}
  {currentStageNumber}
  activeCheckpointId={masteryState.activeCheckpointId ?? activeCheckpoint?.id ?? null}
  activeFocusBatchim={masteryState.activeFocusBatchim ?? null}
  jamoStats={masteryState.jamoStats}
  sentenceCheckpointStats={masteryState.sentenceCheckpointStats}
  speedStore={session.speedStore}
  showKpm={settings.showKpm ?? true}
  collapsedStageIds={collapsedMasteryStageIds}
  onclose={closePanel}
  onmasterylevelchange={handleMasteryLevelChange}
  oncheckpointselect={handleMasteryCheckpointChange}
  onfocusselect={handleMasteryFocusSelect}
  ontogglestagecollapse={toggleMasteryStageCollapse}
/>

<MasteryCompletionModal
  show={showMasteryCompletionModal}
  onClose={handleCompletionModalClose}
  onSwitchToFreeForm={handleCompletionSwitchToFreeForm}
  onOpenMasterySidebar={handleCompletionOpenMasterySidebar}
  onOpenFocusMode={handleCompletionOpenFocusMode}
/>

<WelcomeModal isOpen={showWelcomeModal} onBegin={handleBeginSession} />

<style>
  :global(html, body, #app) {
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  :global(body) {
    font-family:
      'Noto Sans KR',
      'Inter',
      system-ui,
      -apple-system,
      sans-serif;
    background-color: #f9fafb;
  }
  :global(html.dark body) {
    background-color: #111827;
  }
</style>
