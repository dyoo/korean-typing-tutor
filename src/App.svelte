<script lang="ts">
  import { onMount } from 'svelte';
  import contentData from './content.json';
  import { HangulEngine, checkErrors } from './utils/koreanEngine';
  import type { ErrorReport } from './types/korean';

  let content = contentData;
  let currentIndex = 0;
  let userInput = '';
  let errors: ErrorReport[] = [];
  let inputElement: HTMLInputElement;

  let currentItem = content[currentIndex];
  let accuracy = 100;

  const engine = new HangulEngine();

  onMount(() => {
    inputElement?.focus();
  });

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Tab' || e.key === 'Escape' || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    if (e.key === 'Backspace' || e.key.length === 1) {
      e.preventDefault();
      userInput = engine.handleKey(e.key);
      errors = checkErrors(currentItem.target, userInput);

      const correctChars = errors.filter(err => !err.isError).length;
      accuracy = userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 100;

      if (userInput === currentItem.target) {
        handleNext();
      }
    }
  }

  function handleNext() {
    engine.reset();
    if (currentIndex < content.length - 1) {
      currentIndex++;
      userInput = '';
      currentItem = content[currentIndex];
      errors = [];
    } else {
      alert("Congratulations! You've completed the tutorial!");
      currentIndex = 0;
      userInput = '';
      currentItem = content[0];
      errors = [];
    }
  }
</script>

<main class="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 px-4">
  <div class="max-w-2xl w-full">
    <div class="w-full bg-gray-200 h-1 mb-12 rounded-full overflow-hidden">
      <div 
        class="bg-blue-500 h-full transition-all duration-300" 
        style="width: {(currentIndex / content.length) * 100}%"
      ></div>
    </div>

    <div class="relative text-5xl font-medium tracking-widest mb-8 min-h-[80px] leading-relaxed">
      <div class="flex flex-wrap gap-x-1">
        {#each currentItem.target.split('') as char, i}
          <span class={errors.find(err => err.index === i)?.isError ? 'border-b-4 border-red-500 text-red-500' : ''}>
            {char}
          </span>
        {/each}
      </div>
    </div>

    <div class="text-xl text-gray-400 italic mb-12 h-8">
      {currentItem.pronunciation ? currentItem.pronunciation : currentItem.translation}
    </div>

    <input
      bind:this={inputElement}
      type="text"
      class="w-full bg-transparent border-b-2 border-gray-300 text-4xl focus:outline-none focus:border-blue-500 transition-colors text-center"
      value={userInput}
      on:keydown={handleKeydown}
      placeholder="..."
    />

    <div class="flex justify-between mt-12 text-sm text-gray-400 font-mono uppercase tracking-tighter">
      <span>Level: {currentIndex + 1} / {content.length}</span>
      <span>Accuracy: {accuracy}%</span>
    </div>
  </div>
</main>

<style>
  :global(body) {
    margin: 0;
    font-family: 'Inter', sans-serif;
  }
</style>
