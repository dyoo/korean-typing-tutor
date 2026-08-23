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
    modules.length > 0 && enabledModuleIds.length === modules.length,
  );
  let isSomeChecked = $derived(
    enabledModuleIds.length > 0 && enabledModuleIds.length < modules.length,
  );

  function handleToggleRoot() {
    if (isAllChecked) {
      ondeselectall();
    } else {
      onselectall();
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
      <div class="flex items-center justify-between p-1 select-none">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-sm">🗂️</span>
          <span class="font-bold text-xs uppercase tracking-wide text-blue-900 dark:text-blue-200">
            Custom / Anki Decks
          </span>
          {#if customDecks.length > 0}
            <span
              class="text-[10px] font-mono font-bold bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.5 rounded text-blue-800 dark:text-blue-300"
            >
              {customDecks.length}
            </span>
          {/if}
        </div>
        <button
          type="button"
          onclick={onopenimportmodal}
          class="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-700 px-2 py-1 rounded-md shadow-2xs cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/50"
        >
          <span>+ Import Deck</span>
        </button>
      </div>

      {#if customDecks.length > 0}
        <div class="flex flex-col gap-1 pl-2 border-l-2 border-blue-400/40 dark:border-blue-500/30 ml-2">
          {#each customDecks as deck}
            {@const isChecked = enabledModuleIds.includes(deck.id)}
            <div
              class="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors group"
            >
              <label class="flex items-center gap-2 cursor-pointer min-w-0 flex-1 select-none">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onchange={() => ontogglemodule(deck.id)}
                  class="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0"
                />
                <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate">
                  {deck.title}
                </span>
                <span class="text-[10px] font-mono text-gray-500 dark:text-gray-400 shrink-0">
                  ({deck.itemCount})
                </span>
              </label>
              <button
                type="button"
                onclick={(e) => {
                  e.stopPropagation();
                  ondeletecustomdeck?.(deck.id);
                }}
                class="text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition-colors shrink-0"
                title="Delete custom deck"
                aria-label={`Delete custom deck ${deck.title}`}
              >
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          {/each}
        </div>
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
