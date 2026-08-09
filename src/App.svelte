<script lang="ts">
  import { onMount } from 'svelte';
  import contentData from './content.json';
  import { checkErrors } from './utils/koreanEngine';
  import type { ErrorReport } from './types/korean';

  let content = contentData;
  let currentIndex = 0;
  let userInput = '';
  let errors: ErrorReport[] = [];

  let currentItem = content[currentIndex];
  let accuracy = 100;

  function handleInput(e: Event) {
    const target = (e.target as HTMLInputElement).value;
    userInput = target;
    errors = checkErrors(currentItem.target, userInput);
    
    // Simple accuracy calculation
    const correctChars = errors.filter(e => !e.isError).length;
    accuracy = userInput.length > 0 ? Math.round((correctChars / userInput.length) * 100) : 100;

    if (userInput === currentItem.target) {
      handleNext();
    }
  }

  function handleNext() {
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
    }
  }
</script>

<main class="flex flex-col items-center justify-center min-h-screen bg-white text-gray-900 px-4">
  <div class="max-w-2xl w-full">
    <!-- Progress Bar -->
    <div class="w-full bg-gray-200 h-1 mb-12 rounded-full overflow-hidden">
      <div 
        class="bg-blue-500 h-full transition-all duration-300" 
        style="width: {(currentIndex / content.length) * 100}%"
      ></div>
    </div>

    <!-- Typing Area -->
    <div class="relative text-5xl font-medium tracking-widest mb-8 min-h-[80px] leading-relaxed">
      <!-- Target Text with Underlines -->
      <div class="flex flex-wrap gap-x-1">
        {#each currentItem.target.split('') as char, i}
          <span class={errors.find(e => e.index === i)?.isError ? 'border-b-4 border-red-500 text-red-500' : ''}>
            {char}
          </span>
        {/each}
      </div>

      <!-- Input Overlay (Ghost Text) -->
      <div class="absolute top-0 left-0 w-full flex flex-wrap gap-x-1 opacity-0 pointer-events-none">
        {#each userInput.split('') as char}
          <span>{char}</span>
        {/each}
      </div>
    </div>

    <!-- Helper Text (Pronunciation/Translation) -->
    <div class="text-xl text-gray-400 italic mb-12 h-8">
      {currentItem.pronunciation ? currentItem.pronunciation : currentItem.translation}
    </div>

    <!-- Input Field -->
    <input
      type="text"
      class="w-full bg-transparent border-b-2 border-gray-300 text-4xl focus:outline-none focus:border-blue-500 transition-colors text-center"
      bind:value={userInput}
      on:input={handleInput}
      placeholder="..."
    />

    <!-- Stats -->
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
