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
    <!-- Quick Actions -->
    <div
      class="flex items-center justify-between px-4 py-2 bg-gray-100/60 dark:bg-gray-900/40 border-b border-gray-200 dark:border-gray-700/60"
    >
      <button
        type="button"
        onclick={onselectall}
        class="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
      >
        Select All
      </button>
      <span class="text-sm text-gray-300 dark:text-gray-600">•</span>
      <button
        type="button"
        onclick={ondeselectall}
        class="text-sm text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
      >
        Select None
      </button>
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
