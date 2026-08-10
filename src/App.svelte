<script lang="ts">
  import { onMount } from 'svelte';
  import contentData from './content.json';
  import { TutorSession } from './lib/tutorSession';
  import type { CurriculumData } from './lib/tutorSession';
  import { loadSettings, saveSettings } from './lib/settings';
  import type { TutorSettings } from './lib/settings';
  import { isSyllableComplete } from './utils/koreanEngine';

  const session = new TutorSession(contentData as CurriculumData, 'all', true);
  const modules = session.getModules();

  let settings = $state<TutorSettings>(loadSettings());
  let showSettingsModal = $state(false);

  let selectedFilter = $state<string>('all');
  let currentIndex = $state(session.getCurrentIndex());
  let userInput = $state(session.getUserInput());
  let errors = $state(session.getErrors());
  let progress = $state(session.getProgressPercentage());
  let currentItem = $state(session.getCurrentItem());
  let isCompleted = $state(session.getIsItemCompleted());
  let inputElement = $state<HTMLInputElement | null>(null);

  let displayText = $derived(session.getDisplayText(currentItem, settings));

  let activeCursorIndex = $derived.by(() => {
    if (isCompleted) {
      return -1;
    }
    if (userInput.length === 0) {
      return 0;
    }
    const lastIndex = userInput.length - 1;
    const isLastComplete = isSyllableComplete(
      currentItem.target[lastIndex],
      userInput[lastIndex],
      currentItem.target[lastIndex + 1]
    );
    return isLastComplete ? userInput.length : lastIndex;
  });

  onMount(() => {
    inputElement?.focus();
  });

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
        target.closest('.settings-modal')
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
    progress = session.getProgressPercentage();
    currentItem = session.getCurrentItem();
    isCompleted = session.getIsItemCompleted();
  }

  function handleFilterChange(e: Event) {
    const filter = (e.target as HTMLSelectElement).value;
    selectedFilter = filter;
    session.setFilter(filter, true);
    syncState();
    inputElement?.focus();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab' || e.key === 'Escape' || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Enter' || e.key.length === 1) {
      e.preventDefault();
      const { isTutorialComplete, advanced } = session.processKey(e.key);
      syncState();

      if (advanced && isTutorialComplete) {
        alert("Module completed! Reshuffling items...");
        session.resetSession();
        syncState();
      }
    }
  }

  function handleInputPrevent(e: Event) {
    (e.target as HTMLInputElement).value = userInput;
  }

  function handleSkip(e: MouseEvent) {
    e.stopPropagation();
    const isTutorialComplete = session.advanceLevel();
    syncState();
    if (isTutorialComplete) {
      alert("Module completed! Reshuffling items...");
      session.resetSession();
      syncState();
    }
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

  function toggleSettingsModal(e: MouseEvent) {
    e.stopPropagation();
    showSettingsModal = !showSettingsModal;
    if (!showSettingsModal) {
      inputElement?.focus();
    }
  }
</script>

<svelte:window onclick={focusInput} />

<main class="flex flex-col items-center justify-between min-h-screen bg-gray-50 text-gray-900 px-4 py-4 md:px-6 md:py-6 overflow-x-hidden">
  <div class="w-full max-w-5xl flex items-center justify-between gap-4 shrink-0">
    <div class="flex items-center gap-3">
      <label for="level-select" class="text-sm font-bold uppercase tracking-wider text-gray-500 font-mono">Module:</label>
      <select
        id="level-select"
        class="bg-white border-2 border-gray-300 text-gray-800 font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-600 shadow-sm text-sm cursor-pointer"
        value={selectedFilter}
        onchange={handleFilterChange}
        onclick={(e) => e.stopPropagation()}
        onmousedown={(e) => e.stopPropagation()}
      >
        {#each modules as mod}
          <option value={mod.id}>{mod.title}</option>
        {/each}
      </select>
    </div>

    <div class="flex-1 max-w-md bg-gray-200 h-2.5 rounded-full overflow-hidden shadow-inner hidden sm:block">
      <div 
        class="bg-blue-600 h-full transition-all duration-300 rounded-full" 
        style="width: {progress}%"
      ></div>
    </div>

    <div class="relative flex items-center gap-2">
      <button
        type="button"
        onclick={toggleSettingsModal}
        onmousedown={(e) => e.stopPropagation()}
        class="flex items-center gap-1.5 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg px-3 py-1.5 hover:border-blue-600 focus:outline-none shadow-sm text-sm cursor-pointer"
        aria-label="Settings"
      >
        <svg class="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="hidden sm:inline">Settings</span>
      </button>

      {#if showSettingsModal}
        <div
          role="region"
          aria-label="Display Settings Panel"
          class="settings-modal absolute right-0 top-11 z-50 w-64 bg-white border-2 border-gray-200 rounded-xl shadow-xl p-4 flex flex-col gap-3"
          onclick={(e) => e.stopPropagation()}
          onkeydown={(e) => e.stopPropagation()}
          onmousedown={(e) => e.stopPropagation()}
        >
          <div class="text-xs font-bold uppercase tracking-wider text-gray-500 font-mono pb-1 border-b border-gray-100">
            Display Settings
          </div>
          
          <label class="flex items-center justify-between cursor-pointer select-none text-sm font-semibold text-gray-700">
            <span>Show Pronunciation</span>
            <input
              type="checkbox"
              checked={settings.showPronunciation}
              onchange={togglePronunciation}
              class="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
          </label>

          <label class="flex items-center justify-between cursor-pointer select-none text-sm font-semibold text-gray-700">
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

  <div class="w-full max-w-5xl flex flex-col items-center justify-center my-auto py-4 px-2 overflow-hidden">
    <div class="relative flex flex-wrap break-keep justify-center gap-y-4 font-bold tracking-normal text-center select-text max-w-full {currentItem.target.length > 30 ? 'text-paragraph' : (currentItem.target.length > 6 ? 'text-longsentence' : 'text-giant')}">
      {#each currentItem.target.split('') as char, i}
        {@const isError = errors.find(e => e.index === i)?.isError ?? false}
        {@const isCurrent = (i === activeCursorIndex && !isCompleted && !isError)}
        
        <span class="relative py-1 inline-block my-1">
          <span class={isError ? 'text-gray-900 border-b-8 border-red-500' : (isCurrent ? 'text-gray-900 border-b-8 border-blue-600' : 'text-gray-900 border-b-8 border-transparent')}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      {/each}
    </div>

    {#if displayText.trim().length > 0}
      <div class="text-subgiant text-gray-500 font-medium italic mt-6 text-center tracking-wide min-h-[3rem] h-auto flex flex-col items-center justify-center select-text max-w-full px-4 py-2">
        {displayText}
      </div>
    {/if}

    <div class="mt-4 h-14 flex items-center justify-center shrink-0">
      {#if isCompleted}
        <span class="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 font-bold px-5 py-2 rounded-full text-base md:text-lg border border-emerald-300 shadow-sm text-center">
          ✓ Correct! Press <kbd class="bg-white px-2 py-0.5 rounded shadow text-gray-800 border text-sm md:text-base">Enter ↵</kbd> or <kbd class="bg-white px-2 py-0.5 rounded shadow text-gray-800 border text-sm md:text-base">Space</kbd>
        </span>
      {:else}
        <button
          type="button"
          onclick={handleSkip}
          onmousedown={(e) => e.stopPropagation()}
          class="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium px-4 py-1.5 rounded-full text-xs md:text-sm border border-gray-300 shadow-2xs transition-colors cursor-pointer"
        >
          <span>Skip exercise</span>
          <span>➔</span>
        </button>
      {/if}
    </div>
  </div>

  <div class="w-full max-w-3xl flex flex-col items-center pb-4 shrink-0 px-2">
    <div class="w-full min-h-[5rem] py-3 relative flex justify-center items-center bg-white border-b-8 border-gray-300 focus-within:border-blue-600 font-bold shadow-md rounded-t-xl px-4 overflow-hidden">
      {#if userInput.length === 0}
        <span class="text-xl md:text-2xl text-gray-400 font-normal text-center">
          {isCompleted ? "Press Enter or Space for next word" : "Start typing..."}
        </span>
      {:else}
        <div class="flex flex-wrap break-keep justify-center gap-y-2 text-2xl md:text-4xl font-bold max-w-full">
          {#each userInput.split('') as char, i}
            {@const isError = errors.find(e => e.index === i)?.isError ?? false}
            {@const isCurrent = (i === activeCursorIndex && !isCompleted && !isError)}
            
            <span class={isError ? 'text-red-500 border-b-4 border-red-500' : (isCurrent ? 'text-blue-600 border-b-4 border-blue-500' : 'text-blue-600 border-b-4 border-transparent')}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          {/each}
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

    <div class="flex justify-between items-center w-full mt-4 text-xs md:text-sm text-gray-400 font-mono font-bold uppercase tracking-wider">
      <span>Level {currentIndex + 1} / {session.getTotalItems()}</span>
      <a
        href="https://github.com/dyoo/korean-typing-tutor"
        target="_blank"
        rel="noopener noreferrer"
        class="flex items-center gap-1.5 text-gray-400 hover:text-gray-600 transition-colors normal-case font-sans font-medium text-xs border border-gray-200 hover:border-gray-400 rounded-full px-3 py-1 bg-white shadow-2xs"
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
</style>
