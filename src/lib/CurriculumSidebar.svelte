<script lang="ts">
  import { CURRICULUM_CATEGORIES } from '../content/curriculumCategories';
  import type { CurriculumCategory } from '../content/curriculumCategories';
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

  import SidebarDrawer from './SidebarDrawer.svelte';
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
