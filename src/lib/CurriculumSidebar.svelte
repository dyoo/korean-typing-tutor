<script lang="ts">
  import { CURRICULUM_CATEGORIES } from '../utils/curriculumCategories';
  import type { CurriculumCategory } from '../utils/curriculumCategories';
  import type { ModuleDefinition } from '../types/korean';
  import CurriculumCategoryGroup from './CurriculumCategoryGroup.svelte';

  interface Props {
    isOpen: boolean;
    enabledModuleIds: string[];
    collapsedCategoryIds: string[];
    modules: ModuleDefinition[];
    onclose: () => void;
    ontogglemodule: (moduleId: string) => void;
    ontogglecategorycollapse: (categoryId: string) => void;
    ontogglecategorygroup: (category: CurriculumCategory) => void;
    onselectall: () => void;
    ondeselectall: () => void;
  }

  let {
    isOpen,
    enabledModuleIds,
    collapsedCategoryIds,
    modules,
    onclose,
    ontogglemodule,
    ontogglecategorycollapse,
    ontogglecategorygroup,
    onselectall,
    ondeselectall,
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop Overlay -->
  <div
    role="button"
    tabindex="-1"
    aria-label="Close sidebar backdrop"
    onclick={onclose}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') onclose();
    }}
    class="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 transition-opacity select-none"
  ></div>

  <!-- Sidebar Panel -->
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Free-form Modules Sidebar"
    class="fixed inset-y-0 left-0 z-50 w-80 sm:w-96 bg-white dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80"
    >
      <div class="flex flex-col">
        <h2
          class="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 font-mono"
        >
          Free-form Modules
        </h2>
        <span class="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
          Enabled ({enabledModuleIds.length}/{modules.length})
        </span>
      </div>

      <button
        type="button"
        onclick={onclose}
        class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        aria-label="Close Sidebar"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Quick Actions -->
    <div
      class="flex items-center justify-between px-4 py-2 bg-gray-100/60 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700/60"
    >
      <button
        type="button"
        onclick={onselectall}
        class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
      >
        Select All
      </button>
      <span class="text-xs text-gray-300 dark:text-gray-600">•</span>
      <button
        type="button"
        onclick={ondeselectall}
        class="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
      >
        Select None
      </button>
    </div>

    <!-- Categories List -->
    <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 [scrollbar-width:thin]">
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
  </div>
{/if}
