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
  let activeJamoProgress = $derived(
    activeLearningJamo ? calculateJamoProgress(masteryState.jamoStats[activeLearningJamo.jamo]) : 0,
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

  let collapsedCategoryIds = $state<string[]>(
    loadSettings().collapsedCategoryIds ?? ALL_CATEGORY_IDS,
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
    ttsController.stop();
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

  function handleCompletionModalClose() {
    showMasteryCompletionModal = false;
    focusInputElement();
  }

  function updateSetting<K extends keyof TutorSettings>(key: K, value: TutorSettings[K]) {
    settings = { ...settings, [key]: value };
    saveSettings(settings);
  }

  let showTTSDownloadModal = $state(false);
  let isTTSSpeaking = $derived(ttsController.getIsSpeaking());

  async function toggleTTS() {
    if (!settings.enableTTS) {
      // User is enabling TTS; verify if model is already downloaded to avoid redundant prompts
      let isCached = ttsController.getIsCached();
      if (!isCached && !ttsController.getIsLoaded()) {
        isCached = await ttsController.checkCache();
      }
      if (!ttsController.getIsLoaded() && !isCached) {
        showTTSDownloadModal = true;
      } else {
        updateSetting('enableTTS', true);
      }
    } else {
      updateSetting('enableTTS', false);
      ttsController.stop();
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
    if (preloadDebounceTimer) {
      clearTimeout(preloadDebounceTimer);
      preloadDebounceTimer = null;
    }
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
  let preloadDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  // Pre-synthesize and cache audio in the background whenever the exercise prompt changes,
  // so clicking the audio button plays immediately without synthesis delay.
  // Cancels any active synthesis or playback from the previous exercise.
  // Uses a 500ms debounce to avoid spamming the Web Worker during rapid skipping.
  $effect(() => {
    const targetText = currentItem?.target;
    const isEnabled = settings.enableTTS;
    const voice = settings.ttsVoice ?? 'jm_kumo';
    const speed = settings.ttsSpeed ?? 1.0;

    if (preloadDebounceTimer) {
      clearTimeout(preloadDebounceTimer);
      preloadDebounceTimer = null;
    }

    untrack(() => {
      if (targetText !== lastPromptTarget) {
        lastPromptTarget = targetText || '';
        ttsController.stop();
      }

      if (isEnabled && targetText) {
        preloadDebounceTimer = setTimeout(() => {
          ttsController.preload(targetText, voice, speed);
          preloadDebounceTimer = null;
        }, 500);
      }
    });

    return () => {
      if (preloadDebounceTimer) {
        clearTimeout(preloadDebounceTimer);
        preloadDebounceTimer = null;
      }
    };
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
  class="flex flex-col items-center justify-between h-full h-svh max-h-svh bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[env(safe-area-inset-bottom,0px)] md:px-8 md:pt-5 overflow-hidden transition-colors"
>
  <TopBar
    {mode}
    ontogglemode={toggleMode}
    enabledModuleCount={enabledModuleIds.length}
    totalModuleCount={modules.length}
    masteryUnlockedCount={masteryState.unlockedCount}
    masteryTotalCount={JAMO_PROGRESSION_ORDER.length}
    activeJamoChar={activeLearningJamo?.jamo ?? null}
    activeLearningCombination={activeLearningJamo?.combination}
    {activeJamoProgress}
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
      onspeak={speakCurrentPrompt}
    />

    <ExercisePrompt {isCompleted} onskip={handleSkip} />
  </div>

  <div
    class="w-full max-w-5xl md:max-w-6xl lg:max-w-7xl flex flex-col items-center pb-0 sm:pb-2 md:pb-4 shrink-0 px-2 md:px-8"
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
  jamoStats={masteryState.jamoStats}
  sentenceCheckpointStats={masteryState.sentenceCheckpointStats}
  onclose={closePanel}
  onmasterylevelchange={handleMasteryLevelChange}
  oncheckpointselect={handleMasteryCheckpointChange}
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
/>

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
