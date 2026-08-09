<script lang="ts">
  import { onMount } from 'svelte';
  import contentData from './content.json';
  import { TutorSession } from './lib/tutorSession';
  import type { CurriculumData } from './lib/tutorSession';

  const session = new TutorSession(contentData as CurriculumData, 'all', true);
  const modules = session.getModules();

  let selectedFilter = $state<string>('all');
  let currentIndex = $state(session.getCurrentIndex());
  let userInput = $state(session.getUserInput());
  let errors = $state(session.getErrors());
  let progress = $state(session.getProgressPercentage());
  let currentItem = $state(session.getCurrentItem());
  let displayText = $state(session.getDisplayText());
  let isCompleted = $state(session.getIsItemCompleted());
  let inputElement = $state<HTMLInputElement | null>(null);

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
        target.closest('select') ||
        target.closest('button') ||
        target.closest('label')
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
    displayText = session.getDisplayText();
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

  function handleManualAdvance() {
    const isTutorialComplete = session.advanceLevel();
    syncState();
    if (isTutorialComplete) {
      alert("Module completed! Reshuffling items...");
      session.resetSession();
      syncState();
    }
    inputElement?.focus();
  }
</script>

<svelte:window onclick={focusInput} />

<main class="flex flex-col items-center justify-between min-h-screen bg-gray-50 text-gray-900 px-6 py-6 overflow-hidden">
  <div class="w-full max-w-5xl flex items-center justify-between gap-4">
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

    <div class="flex-1 max-w-md bg-gray-200 h-2.5 rounded-full overflow-hidden shadow-inner">
      <div 
        class="bg-blue-600 h-full transition-all duration-300 rounded-full" 
        style="width: {progress}%"
      ></div>
    </div>
  </div>

  <div class="w-full max-w-6xl flex flex-col items-center justify-center my-auto py-2">
    <div class="relative flex justify-center flex-nowrap whitespace-nowrap gap-x-3 text-giant font-extrabold tracking-wider leading-none text-center select-text">
      {#each currentItem.target.split('') as char, i}
        {@const typedChar = userInput[i]}
        {@const isTyped = typedChar !== undefined}
        {@const isError = errors.find(e => e.index === i)?.isError ?? false}
        {@const isExact = typedChar === char}
        
        <span class="relative px-2 py-1">
          <span class={!isTyped ? 'text-gray-900 border-b-8 border-gray-300' : (isExact ? 'text-gray-900 border-b-8 border-emerald-500' : (isError ? 'text-gray-900 border-b-8 border-red-500' : 'text-gray-900 border-b-8 border-blue-600'))}>
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      {/each}
    </div>

    <div class="text-subgiant text-gray-500 font-semibold italic mt-4 text-center tracking-wide min-h-[3rem] select-text">
      {displayText}
    </div>

    <div class="mt-4 h-28 flex flex-col items-center justify-center">
      <div class={isCompleted ? 'flex flex-col items-center gap-3' : 'invisible pointer-events-none'}>
        <span class="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 font-bold px-5 py-2 rounded-full text-xl border border-emerald-300 shadow-sm">
          ✓ Correct! Press <kbd class="bg-white px-2.5 py-0.5 rounded shadow text-gray-800 border text-lg">Enter ↵</kbd> or <kbd class="bg-white px-2.5 py-0.5 rounded shadow text-gray-800 border text-lg">Space</kbd>
        </span>
        <button
          type="button"
          onclick={handleManualAdvance}
          tabindex={isCompleted ? 0 : -1}
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xl px-7 py-3 rounded-xl shadow-md cursor-pointer"
        >
          Next Word ➔
        </button>
      </div>
    </div>
  </div>

  <div class="w-full max-w-3xl flex flex-col items-center pb-4 shrink-0">
    <div class="w-full h-24 relative flex justify-center items-center bg-white border-b-8 border-gray-300 focus-within:border-blue-600 font-bold shadow-md rounded-t-xl px-4 overflow-hidden">
      {#if userInput.length === 0}
        <span class="text-2xl text-gray-400 font-normal">
          {isCompleted ? "Press Enter or Space for next word" : "Start typing..."}
        </span>
      {:else}
        <div class="flex justify-center flex-nowrap whitespace-nowrap gap-x-1 text-4xl md:text-5xl font-bold">
          {#each userInput.split('') as char, i}
            {@const isError = errors.find(e => e.index === i)?.isError ?? false}
            
            <span class={isError ? 'text-red-500 border-b-4 border-red-500' : 'text-blue-600 border-b-4 border-blue-500'}>
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

    <div class="flex justify-center w-full mt-4 text-lg text-gray-400 font-mono font-bold uppercase tracking-wider">
      <span>Level {currentIndex + 1} / {session.getTotalItems()}</span>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background-color: #f9fafb;
  }
</style>
