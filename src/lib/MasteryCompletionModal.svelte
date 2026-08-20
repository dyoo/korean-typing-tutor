<script lang="ts">
  interface Props {
    show: boolean;
    onClose: () => void;
    onSwitchToFreeForm: () => void;
    onOpenMasterySidebar: () => void;
  }

  let { show, onClose, onSwitchToFreeForm, onOpenMasterySidebar }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && show) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if show}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-labelledby="completion-modal-title"
    tabindex="-1"
    onclick={onClose}
    onkeydown={handleKeydown}
  >
    <!-- Modal Card Container -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      class="relative w-full max-w-lg p-6 md:p-8 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl text-gray-900 dark:text-gray-100"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      role="document"
    >
      <!-- Close Button -->
      <button
        type="button"
        onclick={onClose}
        aria-label="Close modal"
        class="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <!-- Badge Header -->
      <div class="text-center space-y-3">
        <div
          class="inline-flex items-center justify-center px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700/60 rounded-full"
        >
          Mastery Path Complete
        </div>

        <h2 id="completion-modal-title" class="text-2xl md:text-3xl font-extrabold tracking-tight">
          축하합니다! (Congratulations!)
        </h2>

        <p class="text-sm md:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          You have mastered all 44 Hangul Jamos across Home Row, Top Row, Bottom Row, Shift Keys,
          and Compound Final Consonants (겹받침), along with all 5 Sentence Milestones.
        </p>
      </div>

      <!-- Action Cards -->
      <div class="mt-6 md:mt-8 space-y-3">
        <!-- Option 1: Free-form Mode -->
        <button
          type="button"
          onclick={onSwitchToFreeForm}
          class="w-full text-left p-4 rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors group focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          <div class="flex items-center justify-between">
            <span class="font-bold text-amber-950 dark:text-amber-200 text-base md:text-lg">
              Switch to Free-form Mode
            </span>
            <span
              class="text-xs font-semibold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200"
            >
              Recommended
            </span>
          </div>
          <p class="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-normal">
            Practice the complete 26-module library of vocabulary, TOPIK levels, idioms, and
            literature without progression locks.
          </p>
        </button>

        <!-- Option 2: Mastery Sidebar Adjust / Reset -->
        <button
          type="button"
          onclick={onOpenMasterySidebar}
          class="w-full text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          <div class="font-bold text-gray-900 dark:text-gray-100 text-base md:text-lg">
            Review or Reset Progress
          </div>
          <p class="mt-1 text-xs md:text-sm text-gray-600 dark:text-gray-400 leading-normal">
            Open the Mastery Drawer to jump to any previous Jamo stage or Sentence Milestone to hone
            your muscle memory.
          </p>
        </button>
      </div>

      <!-- Dismiss Button -->
      <div class="mt-6 text-center">
        <button
          type="button"
          onclick={onClose}
          class="text-xs md:text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 font-medium underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-amber-500 rounded px-2 py-1"
        >
          Continue practicing in Master stage
        </button>
      </div>
    </div>
  </div>
{/if}
