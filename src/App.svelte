<script lang="ts">
  import { onMount } from 'svelte';
  import contentData from './content.json';
  import { TutorSession } from './lib/tutorSession';
  import type { LessonItem } from './types/korean';

  const session = new TutorSession(contentData as LessonItem[]);

  let currentIndex = $state(session.getCurrentIndex());
  let userInput = $state(session.getUserInput());
  let errors = $state(session.getErrors());
  let accuracy = $state(session.getAccuracy());
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
    accuracy = session.getAccuracy();
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

<main class="flex flex-col items-center justify-between min-h-screen bg-gray-50 text-gray-900 px-6 py-8 select-none">
  <div class="w-full max-w-5xl">
    <div class="w-full bg-gray-200 h-3 rounded-full overflow-hidden shadow-inner">
      <div 
        class="bg-blue-600 h-full transition-all duration-300 rounded-full" 
        style="width: {progress}%"
      ></div>
    </div>
  </div>

  <div class="w-full max-w-6xl flex flex-col items-center justify-center my-auto py-8">
    <div class="relative flex justify-center flex-wrap gap-x-6 text-giant font-extrabold tracking-wider leading-none text-center">
      {#each currentItem.target.split('') as char, i}
        {@const typedChar = userInput[i]}
        {@const isTyped = typedChar !== undefined}
        {@const isError = isTyped && typedChar !== char}
        
        <span class="relative px-3 py-2">
          <span class={isTyped ? (isError ? 'text-red-500 border-b-[12px] border-red-500' : 'text-emerald-600 border-b-[12px] border-emerald-500') : 'text-gray-300 border-b-[12px] border-gray-200'}>
            {isTyped ? typedChar : char}
          </span>
        </span>
      {/each}
    </div>

    <div class="text-subgiant text-gray-500 font-semibold italic mt-8 text-center tracking-wide min-h-[4rem]">
      {currentItem.pronunciation ? currentItem.pronunciation : currentItem.translation}
    </div>

    <div class="mt-6 h-36 flex flex-col items-center justify-center">
      <div class={isCompleted ? 'flex flex-col items-center gap-4' : 'invisible pointer-events-none'}>
        <span class="inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 font-bold px-6 py-3 rounded-full text-2xl border border-emerald-300 shadow-sm">
          ✓ Correct! Press <kbd class="bg-white px-3 py-1 rounded shadow text-gray-800 border">Enter ↵</kbd> or <kbd class="bg-white px-3 py-1 rounded shadow text-gray-800 border">Space</kbd>
        </span>
        <button
          type="button"
          onclick={handleManualAdvance}
          tabindex={isCompleted ? 0 : -1}
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-2xl px-8 py-4 rounded-xl shadow-lg cursor-pointer"
        >
          Next Word ➔
        </button>
      </div>
    </div>
  </div>

  <div class="w-full max-w-3xl flex flex-col items-center pb-8">
    <input
      bind:this={inputElement}
      type="text"
      class="w-full bg-white border-b-8 border-gray-300 focus:border-blue-600 text-6xl md:text-7xl py-6 focus:outline-none transition-all text-center font-bold shadow-md rounded-t-xl"
      value={userInput}
      onkeydown={handleKeydown}
      oninput={handleInputPrevent}
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder={isCompleted ? "Press Enter or Space for next word" : "Type here..."}
    />

    <div class="flex justify-between w-full mt-6 text-xl sm:text-2xl text-gray-400 font-mono font-bold uppercase tracking-wider">
      <span>Level {currentIndex + 1} / {session.getTotalItems()}</span>
      <span>Accuracy: {accuracy}%</span>
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
