<script lang="ts">
  import { onMount } from 'svelte';
  import contentData from './content';
  import { TutorSession } from './lib/tutorSession';
  import type { CurriculumData } from './lib/tutorSession';
  import { loadSettings, saveSettings, applyTheme } from './lib/settings';
  import type { TutorSettings, ThemeMode } from './lib/settings';
  import {
    calculateTargetCursorIndex,
    calculateInputCursorIndex,
    getWordTokens,
  } from './utils/cursorHelper';
  import { getNextRequiredKeys } from './utils/keyboardHelper';
  import { handleCopyEvent } from './utils/clipboard';
  import { JAMO_PROGRESSION_ORDER, getActiveLearningJamo } from './utils/jamoMastery';
  import VirtualKeyboard from './lib/VirtualKeyboard.svelte';
  import CurriculumSidebar from './lib/CurriculumSidebar.svelte';
  import TargetDisplay from './lib/TargetDisplay.svelte';
  import ExercisePrompt from './lib/ExercisePrompt.svelte';
  import TopBar from './lib/TopBar.svelte';
  import InputDisplay from './lib/InputDisplay.svelte';
  import { ALL_CATEGORY_IDS, toggleCategoryGroupIds } from './utils/curriculumCategories';
  import type { CurriculumCategory } from './utils/curriculumCategories';
  import type { CursorColorMode } from './utils/cursorColor';

  const session = new TutorSession(contentData as CurriculumData, 'all', true);
  const modules = session.getModules();

  const initialSettings = loadSettings();
  let settings = $state<TutorSettings>(initialSettings);
  let showSettingsModal = $state(false);
  let showCurriculumSidebar = $state(false);

  let enabledModuleIds = $state<string[]>(
    Array.isArray(initialSettings.enabledModuleIds)
      ? initialSettings.enabledModuleIds
      : modules.map((m) => m.id),
  );

  let mode = $state(session.getMode());
  let masteryState = $state(session.getMasteryState());

  let userInput = $state(session.getUserInput());
  let errors = $state(session.getErrors());
  let currentItem = $state(session.getCurrentItem());
  let isCompleted = $state(session.getIsItemCompleted());
  let inputElement = $state<HTMLInputElement | null>(null);

  let isLeftShiftPressed = $state(false);
  let isRightShiftPressed = $state(false);

  let sessionCursorIndex = $state(session.getInputCursorIndex());

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

  // Map errors to O(1) lookups by index to avoid O(N^2) .find() calls in child {#each} loops.
  let errorMap = $derived(new Map(errors.map((e) => [e.index, e.isError])));

  let activeLearningJamo = $derived(getActiveLearningJamo(masteryState));

  onMount(() => {
    session.setFilter(enabledModuleIds, true);
    syncState();
    applyTheme(settings.theme);
    inputElement?.focus();

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
    inputElement?.focus();
  }

  function syncState() {
    userInput = session.getUserInput();
    sessionCursorIndex = session.getInputCursorIndex();
    errors = session.getErrors();
    currentItem = session.getCurrentItem();
    isCompleted = session.getIsItemCompleted();
    mode = session.getMode();
    // Assign reference directly; Svelte 5 $state is deeply reactive, so mutations in TutorSession will trigger updates without needing a new object every keystroke.
    masteryState = session.getMasteryState();
  }

  function setInputCursorPosition(index: number) {
    session.setInputCursorIndex(index);
    syncState();
    inputElement?.focus();
  }

  function toggleMode() {
    const newMode = mode === 'curriculum' ? 'mastery' : 'curriculum';
    session.setMode(newMode);
    syncState();
    inputElement?.focus();
  }

  function handleMasteryLevelChange(level: number) {
    session.setMasteryProgressionLevel(level);
    syncState();
    inputElement?.focus();
  }

  function toggleModule(modId: string) {
    if (enabledModuleIds.includes(modId)) {
      if (enabledModuleIds.length === 1) return;
      enabledModuleIds = enabledModuleIds.filter((id) => id !== modId);
    } else {
      enabledModuleIds = [...enabledModuleIds, modId];
    }
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter(enabledModuleIds, true);
    syncState();
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
    syncState();
  }

  function selectAllModules() {
    enabledModuleIds = modules.map((m) => m.id);
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter('all', true);
    syncState();
  }

  function deselectAllModules() {
    enabledModuleIds = [];
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter(enabledModuleIds, true);
    syncState();
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
      session.processKey(e.key);
      syncState();
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
    session.advanceLevel();
    syncState();
    inputElement?.focus();
  }

  function togglePronunciation() {
    settings = { ...settings, showPronunciation: !settings.showPronunciation };
    saveSettings(settings);
    syncState();
  }

  function toggleTranslation() {
    settings = { ...settings, showTranslation: !settings.showTranslation };
    saveSettings(settings);
    syncState();
  }

  function toggleVirtualKeyboard() {
    settings = { ...settings, showVirtualKeyboard: !settings.showVirtualKeyboard };
    saveSettings(settings);
    syncState();
  }

  function handleThemeChange(theme: ThemeMode) {
    settings = { ...settings, theme };
    saveSettings(settings);
    applyTheme(theme);
    syncState();
  }

  function handleMinFontSizeChange(minFontSizeRem: number) {
    settings = { ...settings, minFontSizeRem };
    saveSettings(settings);
    syncState();
  }

  function handleMaxFontSizeChange(maxFontSizeRem: number) {
    settings = { ...settings, maxFontSizeRem };
    saveSettings(settings);
    syncState();
  }

  function handleToggleLockFontSize() {
    settings = { ...settings, lockFontSize: !settings.lockFontSize };
    saveSettings(settings);
    syncState();
  }

  function handleCursorColorChange(cursorColor: CursorColorMode) {
    settings = { ...settings, cursorColor };
    saveSettings(settings);
    syncState();
  }

  function handleVirtualKeySelect(key: string) {
    session.processKey(key);
    syncState();
    inputElement?.focus();
  }

  function toggleSettingsModal(e?: MouseEvent) {
    e?.stopPropagation();
    showSettingsModal = !showSettingsModal;
    if (showSettingsModal) {
      showCurriculumSidebar = false;
    } else {
      inputElement?.focus();
    }
  }

  function toggleCurriculumSidebar(e?: MouseEvent) {
    e?.stopPropagation();
    showCurriculumSidebar = !showCurriculumSidebar;
    if (showCurriculumSidebar) {
      showSettingsModal = false;
    } else {
      inputElement?.focus();
    }
  }

  function closeCurriculumSidebar() {
    showCurriculumSidebar = false;
    inputElement?.focus();
  }

  function handleCopy(e: ClipboardEvent) {
    handleCopyEvent(e);
  }
</script>

<svelte:window onclick={handleWindowClick} onkeyup={handleKeyup} onblur={handleWindowBlur} />

<main
  oncopy={handleCopy}
  class="flex flex-col items-center justify-between h-screen max-h-screen h-dvh max-h-dvh bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-3 md:px-8 md:py-5 overflow-hidden transition-colors"
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
    {showSettingsModal}
    {settings}
    ontogglecurriculum={toggleCurriculumSidebar}
    ontogglesettings={toggleSettingsModal}
    onclosesettings={() => {
      showSettingsModal = false;
      inputElement?.focus();
    }}
    onthemechange={handleThemeChange}
    ontogglepronunciation={togglePronunciation}
    ontoggletranslation={toggleTranslation}
    ontogglevirtualkeyboard={toggleVirtualKeyboard}
    onminfontsizechange={handleMinFontSizeChange}
    onmaxfontsizechange={handleMaxFontSizeChange}
    ontogglelockfontsize={handleToggleLockFontSize}
    oncursorcolorchange={handleCursorColorChange}
    onmasterylevelchange={handleMasteryLevelChange}
  />

  <div
    class="w-full max-w-full flex-1 min-h-0 flex flex-col items-center justify-between py-2 md:py-4 px-2 md:px-8 overflow-hidden"
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
    />

    <ExercisePrompt {isCompleted} onskip={handleSkip} />
  </div>

  <div
    class="w-full max-w-5xl md:max-w-6xl lg:max-w-7xl flex flex-col items-center pb-2 md:pb-4 shrink-0 px-2 md:px-8"
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
      <div class="w-full flex justify-center mt-3">
        <VirtualKeyboard
          activeKeys={activeRequiredKeys}
          {mode}
          {masteryState}
          {isLeftShiftPressed}
          {isRightShiftPressed}
          onkeyselect={handleVirtualKeySelect}
        />
      </div>
    {/if}

    <div class="flex justify-end items-center w-full mt-4">
      <a
        href="https://github.com/dyoo/korean-typing-tutor"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors normal-case font-sans font-medium text-xs border border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 rounded-full px-3 py-1 bg-white dark:bg-gray-800 shadow-2xs"
        onclick={(e) => e.stopPropagation()}
        onmousedown={(e) => e.stopPropagation()}
      >
        <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
          />
        </svg>
        <span>GitHub</span>
      </a>
    </div>
  </div>
</main>

<CurriculumSidebar
  isOpen={showCurriculumSidebar}
  {enabledModuleIds}
  {collapsedCategoryIds}
  {modules}
  onclose={closeCurriculumSidebar}
  ontogglemodule={toggleModule}
  ontogglecategorycollapse={toggleCategoryCollapse}
  ontogglecategorygroup={toggleCategoryGroup}
  onselectall={selectAllModules}
  ondeselectall={deselectAllModules}
/>

<style>
  :global(body) {
    margin: 0;
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
