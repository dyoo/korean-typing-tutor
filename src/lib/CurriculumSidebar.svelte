<script lang="ts">
  import { CURRICULUM_CATEGORIES } from '../content/curriculumCategories';
  import type { CurriculumCategory } from '../content/curriculumCategories';
  import type { ModuleDefinition } from '../types/korean';
  import type { CustomDeck } from '../types/customDecks';
  import CurriculumCategoryGroup from './CurriculumCategoryGroup.svelte';
  import SidebarDrawer from './SidebarDrawer.svelte';

  interface Props {
    isOpen: boolean;
    enabledModuleIds: string[];
    collapsedCategoryIds: string[];
    modules: ModuleDefinition[];
    customDecks?: CustomDeck[];
    onclose: () => void;
    ontogglemodule: (moduleId: string) => void;
    ontogglecategorycollapse: (categoryId: string) => void;
    ontogglecategorygroup: (category: CurriculumCategory) => void;
    onselectall: () => void;
    ondeselectall: () => void;
    onopenimportmodal?: () => void;
    ondeletecustomdeck?: (deckId: string) => void;
  }

  let {
    isOpen,
    enabledModuleIds,
    collapsedCategoryIds,
    modules,
    customDecks = [],
    onclose,
    ontogglemodule,
    ontogglecategorycollapse,
    ontogglecategorygroup,
    onselectall,
    ondeselectall,
    onopenimportmodal,
    ondeletecustomdeck,
  }: Props = $props();

  let isAllChecked = $derived(
    modules.length > 0 && modules.every((m) => enabledModuleIds.includes(m.id)),
  );
  let isSomeChecked = $derived(enabledModuleIds.length > 0 && !isAllChecked);

  let isCustomCollapsed = $derived(collapsedCategoryIds.includes('custom'));
  let allCustomChecked = $derived(
    customDecks.length > 0 && customDecks.every((d) => enabledModuleIds.includes(d.id)),
  );
  let someCustomChecked = $derived(
    customDecks.some((d) => enabledModuleIds.includes(d.id)) && !allCustomChecked,
  );
  let customCheckedCount = $derived(
    customDecks.filter((d) => enabledModuleIds.includes(d.id)).length,
  );

  function handleToggleRoot() {
    if (isAllChecked) {
      ondeselectall();
    } else {
      onselectall();
    }
  }

  function handleToggleCustomGroup() {
    if (allCustomChecked) {
      // Disable all custom decks
      for (const deck of customDecks) {
        if (enabledModuleIds.includes(deck.id)) {
          ontogglemodule(deck.id);
        }
      }
    } else {
      // Enable all custom decks
      for (const deck of customDecks) {
        if (!enabledModuleIds.includes(deck.id)) {
          ontogglemodule(deck.id);
        }
      }
    }
  }
</script>

<SidebarDrawer
  {isOpen}
  title="Free-form Modules"
  subtitle="Enabled ({enabledModuleIds.length}/{modules.length})"
  ariaLabel="Free-form Modules Sidebar"
  {onclose}
>
  {#snippet headerActions()}
    <!-- Root Tree Selector (Tri-state) -->
    <div
      class="flex items-center justify-between px-4 py-2.5 bg-gray-100/70 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700/60 select-none"
    >
      <label class="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1">
        <input
          type="checkbox"
          checked={isAllChecked}
          indeterminate={isSomeChecked}
          onchange={handleToggleRoot}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0"
        />
        <span
          class="font-bold text-sm uppercase tracking-wide text-gray-800 dark:text-gray-200 truncate"
        >
          All Modules
        </span>
      </label>
      <span
        class="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 shrink-0 ml-2"
      >
        {enabledModuleIds.length}/{modules.length}
      </span>
    </div>
  {/snippet}

  <!-- Categories List -->
  <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 [scrollbar-width:thin]">
    <!-- Custom / Anki Decks Section -->
    <div
      class="flex flex-col border border-blue-200 dark:border-blue-800/60 bg-blue-50/40 dark:bg-blue-950/20 rounded-xl p-2.5 gap-2"
    >
      <div
        class="flex items-center justify-between p-1 rounded-lg hover:bg-white dark:hover:bg-gray-800/70 transition-colors select-none"
      >
        <div class="flex items-center gap-2 min-w-0 flex-1">
          {#if customDecks.length > 0}
            <input
              type="checkbox"
              checked={allCustomChecked}
              indeterminate={someCustomChecked}
              onchange={handleToggleCustomGroup}
              class="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0"
              aria-label="Toggle all custom decks"
            />
          {/if}
          <button
            type="button"
            onclick={() => ontogglecategorycollapse('custom')}
            class="flex items-center gap-1.5 font-bold text-sm uppercase tracking-wide text-blue-900 dark:text-blue-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left min-w-0 flex-1"
          >
            <svg
              class="w-3.5 h-3.5 text-blue-500 transition-transform shrink-0 {isCustomCollapsed
                ? '-rotate-90'
                : ''}"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
            <span class="text-left leading-snug">Custom / Anki Decks</span>
          </button>
        </div>

        <div class="flex items-center gap-1.5 shrink-0 ml-2">
          {#if customDecks.length > 0}
            <span
              class="text-xs font-mono font-semibold text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700"
            >
              {customCheckedCount}/{customDecks.length}
            </span>
          {/if}
          <button
            type="button"
            onclick={onopenimportmodal}
            class="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 px-2 py-0.5 rounded-md shadow-2xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/50"
          >
            <span>+ Import</span>
          </button>
        </div>
      </div>

      {#if !isCustomCollapsed}
        {#if customDecks.length > 0}
          <div
            class="flex flex-col gap-1.5 pl-3 border-l-2 border-blue-500/40 dark:border-blue-400/30 ml-3 mb-1 mr-1"
          >
            {#each customDecks as deck}
              {@const isChecked = enabledModuleIds.includes(deck.id)}
              <div
                class="flex items-start justify-between gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors group"
              >
                <label class="flex items-start gap-2.5 cursor-pointer min-w-0 flex-1 select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onchange={() => ontogglemodule(deck.id)}
                    class="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0"
                  />
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-baseline gap-1.5 flex-wrap">
                      <span
                        class="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight"
                      >
                        {deck.title}
                      </span>
                      <span class="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        ({deck.itemCount} items)
                      </span>
                    </div>
                  </div>
                </label>
                <button
                  type="button"
                  onclick={(e) => {
                    e.stopPropagation();
                    ondeletecustomdeck?.(deck.id);
                  }}
                  class="mt-0.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors shrink-0"
                  title="Delete custom deck"
                  aria-label={`Delete custom deck ${deck.title}`}
                >
                  <svg
                    class="w-3.5 h-3.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            {/each}
          </div>
        {:else}
          <div class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic">
            No custom decks imported yet. Click "+ Import" to add flashcards.
          </div>
        {/if}
      {/if}
    </div>

    {#each CURRICULUM_CATEGORIES as category}
      <CurriculumCategoryGroup
        {category}
        {modules}
        {enabledModuleIds}
        isCollapsed={collapsedCategoryIds.includes(category.id)}
        {ontogglecategorygroup}
        {ontogglecategorycollapse}
        {ontogglemodule}
      />
    {/each}
  </div>
</SidebarDrawer>
