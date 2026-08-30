<script lang="ts">
  import {
    isGroupAllChecked,
    isGroupSomeChecked,
    getGroupCheckedCount,
  } from '../content/curriculumCategories';
  import type { CurriculumCategory } from '../content/curriculumCategories';
  import type { ModuleDefinition } from '../types/korean';

  interface Props {
    category: CurriculumCategory;
    modules: ModuleDefinition[];
    enabledModuleIds: string[];
    isCollapsed: boolean;
    ontogglecategorygroup: (category: CurriculumCategory) => void;
    ontogglecategorycollapse: (categoryId: string) => void;
    ontogglemodule: (moduleId: string) => void;
  }

  let {
    category,
    modules,
    enabledModuleIds,
    isCollapsed,
    ontogglecategorygroup,
    ontogglecategorycollapse,
    ontogglemodule,
  }: Props = $props();

  let allChecked = $derived(isGroupAllChecked(category, enabledModuleIds));
  let someChecked = $derived(isGroupSomeChecked(category, enabledModuleIds));
  let count = $derived(getGroupCheckedCount(category, enabledModuleIds));
</script>

<div
  class="flex flex-col border border-gray-200 dark:border-gray-700/60 rounded-xl p-2.5 bg-gray-50/60 dark:bg-gray-800/40 gap-2"
>
  <div
    class="flex items-center justify-between p-1 rounded-lg hover:bg-white dark:hover:bg-gray-700/70 transition-colors select-none"
  >
    <div class="flex items-center gap-2 min-w-0 flex-1">
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
        class="flex items-center gap-1.5 font-bold text-sm uppercase tracking-wide text-gray-800 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer text-left min-w-0"
      >
        <svg
          class="w-3.5 h-3.5 text-gray-400 transition-transform shrink-0 {isCollapsed
            ? '-rotate-90'
            : ''}"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
        <span class="text-left leading-snug">{category.name}</span>
      </button>
    </div>
    <span
      class="text-xs font-mono font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 shrink-0 ml-2"
    >
      {count}/{category.moduleIds.length}
    </span>
  </div>

  {#if !isCollapsed}
    <div
      class="flex flex-col gap-1.5 pl-3 border-l-2 border-blue-500/30 dark:border-blue-400/30 ml-3 mb-1 mr-1"
    >
      {#each category.moduleIds as modId}
        {@const mod = modules.find((m) => m.id === modId)}
        {#if mod}
          {@const isEnabled = enabledModuleIds.includes(mod.id)}
          <label
            class="flex items-start gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none"
          >
            <input
              type="checkbox"
              checked={isEnabled}
              onchange={() => ontogglemodule(mod.id)}
              class="mt-0.5 w-4 h-4 text-blue-600 rounded cursor-pointer shrink-0"
            />
            <div class="flex flex-col min-w-0">
              <div class="flex items-baseline gap-1.5 flex-wrap">
                <span class="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                  {mod.title}
                </span>
                {#if mod.itemCount !== undefined}
                  <span class="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    ({mod.itemCount} items)
                  </span>
                {/if}
              </div>
              {#if mod.description}
                <span class="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">
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
