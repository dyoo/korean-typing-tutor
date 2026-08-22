<script lang="ts">
  interface Props {
    isOpen: boolean;
    onBegin: () => void;
  }

  let { isOpen, onBegin }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) {
      return;
    }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onBegin();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs select-none cursor-pointer"
    role="dialog"
    aria-modal="true"
    aria-labelledby="welcome-modal-title"
    tabindex="-1"
    onclick={onBegin}
  >
    <!-- Modal Card Container -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <div
      class="relative w-full max-w-xl p-6 md:p-8 bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl text-gray-900 dark:text-gray-100 flex flex-col gap-6 cursor-default"
      onclick={(e) => e.stopPropagation()}
      role="document"
    >
      <!-- Header -->
      <div class="flex flex-col items-center text-center gap-1.5">
        <h2 id="welcome-modal-title" class="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-gray-50">
          Korean Typing Tutor
        </h2>

        <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400 max-w-md">
          A minimalist, high-performance touch-typing tutor for English speakers learning Korean.
        </p>
      </div>

      <!-- Mode Cards Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-left">
        <!-- Mastery Mode Card -->
        <div class="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 flex flex-col justify-between gap-2">
          <div class="flex flex-col gap-1">
            <span class="text-amber-800 dark:text-amber-400 font-bold text-sm">
              Mastery Mode
            </span>
            <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Guided spaced repetition starting from home-row vowels (<span class="font-bold text-gray-900 dark:text-gray-100">ㅗ, ㅓ, ㅏ, ㅣ</span>) and moving outward. Unlocks new Jamo letters and real words as rolling accuracy criteria are met.
            </p>
          </div>
          <span class="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
            Recommended for beginners
          </span>
        </div>

        <!-- Free-form Mode Card -->
        <div class="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex flex-col justify-between gap-2">
          <div class="flex flex-col gap-1">
            <span class="text-blue-800 dark:text-blue-400 font-bold text-sm">
              Free-form Mode
            </span>
            <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Curriculum explorer across modules of vocabulary, common expressions, idioms, and sentences with customizable multi-module filtering.
            </p>
          </div>
          <span class="text-[11px] font-semibold text-blue-700 dark:text-blue-400">
            Vocabulary practice without restrictions
          </span>
        </div>
      </div>

      <!-- Guidance -->
      <p class="text-xs text-center text-gray-500 dark:text-gray-400 -my-1 leading-relaxed">
        Use the left sidebar to select modules or progress, and the top-right settings to toggle voice, translations, and theme.
      </p>

      <!-- Action Button -->
      <div class="flex flex-col items-center gap-2 pt-1">
        <button
          type="button"
          onclick={onBegin}
          class="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all flex items-center justify-center gap-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        >
          <span>Begin Typing</span>
          <span class="text-xs opacity-75 font-mono px-2 py-0.5 rounded bg-blue-700/60 border border-blue-400/40">
            Enter ↵
          </span>
        </button>
        <span class="text-[11px] text-gray-400 dark:text-gray-500">
          Press <kbd class="font-mono font-semibold text-gray-500 dark:text-gray-400">Enter</kbd>, <kbd class="font-mono font-semibold text-gray-500 dark:text-gray-400">Space</kbd>, or click anywhere to start
        </span>
      </div>
    </div>
  </div>
{/if}
