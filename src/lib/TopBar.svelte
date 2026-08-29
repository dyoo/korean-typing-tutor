<script lang="ts">
  import GitHubLink from './GitHubLink.svelte';
  import ModeSwitcher from './ModeSwitcher.svelte';
  import MasteryTopBadge from './MasteryTopBadge.svelte';
  import type { TutorMode } from '../types/mastery';
  import type { MasteryDisplayInfo } from '../utils/masteryDisplayHelper';

  interface Props {
    mode: TutorMode;
    enabledModuleCount: number;
    totalModuleCount: number;
    masteryUnlockedCount: number;
    masteryTotalCount: number;
    masteryDisplayInfo?: MasteryDisplayInfo;
    showKpm?: boolean;
    ontogglemode: () => void;
    ontogglecurriculum: (e?: MouseEvent) => void;
    ontogglemastery: (e?: MouseEvent) => void;
    ontogglesettings: (e?: MouseEvent) => void;
  }

  let {
    mode,
    enabledModuleCount,
    totalModuleCount,
    masteryUnlockedCount,
    masteryTotalCount,
    masteryDisplayInfo,
    showKpm = true,
    ontogglemode,
    ontogglecurriculum,
    ontogglemastery,
    ontogglesettings,
  }: Props = $props();
</script>

<div class="w-full max-w-7xl flex items-center justify-between gap-2 md:gap-4 shrink-0">
  <div class="relative flex items-center gap-2 md:gap-3 shrink-0 min-w-0">
    {#if mode === 'curriculum'}
      <button
        type="button"
        onclick={ontogglecurriculum}
        onmousedown={(e) => e.stopPropagation()}
        class="flex items-center gap-1.5 md:gap-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg px-2.5 md:px-3 py-1 md:py-1.5 hover:border-blue-600 dark:hover:border-blue-500 focus:outline-none shadow-sm text-sm cursor-pointer whitespace-nowrap shrink-0"
        aria-label="Open Free-form Modules Sidebar"
      >
        <svg
          class="w-4 h-4 md:w-5 md:h-5 text-gray-600 dark:text-gray-300 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span
          class="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 hidden md:inline whitespace-nowrap"
        >
          Modules
        </span>
        <span
          class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 whitespace-nowrap shrink-0"
        >
          {enabledModuleCount}/{totalModuleCount}
        </span>
      </button>
    {:else if masteryDisplayInfo}
      <MasteryTopBadge
        displayInfo={masteryDisplayInfo}
        {masteryUnlockedCount}
        {masteryTotalCount}
        {showKpm}
        {ontogglemastery}
      />
    {/if}
  </div>

  <div class="flex items-center gap-1.5 md:gap-2 shrink-0 whitespace-nowrap">
    <GitHubLink />

    <ModeSwitcher {mode} {ontogglemode} />

    <button
      type="button"
      onclick={ontogglesettings}
      onmousedown={(e) => e.stopPropagation()}
      class="settings-btn flex items-center gap-1.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg px-3 py-1.5 hover:border-blue-600 dark:hover:border-blue-500 focus:outline-none shadow-sm text-sm cursor-pointer"
      aria-label="Settings"
    >
      <svg
        class="w-4 h-4 text-gray-500 dark:text-gray-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <span class="hidden md:inline">Settings</span>
    </button>
  </div>
</div>
