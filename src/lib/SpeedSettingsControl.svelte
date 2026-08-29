<script lang="ts">
  import { settingsStore } from './settings.svelte';

  interface Props {
    onresetkpm?: () => void;
  }

  let { onresetkpm }: Props = $props();

  let showConfirmResetKpm = $state(false);

  function handleResetKpmClick() {
    if (!showConfirmResetKpm) {
      showConfirmResetKpm = true;
      return;
    }
    showConfirmResetKpm = false;
    onresetkpm?.();
  }

  function handleCancelResetKpm() {
    showConfirmResetKpm = false;
  }
</script>

<div class="flex flex-col gap-2 pt-2.5 border-t border-gray-200 dark:border-gray-700">
  <div class="flex items-center justify-between">
    <span class="font-bold text-gray-900 dark:text-gray-100">Speed Analytics (KPM)</span>
    <label class="flex items-center gap-1.5 cursor-pointer">
      <input
        type="checkbox"
        checked={settingsStore.current.showKpm ?? true}
        onchange={() => settingsStore.toggle('showKpm')}
        class="w-4 h-4 text-blue-600 rounded cursor-pointer"
      />
      <span>Enable</span>
    </label>
  </div>

  {#if settingsStore.current.showKpm ?? true}
    <div class="flex flex-col gap-2 mt-1 pl-2">
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-600 dark:text-gray-400">Speed & accuracy history</span>
        {#if showConfirmResetKpm}
          <div class="flex items-center gap-1.5">
            <button
              type="button"
              onclick={handleResetKpmClick}
              class="px-2 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 rounded cursor-pointer transition-colors"
            >
              Confirm Reset
            </button>
            <button
              type="button"
              onclick={handleCancelResetKpm}
              class="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors"
            >
              Cancel
            </button>
          </div>
        {:else}
          <button
            type="button"
            onclick={handleResetKpmClick}
            class="px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded cursor-pointer transition-colors"
          >
            Reset Stats
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
