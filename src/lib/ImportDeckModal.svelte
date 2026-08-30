<script lang="ts">
  import type { CustomDeck } from '../types/customDecks';

  interface Props {
    isOpen: boolean;
    onclose: () => void;
    onimport: (deck: CustomDeck) => void;
  }

  let { isOpen, onclose, onimport }: Props = $props();

  let fileInput = $state<HTMLInputElement | null>(null);
  let isDragging = $state(false);

  let isLoading = $state(false);
  let errorMessage = $state<string | null>(null);
  let parsedDeck = $state<CustomDeck | null>(null);

  function resetState() {
    isLoading = false;
    errorMessage = null;
    parsedDeck = null;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  function handleClose() {
    resetState();
    onclose();
  }

  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      await processFile(file);
    }
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      await processFile(file);
    }
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  async function processFile(file: File) {
    isLoading = true;
    errorMessage = null;
    parsedDeck = null;

    try {
      // Lazy load the parser chunk dynamically
      const { parseDeckFromFile } = await import('../utils/ankiParser');
      const deck = await parseDeckFromFile(file);
      parsedDeck = deck;
    } catch (err) {
      errorMessage = (err as Error).message || 'Failed to parse flashcard file.';
    } finally {
      isLoading = false;
    }
  }

  function handleConfirmImport() {
    if (parsedDeck) {
      onimport(parsedDeck);
      handleClose();
    }
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
    role="dialog"
    aria-modal="true"
    aria-labelledby="import-deck-title"
    tabindex="-1"
    onkeydown={(e) => e.key === 'Escape' && handleClose()}
  >
    <div
      class="w-full max-w-lg bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div
        class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40"
      >
        <div class="flex items-center gap-2.5">
          <span class="text-xl">🗂️</span>
          <h2
            id="import-deck-title"
            class="text-lg font-bold text-gray-900 dark:text-gray-100"
          >
            Import Custom Deck
          </h2>
        </div>
        <button
          type="button"
          onclick={handleClose}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-200/60 dark:hover:bg-gray-700 cursor-pointer"
          aria-label="Close dialog"
        >
          <svg
            class="w-5 h-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Body Content -->
      <div class="p-6 flex flex-col gap-4">
        <!-- Drag & Drop Zone -->
        <div
          ondrop={handleDrop}
          ondragover={handleDragOver}
          ondragleave={handleDragLeave}
          class="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center gap-3 transition-colors cursor-pointer {isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
            : 'border-gray-300 dark:border-gray-700 hover:border-blue-400 bg-gray-50/50 dark:bg-gray-900/30'}"
          onclick={() => fileInput?.click()}
          onkeydown={(e) => e.key === 'Enter' && fileInput?.click()}
          role="button"
          tabindex="0"
        >
          <input
            bind:this={fileInput}
            type="file"
            accept=".apkg,.txt,.tsv,.csv"
            class="hidden"
            onchange={handleFileSelect}
          />
          <div
            class="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-2xl text-blue-600 dark:text-blue-400"
          >
            📁
          </div>
          <div class="flex flex-col gap-1">
            <span class="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Click to browse or drop file here
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400">
              Supports Anki packages (<code>.apkg</code>) and plain text (<code>.tsv</code>,
              <code>.txt</code>, <code>.csv</code>)
            </span>
          </div>
        </div>

        <!-- Loading State -->
        {#if isLoading}
          <div
            class="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center gap-3"
          >
            <svg
              class="animate-spin h-5 w-5 text-blue-600 dark:text-blue-400"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">
              Parsing flashcard deck...
            </span>
          </div>
        {/if}

        <!-- Error Banner -->
        {#if errorMessage}
          <div
            class="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl flex items-start gap-2.5"
          >
            <span class="text-rose-600 dark:text-rose-400 font-bold shrink-0">⚠️</span>
            <span class="text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
              {errorMessage}
            </span>
          </div>
        {/if}

        <!-- Parsed Deck Preview -->
        {#if parsedDeck}
          <div
            class="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 rounded-xl flex flex-col gap-2.5"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5"
              >
                <span>✓</span> Deck Ready to Import
              </span>
              <span
                class="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-600 text-white dark:bg-emerald-500"
              >
                {parsedDeck.itemCount} items
              </span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-sm font-bold text-gray-900 dark:text-gray-100">
                {parsedDeck.title}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Source: {parsedDeck.filename}
              </span>
            </div>

            <!-- Preview items snippet -->
            {#if parsedDeck.items.length > 0}
              <div
                class="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex flex-wrap gap-1.5"
              >
                {#each parsedDeck.items.slice(0, 4) as item}
                  <span
                    class="text-xs font-medium px-2 py-1 rounded bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 text-gray-800 dark:text-gray-200"
                  >
                    <span class="font-bold">{item.target}</span>
                    {#if item.translation}
                      <span class="text-gray-500 dark:text-gray-400 text-[11px]">
                        ({item.translation})</span
                      >
                    {/if}
                  </span>
                {/each}
                {#if parsedDeck.items.length > 4}
                  <span class="text-xs text-gray-500 dark:text-gray-400 self-center pl-1">
                    +{parsedDeck.items.length - 4} more
                  </span>
                {/if}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <!-- Footer Actions -->
      <div
        class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 flex items-center justify-end gap-3"
      >
        <button
          type="button"
          onclick={handleClose}
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!parsedDeck}
          onclick={handleConfirmImport}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
        >
          Add to Curriculum
        </button>
      </div>
    </div>
  </div>
{/if}
