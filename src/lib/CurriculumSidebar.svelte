<script lang="ts">
  import {
    CURRICULUM_CATEGORIES,
    isGroupAllChecked,
    isGroupSomeChecked,
    getGroupCheckedCount
  } from '../utils/curriculumCategories';
  import type { CurriculumCategory } from '../utils/curriculumCategories';
  import type { ModuleDefinition } from '../types/korean';

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
    ondeselectall
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
    onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') onclose(); }}
    class="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 transition-opacity select-none"
  ></div>

  <!-- Sidebar Panel -->
  <div
    role="dialog"
    aria-modal="true"
    aria-label="Curriculum Sidebar"
    class="fixed inset-y-0 left-0 z-50 w-80 sm:w-96 bg-white dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80">
      <div class="flex flex-col">
        <h2 class="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 font-mono">
          Curriculum Modules
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
    <div class="flex items-center justify-between px-4 py-2 bg-gray-100/60 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700/60">
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
        {@const allChecked = isGroupAllChecked(category, enabledModuleIds)}
        {@const someChecked = isGroupSomeChecked(category, enabledModuleIds)}
        {@const count = getGroupCheckedCount(category, enabledModuleIds)}
        {@const isCollapsed = collapsedCategoryIds.includes(category.id)}

        <div class="flex flex-col border border-gray-200 dark:border-gray-700/60 rounded-xl p-2.5 bg-gray-50/60 dark:bg-gray-800/40 gap-2">
          <div class="flex items-center justify-between p-1 rounded-lg hover:bg-white dark:hover:bg-gray-700/70 transition-colors select-none">
            <div class="flex items-center gap-2">
              <input
                type="checkbox"
                checked={allChecked}
                indeterminate={someChecked}
                onchange={() => ontogglecategorygroup(category)}
                class="w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0"
              />
              <button
                type="button"
                onclick={() => ontogglecategorycollapse(category.id)}
                class="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
              >
                <svg
                  class="w-3.5 h-3.5 text-gray-400 transition-transform {isCollapsed ? '-rotate-90' : ''}"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                <span>{category.name}</span>
              </button>
            </div>
            <span class="text-[10px] font-mono font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 shrink-0">
              {count}/{category.moduleIds.length}
            </span>
          </div>

          {#if !isCollapsed}
            <div class="flex flex-col gap-1.5 pl-3 border-l-2 border-blue-500/30 dark:border-blue-400/30 ml-3 mb-1 mr-1">
              {#each category.moduleIds as modId}
                {@const mod = modules.find(m => m.id === modId)}
                {#if mod}
                  {@const isEnabled = enabledModuleIds.includes(mod.id)}
                  <label class="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none">
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onchange={() => ontogglemodule(mod.id)}
                      class="mt-0.5 w-3.5 h-3.5 text-blue-600 rounded cursor-pointer shrink-0"
                    />
                    <div class="flex flex-col">
                      <span class="text-xs font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                        {mod.title}
                      </span>
                      {#if mod.description}
                        <span class="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
                          {mod.description}
                        </span>
                      {/if}
                    </div>
                  </label>
                {/if}
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
