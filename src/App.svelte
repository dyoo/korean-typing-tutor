<script lang="ts">
  import { onMount } from 'svelte';
  import contentData from './content.json';
  import { TutorSession } from './lib/tutorSession';
  import type { CurriculumData } from './lib/tutorSession';
  import { loadSettings, saveSettings, applyTheme } from './lib/settings';
  import type { TutorSettings, ThemeMode } from './lib/settings';
  import { calculateTargetCursorIndex, calculateInputCursorIndex, getWordTokens } from './utils/koreanEngine';
  import { handleTargetCopyEvent } from './utils/clipboard';

  const session = new TutorSession(contentData as CurriculumData, 'all', true);
  const modules = session.getModules();

  const initialSettings = loadSettings();
  let settings = $state<TutorSettings>(initialSettings);
  let showSettingsModal = $state(false);
  let showModuleModal = $state(false);

  let enabledModuleIds = $state<string[]>(
    initialSettings.enabledModuleIds && initialSettings.enabledModuleIds.length > 0
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

    if (showModuleModal && target && !target.closest('.module-modal') && !target.closest('.module-btn')) {
      showModuleModal = false;
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
        target.closest('.module-modal')
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

  interface CurriculumCategory {
    id: string;
    name: string;
    moduleIds: string[];
  }

  const CURRICULUM_CATEGORIES: CurriculumCategory[] = [
    {
      id: 'beginner',
      name: 'Beginner Fundamentals',
      moduleIds: ['b1_vowels', 'b2_syllables_simple', 'b3_complex_vowels', 'b4_no_batchim_words']
    },
    {
      id: 'batchim',
      name: 'Final Consonants (받침)',
      moduleIds: ['l2a_simple_batchim', 'l2b_complex_batchim']
    },
    {
      id: 'core',
      name: 'Core Vocabulary & Verbs',
      moduleIds: ['l3', 'l4', 'l5']
    },
    {
      id: 'topik1',
      name: 'TOPIK I (Elementary)',
      moduleIds: ['topik1_vocab', 'topik1_verbs', 'topik_grammar']
    },
    {
      id: 'practical',
      name: 'Practical & Culture',
      moduleIds: ['sejong_phrases', 'kpop_slang', 'korean_culture']
    },
    {
      id: 'topik2',
      name: 'TOPIK II & Advanced',
      moduleIds: ['topik2_vocab', 'korean_proverbs', 'topik2_passages']
    }
  ];

  function isGroupAllChecked(category: CurriculumCategory): boolean {
    return category.moduleIds.every(id => enabledModuleIds.includes(id));
  }

  function isGroupSomeChecked(category: CurriculumCategory): boolean {
    const checkedCount = category.moduleIds.filter(id => enabledModuleIds.includes(id)).length;
    return checkedCount > 0 && checkedCount < category.moduleIds.length;
  }

  function toggleCategoryGroup(category: CurriculumCategory) {
    const allChecked = isGroupAllChecked(category);
    if (allChecked) {
      enabledModuleIds = enabledModuleIds.filter(id => !category.moduleIds.includes(id));
    } else {
      const newSet = new Set([...enabledModuleIds, ...category.moduleIds]);
      enabledModuleIds = Array.from(newSet);
    }
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

  function handleThemeChange(e: Event) {
    const theme = (e.target as HTMLSelectElement).value as ThemeMode;
    settings = { ...settings, theme };
    saveSettings(settings);
    applyTheme(settings.theme);
    syncState();
  }

  function toggleSettingsModal(e: MouseEvent) {
    e.stopPropagation();
    showSettingsModal = !showSettingsModal;
    if (showSettingsModal) {
      showModuleModal = false;
    } else {
      inputElement?.focus();
    }
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
      <span class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono hidden sm:inline">Curriculum:</span>
      <button
        type="button"
        onclick={toggleModuleModal}
        onmousedown={(e) => e.stopPropagation()}
        class="module-btn flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg px-3 py-1.5 hover:border-blue-600 dark:hover:border-blue-500 focus:outline-none shadow-sm text-sm cursor-pointer"
        aria-label="Select Modules"
      >
        <span class="truncate max-w-[160px] sm:max-w-[240px]">
          {enabledModuleIds.length === modules.length
            ? 'All Modules Enabled'
            : (enabledModuleIds.length === 0
                ? 'No Modules Selected'
                : (enabledModuleIds.length === 1
                    ? (modules.find(m => m.id === enabledModuleIds[0])?.title ?? '1 Module Selected')
                    : `${enabledModuleIds.length} Modules Enabled`))}
        </span>
        <svg class="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {#if showModuleModal}
        <div
          role="region"
          aria-label="Module Selector Panel"
          class="module-modal absolute left-0 top-11 z-50 w-80 sm:w-96 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 flex flex-col gap-3 max-h-[75vh]"
          onclick={(e) => e.stopPropagation()}
          onkeydown={(e) => e.stopPropagation()}
          onmousedown={(e) => e.stopPropagation()}
        >
          <div class="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 pb-2">
            <span class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono">
              Enabled ({enabledModuleIds.length}/{modules.length})
            </span>
            <div class="flex items-center gap-2">
              <button
                type="button"
                onclick={selectAllModules}
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Select All
              </button>
              <span class="text-xs text-gray-300 dark:text-gray-600">•</span>
              <button
                type="button"
                onclick={deselectAllModules}
                class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Select None
              </button>
            </div>
          </div>

          <div class="overflow-y-auto flex flex-col gap-3 pr-1 max-h-[55vh] [scrollbar-width:thin]">
            {#each CURRICULUM_CATEGORIES as category}
              {@const allChecked = isGroupAllChecked(category)}
              {@const someChecked = isGroupSomeChecked(category)}
              {@const count = category.moduleIds.filter(id => enabledModuleIds.includes(id)).length}

              <div class="flex flex-col border border-gray-200 dark:border-gray-700/60 rounded-lg p-2.5 bg-gray-50/60 dark:bg-gray-800/40 gap-1.5">
                <div class="flex items-center justify-between font-bold text-xs text-gray-800 dark:text-gray-200 pb-1 border-b border-gray-200/60 dark:border-gray-700/50">
                  <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={allChecked}
                      indeterminate={someChecked}
                      onchange={() => toggleCategoryGroup(category)}
                      class="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0"
                    />
                    <span class="font-bold text-xs uppercase tracking-wide text-gray-800 dark:text-gray-200">
                      {category.name}
                    </span>
                  </label>
                  <span class="text-[10px] font-mono font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                    {count}/{category.moduleIds.length}
                  </span>
                </div>

                <div class="flex flex-col gap-1 pl-3 border-l-2 border-blue-500/30 dark:border-blue-400/30 ml-1.5 mt-0.5">
                  {#each category.moduleIds as modId}
                    {@const mod = modules.find(m => m.id === modId)}
                    {#if mod}
                      {@const isEnabled = enabledModuleIds.includes(mod.id)}
                      <label class="flex items-start gap-2.5 p-1 rounded hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none">
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onchange={() => toggleModule(mod.id)}
                          class="mt-0.5 w-3.5 h-3.5 text-blue-600 rounded cursor-pointer shrink-0"
                        />
                        <div class="flex flex-col">
                          <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                            {mod.title}
                          </span>
                          {#if mod.description}
                            <span class="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                              {mod.description}
                            </span>
                          {/if}
                        </div>
                      </label>
                    {/if}
                  {/each}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <div class="relative flex items-center gap-2">
      <button
        type="button"
        onclick={toggleSettingsModal}
        onmousedown={(e) => e.stopPropagation()}
        class="settings-btn flex items-center gap-1.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg px-3 py-1.5 hover:border-blue-600 dark:hover:border-blue-500 focus:outline-none shadow-sm text-sm cursor-pointer"
        aria-label="Settings"
      >
        <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="hidden sm:inline">Settings</span>
      </button>

      {#if showSettingsModal}
        <div
          role="region"
          aria-label="Display Settings Panel"
          class="settings-modal absolute right-0 top-11 z-50 w-64 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 flex flex-col gap-3"
          onclick={(e) => e.stopPropagation()}
          onkeydown={(e) => e.stopPropagation()}
          onmousedown={(e) => e.stopPropagation()}
        >
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono pb-1 border-b border-gray-100 dark:border-gray-700">
            Display Settings
          </div>
          
          <label class="flex items-center justify-between cursor-pointer select-none text-sm font-semibold text-gray-700 dark:text-gray-200">
            <span>Theme</span>
            <select
              value={settings.theme}
              onchange={handleThemeChange}
              class="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-600 cursor-pointer"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </label>

          <label class="flex items-center justify-between cursor-pointer select-none text-sm font-semibold text-gray-700 dark:text-gray-200">
            <span>Show Pronunciation</span>
            <input
              type="checkbox"
              checked={settings.showPronunciation}
              onchange={togglePronunciation}
              class="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>

          <label class="flex items-center justify-between cursor-pointer select-none text-sm font-semibold text-gray-700 dark:text-gray-200">
            <span>Show Translation</span>
            <input
              type="checkbox"
              checked={settings.showTranslation}
              onchange={toggleTranslation}
              class="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>
        </div>
      {/if}
    </div>
  </div>

  <div class="w-full max-w-full flex-1 flex flex-col items-center justify-start py-4 px-2 md:px-8 overflow-hidden">
    <div class="target-display relative flex flex-wrap break-keep justify-center gap-y-4 font-bold tracking-normal text-center select-text w-full max-w-full text-giant">
      {#each wordTokens as token}
        {#if token.type === 'space'}
          {@const i = token.indices[0]}
          {@const isError = errors.find(e => e.index === i)?.isError ?? false}
          {@const isCurrent = (i === activeTargetCursorIndex && !isCompleted)}
          
          <span data-target-index={i} class="relative inline-flex flex-col items-center pb-2 pt-1 mx-0.5">
            <span class="whitespace-pre {isError ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-900 dark:text-gray-100 font-bold'}">
              {' '}
            </span>
            {#if isError}
              <span class="absolute bottom-0 h-[3px] w-[0.7em] bg-red-500 dark:bg-red-400 rounded-full"></span>
            {:else if isCurrent}
              <span class="absolute bottom-0 h-[3px] w-[0.7em] bg-blue-600 dark:bg-blue-500 rounded-full"></span>
            {/if}
          </span>
        {:else}
          <span class="inline-flex whitespace-nowrap">
            {#each token.indices as i}
              {@const char = currentItem.target[i]}
              {@const isError = errors.find(e => e.index === i)?.isError ?? false}
              {@const isCurrent = (i === activeTargetCursorIndex && !isCompleted)}
              
              <span data-target-index={i} class="relative inline-flex flex-col items-center pb-2 pt-1 mx-0.5">
                <span class="whitespace-pre {isError ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-900 dark:text-gray-100 font-bold'}">
                  {char}
                </span>
                {#if isError}
                  <span class="absolute bottom-0 h-[3px] w-[0.7em] bg-red-500 dark:bg-red-400 rounded-full"></span>
                {:else if isCurrent}
                  <span class="absolute bottom-0 h-[3px] w-[0.7em] bg-blue-600 dark:bg-blue-500 rounded-full"></span>
                {/if}
              </span>
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
              <span
                bind:this={activeCursorElement}
                class="relative inline-flex flex-col items-center pb-2 pt-1 mx-0.5"
              >
                <span class="whitespace-pre {isError ? 'text-red-500 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}">
                  {char === ' ' ? ' ' : char}
                </span>
                {#if isError}
                  <span class="absolute bottom-0 h-[3px] w-[0.7em] bg-red-500 dark:bg-red-400 rounded-full"></span>
                {:else}
                  <span class="absolute bottom-0 h-[3px] w-[0.7em] bg-blue-600 dark:bg-blue-500 rounded-full"></span>
                {/if}
              </span>
            {:else}
              <span class="relative inline-flex flex-col items-center pb-2 pt-1 mx-0.5">
                <span class="whitespace-pre {isError ? 'text-red-500 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}">
                  {char === ' ' ? ' ' : char}
                </span>
                {#if isError}
                  <span class="absolute bottom-0 h-[3px] w-[0.7em] bg-red-500 dark:bg-red-400 rounded-full"></span>
                {/if}
              </span>
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
