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
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab' || e.key === 'Escape' || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    if (e.key === 'Backspace' || e.key.length === 1) {
      e.preventDefault();
      const { isTutorialComplete } = session.processKey(e.key);
      syncState();

      if (isTutorialComplete) {
        alert("Congratulations! You've completed the tutorial!");
        session.resetSession();
        syncState();
      }
    }
  }
</script>

<svelte:window onclick={focusInput} />

<main class="flex flex-col items-center justify-center min-h-screen bg-gray-50 text-gray-900 px-6 py-12 select-none">
  <div class="max-w-4xl w-full flex flex-col items-center">
    <div class="w-full bg-gray-200 h-2.5 mb-16 rounded-full overflow-hidden shadow-inner">
      <div 
        class="bg-blue-600 h-full transition-all duration-300 rounded-full" 
        style="width: {progress}%"
      ></div>
    </div>

    <div class="relative mb-12 min-h-[160px] flex items-center justify-center text-center">
      <div class="flex justify-center flex-wrap gap-x-4 text-7xl sm:text-8xl md:text-9xl font-bold tracking-widest leading-none">
        {#each currentItem.target.split('') as char, i}
          {@const typedChar = userInput[i]}
          {@const isTyped = typedChar !== undefined}
          {@const isError = isTyped && typedChar !== char}
          
          <span class="relative px-2 py-1">
            <span class={isTyped ? (isError ? 'text-red-500 border-b-8 border-red-500' : 'text-blue-600 border-b-8 border-blue-600') : 'text-gray-300 border-b-8 border-gray-200'}>
              {isTyped ? typedChar : char}
            </span>
          </span>
        {/each}
      </div>
    </div>

    <div class="text-2xl sm:text-3xl text-gray-500 font-medium italic mb-16 h-10 text-center tracking-wide">
      {currentItem.pronunciation ? currentItem.pronunciation : currentItem.translation}
    </div>

    <input
      bind:this={inputElement}
      type="text"
      class="w-full max-w-xl bg-white border-b-4 border-gray-300 focus:border-blue-600 text-5xl py-4 focus:outline-none transition-all text-center font-bold shadow-sm rounded-t-lg"
      value={userInput}
      onkeydown={handleKeydown}
      placeholder="Type here..."
    />

    <div class="flex justify-between w-full max-w-xl mt-12 text-base sm:text-lg text-gray-400 font-mono font-semibold uppercase tracking-wider">
      <span>Level {currentIndex + 1} of {session.getTotalItems()}</span>
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
