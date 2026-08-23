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
  import TTSDownloadModal from './lib/TTSDownloadModal.svelte';
  import MasteryCompletionModal from './lib/MasteryCompletionModal.svelte';
  import WelcomeModal from './lib/WelcomeModal.svelte';
  import { ttsController } from './utils/ttsController.svelte';
  import { ALL_CATEGORY_IDS, toggleCategoryGroupIds } from './utils/curriculumCategories';
  import type { CurriculumCategory } from './utils/curriculumCategories';
  import type { CursorColorMode } from './utils/cursorColor';

  const session = new TutorSession(contentData as CurriculumData, 'all', true);
  const modules = session.getModules();

  const initialSettings = loadSettings();
  let settings = $state<TutorSettings>(initialSettings);
  type ActivePanel = 'none' | 'settings' | 'curriculum' | 'mastery';
  let activePanel = $state<ActivePanel>('none');
  let showSettingsModal = $derived(activePanel === 'settings');
  let showCurriculumSidebar = $derived(activePanel === 'curriculum');
  let showMasterySidebar = $derived(activePanel === 'mastery');
  let showMasteryCompletionModal = $state(false);
  let showWelcomeModal = $state(true);

  let enabledModuleIds = $state<string[]>(
    Array.isArray(initialSettings.enabledModuleIds)
      ? initialSettings.enabledModuleIds
      : modules.map((m) => m.id),
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
  let activeJamoChar = $derived(
    activeLearningJamo?.jamo ?? activeFocusBatchimItem?.batchim ?? null,
  );
  let activeLearningCombination = $derived(
    activeLearningJamo?.combination ?? activeFocusBatchimItem?.combination,
  );
  let activeJamoLabel = $derived(activeFocusBatchimItem ? 'Batchim:' : 'Focus:');
  let isPostGame = $derived(activeMasteryTarget.type === 'focus');
  let activeTargetRemaining = $derived(
    activeLearningJamo
      ? `${Math.min(20, masteryState.jamoStats[activeLearningJamo.jamo]?.totalAttempts ?? 0)}/20`
      : null,
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
    ttsController.checkCache();
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
    ttsController.unlockAudio();
    session.resetSessionState();
    showWelcomeModal = false;
    focusInputElement();
    if (settings.enableTTS && settings.speakOnAppearance) {
      speakCurrentPrompt();
    }
  }

  function handleWindowClick(e: MouseEvent) {
    ttsController.unlockAudio();
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
    ttsController.cancelBatchPreload();
    const newMode = mode === 'curriculum' ? 'mastery' : 'curriculum';
    session.setMode(newMode);
    focusInputElement();
  }

  function handleMasteryLevelChange(level: number) {
    ttsController.cancelBatchPreload();
    session.setMasteryProgressionLevel(level);
    focusInputElement();
  }

  function handleMasteryCheckpointChange(checkpointId: string) {
    ttsController.cancelBatchPreload();
    session.setMasteryCheckpointLevel(checkpointId);
    focusInputElement();
  }

  function handleMasteryFocusSelect(batchim: string) {
    ttsController.cancelBatchPreload();
    session.setMasteryFocusBatchim(batchim);
    focusInputElement();
  }

  function toggleModule(modId: string) {
    ttsController.cancelBatchPreload();
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
    ttsController.cancelBatchPreload();
    enabledModuleIds = toggleCategoryGroupIds(category, enabledModuleIds);
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter(enabledModuleIds, true);
  }

  function selectAllModules() {
    ttsController.cancelBatchPreload();
    enabledModuleIds = modules.map((m) => m.id);
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter('all', true);
  }

  function deselectAllModules() {
    ttsController.cancelBatchPreload();
    enabledModuleIds = [];
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter(enabledModuleIds, true);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (
      showWelcomeModal ||
      activePanel !== 'none' ||
      showTTSDownloadModal ||
      showMasteryCompletionModal
    ) {
      if (showWelcomeModal && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')) {
        e.preventDefault();
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
    ttsController.unlockAudio();
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

  let showTTSDownloadModal = $state(false);
  let isTTSSpeaking = $derived(ttsController.isSpeaking);
  let isTTSLoading = $derived(
    settings.enableTTS &&
      ttsController.isAudioLoading(
        currentItem?.target,
        settings.ttsVoice,
        settings.ttsSpeed,
      ),
  );

  async function toggleTTS() {
    if (!settings.enableTTS) {
      // User is enabling TTS; verify if model is already downloaded to avoid redundant prompts
      let isCached = ttsController.isCached;
      if (!isCached && !ttsController.isLoaded) {
        isCached = await ttsController.checkCache();
      }
      if (!ttsController.isLoaded && !isCached) {
        showTTSDownloadModal = true;
      } else {
        updateSetting('enableTTS', true);
      }
    } else {
      updateSetting('enableTTS', false);
      ttsController.terminate();
    }
  }

  async function handleConfirmTTSDownload() {
    try {
      await ttsController.loadModel();
      updateSetting('enableTTS', true);
      showTTSDownloadModal = false;
    } catch {
      // Error is displayed inside modal
    }
  }

  function handleCancelTTSDownload() {
    ttsController.cancelLoading();
    updateSetting('enableTTS', false);
    showTTSDownloadModal = false;
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

  async function handleClearTTSCache() {
    await ttsController.clearCache();
    updateSetting('enableTTS', false);
  }

  function speakCurrentPrompt() {
    console.debug('[App] speakCurrentPrompt called for:', currentItem?.target);
    if (currentItem && currentItem.target) {
      ttsController.speak(
        currentItem.target,
        settings.ttsVoice ?? 'jm_kumo',
        settings.ttsSpeed ?? 1.0,
      );
    }
    focusInputElement();
  }

  let lastPromptTarget = '';

  // Pre-synthesize and cache audio in the background whenever the exercise prompt changes,
  // so clicking the audio button or completing the word plays immediately with 0ms delay.
  // Continuously buffers the next 5 upcoming words in the background Web Worker.
  $effect(() => {
    const targetText = currentItem?.target;
    const isEnabled = settings.enableTTS;
    const speakOnAppear = settings.speakOnAppearance;
    const voice = settings.ttsVoice ?? 'jm_kumo';
    const speed = settings.ttsSpeed ?? 1.0;

    untrack(() => {
      const isNewTarget = targetText !== lastPromptTarget;
      if (isNewTarget) {
        lastPromptTarget = targetText || '';
        ttsController.stopAudio();
      }

      if (isEnabled && targetText) {
        // Preload active target immediately
        ttsController.preload(targetText, voice, speed);
        // Continuously buffer upcoming 5 exercises in background worker
        const upcomingTargets = session.getUpcomingItems(5).map((i) => i.target);
        if (upcomingTargets.length > 0) {
          void ttsController.preloadBatch(upcomingTargets, voice, speed);
        }

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
    {activeJamoProgress}
    {activeTargetRemaining}
    {isPostGame}
    {activeCheckpointTitle}
    {activeCheckpointProgress}
    {showSettingsModal}
    {settings}
    ontogglecurriculum={toggleCurriculumSidebar}
    ontogglemastery={toggleMasterySidebar}
    ontogglesettings={toggleSettingsModal}
    onclosesettings={closePanel}
    onthemechange={handleThemeChange}
    ontogglepronunciation={togglePronunciation}
    ontoggletranslation={toggleTranslation}
    ontogglevirtualkeyboard={toggleVirtualKeyboard}
    ontogglekeyboardhint={toggleKeyboardHint}
    onminfontsizechange={handleMinFontSizeChange}
    onmaxfontsizechange={handleMaxFontSizeChange}
    ontogglelockfontsize={handleToggleLockFontSize}
    oncursorcolorchange={handleCursorColorChange}
    ontoggletts={toggleTTS}
    ontogglespeakoncompletion={toggleSpeakOnCompletion}
    ontogglespeakonappearance={toggleSpeakOnAppearance}
    onvoicechange={handleVoiceChange}
    onspeedchange={handleSpeedChange}
    onclearttscache={handleClearTTSCache}
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
  onclose={closePanel}
  ontogglemodule={toggleModule}
  ontogglecategorycollapse={toggleCategoryCollapse}
  ontogglecategorygroup={toggleCategoryGroup}
  onselectall={selectAllModules}
  ondeselectall={deselectAllModules}
/>

<MasterySidebar
  isOpen={showMasterySidebar}
  masteryUnlockedCount={masteryState.unlockedCount}
  activeCheckpointId={masteryState.activeCheckpointId ?? activeCheckpoint?.id ?? null}
  activeFocusBatchim={masteryState.activeFocusBatchim ?? null}
  jamoStats={masteryState.jamoStats}
  sentenceCheckpointStats={masteryState.sentenceCheckpointStats}
  collapsedStageIds={collapsedMasteryStageIds}
  onclose={closePanel}
  onmasterylevelchange={handleMasteryLevelChange}
  oncheckpointselect={handleMasteryCheckpointChange}
  onfocusselect={handleMasteryFocusSelect}
  ontogglestagecollapse={toggleMasteryStageCollapse}
/>

<TTSDownloadModal
  isOpen={showTTSDownloadModal}
  onConfirm={handleConfirmTTSDownload}
  onCancel={handleCancelTTSDownload}
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
