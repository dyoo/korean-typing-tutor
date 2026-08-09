<script lang="ts">
  import { onMount } from 'svelte';
  import contentData from './content.json';
  import { TutorSession } from './lib/tutorSession';
  import type { LessonItem } from './types/korean';

  const session = new TutorSession(contentData as LessonItem[]);

  let currentIndex = $state(session.getCurrentIndex());
  let userInput = $state(session.getUserInput());
  let errors = $state(session.getErrors());
  let progress = $state(session.getProgressPercentage());
  let currentItem = $state(session.getCurrentItem());
  let isCompleted = $state(session.getIsItemCompleted());
  let inputElement = $state<HTMLInputElement | null>(null);

  onMount(() => {
    inputElement?.focus();
  });

  function focusInput() {
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

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab' || e.key === 'Escape' || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Enter' || e.key.length === 1) {
      e.preventDefault();
      const { isTutorialComplete, advanced } = session.processKey(e.key);
      syncState();

      if (advanced && isTutorialComplete) {
        alert("Congratulations! You've completed the tutorial!");
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
      alert("Congratulations! You've completed the tutorial!");
      session.resetSession();
      syncState();
    }
    inputElement?.focus();
  }
</script>

<svelte:window onclick={focusInput} />

<main class="flex flex-col items-center justify-between min-h-screen bg-gray-50 text-gray-900 px-6 py-6 select-none overflow-hidden">
  <div class="w-full max-w-5xl">
    <div class="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden shadow-inner">
      <div 
        class="bg-blue-600 h-full transition-all duration-300 rounded-full" 
        style="width: {progress}%"
      ></div>
    </div>
  </div>

  <div class="w-full max-w-6xl flex flex-col items-center justify-center my-auto py-2">
    <div class="relative flex justify-center flex-nowrap whitespace-nowrap gap-x-3 text-giant font-extrabold tracking-wider leading-none text-center">
      {#each currentItem.target.split('') as char}
        <span class="relative px-2 py-1 text-gray-900 border-b-8 border-gray-300">
          {char === ' ' ? '\u00A0' : char}
        </span>
      {/each}
    </div>

    <div class="text-subgiant text-gray-500 font-semibold italic mt-4 text-center tracking-wide min-h-[3rem]">
      {currentItem.pronunciation ? currentItem.pronunciation : currentItem.translation}
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
          {isCompleted ? "Press Enter or Space for next word" : "Type in QWERTY..."}
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
