<script lang="ts">
  interface Props {
    isCompleted: boolean;
    onskip: (e: MouseEvent) => void;
  }

  let { isCompleted, onskip }: Props = $props();
</script>

<div class="mb-2 h-14 flex items-center justify-center shrink-0">
  {#if isCompleted}
    <span class="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-5 py-2 rounded-full text-base md:text-lg border border-emerald-300 dark:border-emerald-800 shadow-sm text-center">
      ✓ Correct! Press <kbd class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border dark:border-gray-700 px-2 py-0.5 rounded shadow text-sm md:text-base">Enter ↵</kbd> or <kbd class="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border dark:border-gray-700 px-2 py-0.5 rounded shadow text-sm md:text-base">Space</kbd>
    </span>
  {:else}
    <button
      type="button"
      onclick={onskip}
      onmousedown={(e) => e.stopPropagation()}
      class="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium px-4 py-1.5 rounded-full text-xs md:text-sm border border-gray-300 dark:border-gray-700 shadow-2xs transition-colors cursor-pointer"
    >
      <span>Skip exercise</span>
      <span>➔</span>
    </button>
  {/if}
</div>
