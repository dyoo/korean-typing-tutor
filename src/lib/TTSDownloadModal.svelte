<script lang="ts">
  import { ttsController } from '../utils/ttsController.svelte';

  interface Props {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let { isOpen, onConfirm, onCancel }: Props = $props();

  let isLoading = $derived(ttsController.getIsLoading());
  let downloadProgress = $derived(ttsController.getDownloadProgress());
  let downloadStatus = $derived(ttsController.getDownloadStatus());
  let loadError = $derived(ttsController.getLoadError());

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onCancel();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
    role="dialog"
    aria-modal="true"
    aria-labelledby="tts-download-title"
  >
    <div
      class="bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl max-w-md w-full p-6 flex flex-col gap-4 text-gray-800 dark:text-gray-200"
    >
      <div class="flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z"
            />
          </svg>
        </div>
        <div>
          <h3 id="tts-download-title" class="text-base font-bold text-gray-900 dark:text-gray-100">
            Download Voice Synthesis Model?
          </h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Kokoro-82M Offline Korean Pronunciation
          </p>
        </div>
      </div>

      <p class="text-xs leading-relaxed text-gray-600 dark:text-gray-300">
        Enabling Korean voice synthesis requires downloading the Kokoro-82M neural model (<strong
          class="font-semibold text-gray-900 dark:text-gray-100">~80 MB</strong
        >).
      </p>

      <ul
        class="text-[11px] space-y-1.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 p-3 rounded-lg text-gray-600 dark:text-gray-400"
      >
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✓</span>
          <span>100% Client-side: runs completely offline in your browser</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✓</span>
          <span>Zero cloud telemetry or backend voice requests</span>
        </li>
        <li class="flex items-center gap-2">
          <span class="text-emerald-500 font-bold">✓</span>
          <span>Cached permanently in browser storage until cleared</span>
        </li>
      </ul>

      {#if isLoading}
        <div class="flex flex-col gap-1.5 my-2">
          <div class="flex items-center justify-between text-xs font-semibold">
            <span class="text-blue-600 dark:text-blue-400">
              {downloadStatus || 'Downloading neural model...'}
            </span>
            <span class="font-mono">{downloadProgress}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              class="bg-blue-600 dark:bg-blue-500 h-2 transition-all duration-200"
              style="width: {downloadProgress}%"
            ></div>
          </div>
        </div>
      {/if}

      {#if loadError}
        <div
          class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 p-2.5 rounded-lg border border-red-200 dark:border-red-800"
        >
          {loadError}
        </div>
      {/if}

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onclick={onCancel}
          class="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={isLoading}
          onclick={onConfirm}
          class="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
        >
          {#if isLoading}
            <svg
              class="w-3.5 h-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Downloading...</span>
          {:else}
            <span>Download & Enable</span>
          {/if}
        </button>
      </div>
    </div>
  </div>
{/if}
