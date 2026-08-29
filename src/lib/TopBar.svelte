<script lang="ts">
  import GitHubLink from './GitHubLink.svelte';
  import ModeSwitcher from './ModeSwitcher.svelte';
  import type { TutorMode } from '../types/mastery';

  interface Props {
    mode: TutorMode;
    enabledModuleCount: number;
    totalModuleCount: number;
    masteryUnlockedCount: number;
    masteryTotalCount: number;
    currentStageNumber?: number;
    totalStageCount?: number;
    currentStageName?: string;
    activeJamoChar?: string | null;
    activeJamoLabel?: string;
    activeLearningCombination?: [string, string];
    activeJamoProgress?: number;
    activeTargetRemaining?: string | null;
    isPostGame?: boolean;
    postGameSubtype?: string | null;
    activeCheckpointTitle?: string | null;
    activeCheckpointProgress?: { completed: number; total: number } | null;
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
    currentStageNumber = 1,
    totalStageCount = 5,
    currentStageName = 'Home Row',
    activeJamoChar = null,
    activeJamoLabel = 'Focus:',
    activeLearningCombination,
    activeJamoProgress = 0,
    activeTargetRemaining = null,
    isPostGame = false,
    postGameSubtype = null,
    activeCheckpointTitle = null,
    activeCheckpointProgress = null,
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
    {:else}
      <!-- Mastery Mode Progress Badge -->
      <button
        type="button"
        onclick={ontogglemastery}
        onmousedown={(e) => e.stopPropagation()}
        class="flex items-center gap-1.5 md:gap-2.5 bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-700/60 text-gray-800 dark:text-gray-200 font-semibold rounded-lg px-2 md:px-3 py-1 md:py-1.5 hover:border-amber-600 dark:hover:border-amber-500 focus:outline-none shadow-sm text-sm cursor-pointer whitespace-nowrap shrink-0"
        aria-label="Open Mastery Progress Sidebar ({masteryUnlockedCount}/{masteryTotalCount} Jamos unlocked)"
      >
        <svg
          class="w-4 h-4 md:w-5 md:h-5 text-amber-600 dark:text-amber-400 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>

        <span
          class="font-bold text-xs uppercase tracking-wider {isPostGame
            ? 'text-purple-700 dark:text-purple-300'
            : 'text-gray-700 dark:text-gray-300'} hidden md:inline whitespace-nowrap"
        >
          {isPostGame ? 'Consolidation' : 'Stage'}
        </span>
        <span
          class="text-xs font-mono font-bold {isPostGame
            ? 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800'
            : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800'} px-1.5 py-0.5 rounded whitespace-nowrap shrink-0"
          title={isPostGame ? `Consolidation: ${postGameSubtype ?? 'Post-game'}` : `Stage ${currentStageNumber}: ${currentStageName}`}
        >
          {isPostGame ? (postGameSubtype ?? 'Consolidation') : `${currentStageNumber}/${totalStageCount}`}
        </span>
        {#if activeCheckpointTitle}
          <div
            class="flex items-center gap-1 md:gap-1.5 pl-1.5 border-l border-amber-200 dark:border-amber-800/80 shrink-0 whitespace-nowrap"
          >
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:inline whitespace-nowrap"
            >
              Milestone:
            </span>
            <span
              class="relative overflow-hidden text-xs md:text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/80 px-1.5 md:px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 leading-none flex items-center gap-1 md:gap-1.5 shadow-2xs whitespace-nowrap shrink-0"
            >
              <span class="whitespace-nowrap">{activeCheckpointTitle}</span>
              {#if activeCheckpointProgress}
                <span
                  class="text-[10px] font-mono font-bold bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded text-amber-900 dark:text-amber-200 whitespace-nowrap"
                >
                  {activeCheckpointProgress.completed}/{activeCheckpointProgress.total}
                </span>
              {/if}
            </span>
          </div>
        {:else if activeJamoChar}
          <div
            class="flex items-center gap-1 md:gap-1.5 pl-1.5 border-l border-amber-200 dark:border-amber-800/80 shrink-0 whitespace-nowrap"
          >
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:inline whitespace-nowrap"
            >
              {activeJamoLabel}
            </span>
            <span
              class="relative overflow-hidden text-sm md:text-base font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-1.5 md:px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 leading-none flex items-center justify-center min-w-[24px] md:min-w-[28px] shadow-2xs gap-1 md:gap-1.5 whitespace-nowrap shrink-0"
            >
              {#if activeJamoProgress > 0 && !isPostGame}
                <div
                  class="absolute bottom-0 inset-x-0 pointer-events-none {activeJamoProgress >= 100
                    ? 'bg-emerald-500/25 dark:bg-emerald-400/25'
                    : 'bg-amber-400/30 dark:bg-amber-400/25'}"
                  style="height: {activeJamoProgress}%;"
                ></div>
              {/if}
              <span class="relative z-10 whitespace-nowrap">{activeJamoChar}</span>
              {#if activeLearningCombination}
                <span
                  class="relative z-10 text-[10px] md:text-[11px] font-medium text-amber-600/90 dark:text-amber-400/90 whitespace-nowrap"
                >
                  ({activeLearningCombination[0]}+{activeLearningCombination[1]})
                </span>
              {/if}
              {#if activeTargetRemaining}
                <span
                  class="relative z-10 font-mono font-bold leading-none {isPostGame
                    ? 'text-purple-700 dark:text-purple-300 bg-purple-200/80 dark:bg-purple-900/80 px-1.5 py-0.5 rounded text-xs md:text-sm'
                    : 'text-amber-900 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[10px]'}"
                >
                  {activeTargetRemaining}
                </span>
              {/if}
            </span>
          </div>
        {:else if isPostGame && activeTargetRemaining}
          <div
            class="flex items-center gap-1 md:gap-1.5 pl-1.5 border-l border-purple-200 dark:border-purple-800/80 shrink-0 whitespace-nowrap"
          >
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:inline whitespace-nowrap"
            >
              Target:
            </span>
            <span
              class="relative overflow-hidden text-xs md:text-sm font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-1.5 md:px-2 py-0.5 rounded-md border border-purple-300 dark:border-purple-700 leading-none flex items-center gap-1 md:gap-1.5 shadow-2xs whitespace-nowrap shrink-0"
            >
              <span class="whitespace-nowrap">{activeTargetRemaining}</span>
            </span>
          </div>
        {/if}
      </button>
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
