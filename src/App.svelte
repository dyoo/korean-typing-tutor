<script lang="ts">
  import { onMount } from 'svelte';
  import contentData from './content.json';
  import { TutorSession } from './lib/tutorSession';
  import type { CurriculumData } from './lib/tutorSession';
  import { loadSettings, saveSettings, applyTheme } from './lib/settings';
  import type { TutorSettings, ThemeMode } from './lib/settings';
  import { calculateTargetCursorIndex, calculateInputCursorIndex, getWordTokens } from './utils/koreanEngine';
  import { getNextRequiredKeys } from './utils/keyboardHelper';
  import { handleTargetCopyEvent } from './utils/clipboard';
  import VirtualKeyboard from './lib/VirtualKeyboard.svelte';
  import CharDisplay from './lib/CharDisplay.svelte';
  import CurriculumSidebar from './lib/CurriculumSidebar.svelte';
  import SettingsModal from './lib/SettingsModal.svelte';
  import {
    CURRICULUM_CATEGORIES,
    ALL_CATEGORY_IDS,
    isGroupAllChecked,
    isGroupSomeChecked,
    getGroupCheckedCount,
    toggleCategoryGroupIds
  } from './utils/curriculumCategories';
  import type { CurriculumCategory } from './utils/curriculumCategories';

  const session = new TutorSession(contentData as CurriculumData, 'all', true);
  const modules = session.getModules();

  const initialSettings = loadSettings();
  let settings = $state<TutorSettings>(initialSettings);
  let showSettingsModal = $state(false);
  let showCurriculumSidebar = $state(false);

  let enabledModuleIds = $state<string[]>(
    Array.isArray(initialSettings.enabledModuleIds)
      ? initialSettings.enabledModuleIds
      : modules.map(m => m.id)
  );

  let currentIndex = $state(session.getCurrentIndex());
  let userInput = $state(session.getUserInput());
  let errors = $state(session.getErrors());
  let currentItem = $state(session.getCurrentItem());
  let isCompleted = $state(session.getIsItemCompleted());
  let inputElement = $state<HTMLInputElement | null>(null);
  let inputContainerElement = $state<HTMLDivElement | null>(null);
  let activeCursorElement = $state<HTMLElement | null>(null);

  let displayText = $derived(session.getDisplayText(currentItem, settings));
  let wordTokens = $derived(getWordTokens(currentItem.target));

  let activeTargetCursorIndex = $derived(
    calculateTargetCursorIndex(currentItem.target, userInput, isCompleted)
  );

  let activeInputCursorIndex = $derived(
    calculateInputCursorIndex(userInput, currentItem.target, isCompleted)
  );

  let activeRequiredKeys = $derived(
    getNextRequiredKeys(currentItem.target, userInput, isCompleted)
  );

  $effect(() => {
    if (userInput !== undefined && activeInputCursorIndex !== undefined && activeCursorElement && inputContainerElement) {
      activeCursorElement.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
    }
  });

  onMount(() => {
    session.setFilter(enabledModuleIds, true);
    syncState();
    applyTheme(settings.theme);
    inputElement?.focus();
  });

  function handleWindowClick(e: MouseEvent) {
    const target = e.target as HTMLElement | null;

    if (showSettingsModal && target && !target.closest('.settings-modal') && !target.closest('.settings-btn')) {
      showSettingsModal = false;
    }

    focusInput(e);
  }

  function focusInput(e?: MouseEvent) {
    if (window.getSelection() && window.getSelection()?.toString().trim().length! > 0) {
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
    currentIndex = session.getCurrentIndex();
    userInput = session.getUserInput();
    errors = session.getErrors();
    currentItem = session.getCurrentItem();
    isCompleted = session.getIsItemCompleted();
  }

  function toggleModule(modId: string) {
    if (enabledModuleIds.includes(modId)) {
      if (enabledModuleIds.length === 1) return;
      enabledModuleIds = enabledModuleIds.filter(id => id !== modId);
    } else {
      enabledModuleIds = [...enabledModuleIds, modId];
    }
    settings = { ...settings, enabledModuleIds };
    saveSettings(settings);
    session.setFilter(enabledModuleIds, true);
    syncState();
  }

  let collapsedCategoryIds = $state<string[]>(
    loadSettings().collapsedCategoryIds ?? ALL_CATEGORY_IDS
  );

  function toggleCategoryCollapse(categoryId: string) {
    if (collapsedCategoryIds.includes(categoryId)) {
      collapsedCategoryIds = collapsedCategoryIds.filter(id => id !== categoryId);
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
    enabledModuleIds = modules.map(m => m.id);
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

  function toggleModuleModal(e: MouseEvent) {
    e.stopPropagation();
    showModuleModal = !showModuleModal;
    if (showModuleModal) {
      showSettingsModal = false;
    } else {
      inputElement?.focus();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab' || e.key === 'Escape' || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Enter' || e.key.length === 1) {
      e.preventDefault();
      session.processKey(e.key);
      syncState();
    }
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

  function handleVirtualKeySelect(key: string) {
    session.processKey(key);
    syncState();
    inputElement?.focus();
  }

  function handleThemeChange(theme: ThemeMode) {
    settings = { ...settings, theme };
    saveSettings(settings);
    applyTheme(settings.theme);
    syncState();
  }

  function toggleSettingsModal(e: MouseEvent) {
    e.stopPropagation();
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
    const sel = window.getSelection();
    handleTargetCopyEvent(e, currentItem.target, sel);
  }
</script>

<svelte:window onclick={handleWindowClick} />

<main oncopy={handleCopy} class="flex flex-col items-center justify-between min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-4 py-4 md:px-8 md:py-6 overflow-x-hidden transition-colors">
  <div class="w-full max-w-7xl flex items-center justify-between gap-4 shrink-0">
    <div class="relative flex items-center gap-3">
      <button
        type="button"
        onclick={toggleCurriculumSidebar}
        onmousedown={(e) => e.stopPropagation()}
        class="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg px-3 py-1.5 hover:border-blue-600 dark:hover:border-blue-500 focus:outline-none shadow-sm text-sm cursor-pointer"
        aria-label="Open Curriculum Sidebar"
      >
        <svg class="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span class="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 hidden sm:inline">
          Curriculum
        </span>
        <span class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800">
          {enabledModuleIds.length}/{modules.length}
        </span>
      </button>
    </div>

    <SettingsModal
      isOpen={showSettingsModal}
      {settings}
      ontogglesettings={toggleSettingsModal}
      onclose={() => { showSettingsModal = false; inputElement?.focus(); }}
      onthemechange={handleThemeChange}
      ontogglepronunciation={togglePronunciation}
      ontoggletranslation={toggleTranslation}
      ontogglevirtualkeyboard={toggleVirtualKeyboard}
    />
  </div>

  <div class="w-full max-w-full flex-1 flex flex-col items-center justify-start py-4 px-2 md:px-8 overflow-hidden">
    <div class="target-display relative flex flex-wrap break-keep justify-center gap-y-4 font-bold tracking-normal text-center select-text w-full max-w-full text-giant">
      {#each wordTokens as token}
        {#if token.type === 'space'}
          {@const i = token.indices[0]}
          {@const isError = errors.find(e => e.index === i)?.isError ?? false}
          {@const isCurrent = (i === activeTargetCursorIndex && !isCompleted)}
          
          <CharDisplay
            char=" "
            {isError}
            {isCurrent}
            variant="target"
            dataIndex={i}
          />
        {:else}
          <span class="inline-flex whitespace-nowrap">
            {#each token.indices as i}
              {@const char = currentItem.target[i]}
              {@const isError = errors.find(e => e.index === i)?.isError ?? false}
              {@const isCurrent = (i === activeTargetCursorIndex && !isCompleted)}
              
              <CharDisplay
                {char}
                {isError}
                {isCurrent}
                variant="target"
                dataIndex={i}
              />
            {/each}
          </span>
        {/if}
      {/each}
    </div>

    {#if displayText.trim().length > 0}
      <div class="text-subgiant text-gray-500 dark:text-gray-400 font-medium italic mt-6 text-center tracking-wide min-h-[3rem] h-auto flex flex-col items-center justify-center select-text max-w-full px-4 py-2">
        {displayText}
      </div>
    {/if}

    <div class="flex-1 min-h-[1rem]"></div>

    <div class="mb-2 h-14 flex items-center justify-center shrink-0">
      {#if isCompleted}
        <span class="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-5 py-2 rounded-full text-base md:text-lg border border-emerald-300 dark:border-emerald-800 shadow-sm text-center">
          ✓ Correct! Press <kbd class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border dark:border-gray-700 px-2 py-0.5 rounded shadow text-sm md:text-base">Enter ↵</kbd> or <kbd class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border dark:border-gray-700 px-2 py-0.5 rounded shadow text-sm md:text-base">Space</kbd>
        </span>
      {:else}
        <button
          type="button"
          onclick={handleSkip}
          onmousedown={(e) => e.stopPropagation()}
          class="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium px-4 py-1.5 rounded-full text-xs md:text-sm border border-gray-300 dark:border-gray-700 shadow-2xs transition-colors cursor-pointer"
        >
          <span>Skip exercise</span>
          <span>➔</span>
        </button>
      {/if}
    </div>
  </div>

  <div class="w-full max-w-5xl md:max-w-6xl lg:max-w-7xl flex flex-col items-center pb-4 shrink-0 px-2 md:px-8">
    <div class="w-full h-24 md:h-28 relative flex justify-center items-center bg-white dark:bg-gray-800 border-b-8 border-gray-300 dark:border-gray-700 focus-within:border-blue-600 dark:focus-within:border-blue-500 font-bold shadow-md rounded-t-xl px-4 overflow-hidden">
      {#if userInput.length === 0}
        <span class="text-xl md:text-2xl text-gray-400 dark:text-gray-500 font-normal text-center whitespace-nowrap select-none">
          {enabledModuleIds.length === 0 ? "Select a module above to begin..." : (isCompleted ? "Press Enter or Space for next word" : "Start typing...")}
        </span>
      {:else}
        <div
          bind:this={inputContainerElement}
          class="flex flex-nowrap items-center whitespace-nowrap max-w-full overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-giant font-bold"
        >
          {#each userInput.split('') as char, i}
            {@const isError = errors.find(e => e.index === i)?.isError ?? false}
            {@const isCurrent = (i === activeInputCursorIndex && !isCompleted)}
            
            {#if isCurrent}
              <CharDisplay
                bind:elementRef={activeCursorElement}
                {char}
                {isError}
                {isCurrent}
                variant="input"
              />
            {:else}
              <CharDisplay
                {char}
                {isError}
                {isCurrent}
                variant="input"
              />
            {/if}
          {/each}

          {#if activeInputCursorIndex === userInput.length && !isCompleted}
            <span
              bind:this={activeCursorElement}
              class="relative inline-flex flex-col items-center pb-2 pt-1 mx-0.5 min-w-[0.7em]"
            >
              <span class="opacity-0 select-none">&nbsp;</span>
              <span class="absolute bottom-0 h-[3px] w-[0.7em] bg-blue-600 dark:bg-blue-500 rounded-full"></span>
            </span>
          {/if}
        </div>
      {/if}

      <input
        bind:this={inputElement}
        type="text"
        class="absolute inset-0 w-full h-full opacity-0 cursor-text"
        value={userInput}
        onkeydown={handleKeydown}
        oninput={handleInputPrevent}
        autocomplete="off"
        autocorrect="off"
        autocapitalize="off"
        spellcheck="false"
      />
    </div>

    {#if settings.showVirtualKeyboard}
      <div class="w-full flex justify-center mt-3">
        <VirtualKeyboard activeKeys={activeRequiredKeys} onkeyselect={handleVirtualKeySelect} />
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
          <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
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
    font-family: 'Noto Sans KR', 'Inter', system-ui, -apple-system, sans-serif;
    background-color: #f9fafb;
  }
  :global(html.dark body) {
    background-color: #111827;
  }
</style>
