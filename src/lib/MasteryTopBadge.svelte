<script lang="ts">
  import type { MasteryDisplayInfo } from '../utils/masteryDisplayHelper';

  interface Props {
    displayInfo: MasteryDisplayInfo;
    masteryUnlockedCount: number;
    masteryTotalCount: number;
    showKpm?: boolean;
    ontogglemastery: (e?: MouseEvent) => void;
  }

  let {
    displayInfo,
    masteryUnlockedCount,
    masteryTotalCount,
    showKpm = true,
    ontogglemastery,
  }: Props = $props();

  let isPostGame = $derived(displayInfo.isPostGame);
  let postGameSubtype = $derived(displayInfo.postGameSubtype);
  let currentStageNumber = $derived(displayInfo.currentStageNumber);
  let totalStageCount = $derived(displayInfo.totalStageCount);
  let currentStageName = $derived(displayInfo.currentStageName);
  let activeCheckpointTitle = $derived(displayInfo.activeCheckpointTitle);
  let activeCheckpointProgress = $derived(displayInfo.activeCheckpointProgress);
  let activeJamoChar = $derived(displayInfo.activeJamoChar);
  let activeJamoLabel = $derived(displayInfo.activeJamoLabel);
  let activeJamoProgress = $derived(displayInfo.activeJamoProgress);
  let activeLearningCombination = $derived(displayInfo.activeLearningCombination);
  let activeTargetRemaining = $derived(displayInfo.activeTargetRemaining);
  let activeKpm = $derived(displayInfo.activeKpm);
</script>

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
    title={isPostGame
      ? `Consolidation: ${postGameSubtype ?? 'Post-game'}`
      : `Stage ${currentStageNumber}: ${currentStageName}`}
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
  {:else if isPostGame && activeJamoChar}
    <div
      class="flex items-center gap-1 md:gap-1.5 pl-1.5 border-l border-purple-200 dark:border-purple-800/80 shrink-0 whitespace-nowrap"
    >
      <span
        class="relative overflow-hidden text-sm md:text-base font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-1.5 md:px-2 py-0.5 rounded-md border border-purple-300 dark:border-purple-700 leading-none flex items-center justify-center min-w-[24px] md:min-w-[28px] shadow-2xs gap-1.5 whitespace-nowrap shrink-0"
      >
        <span class="relative z-10 whitespace-nowrap">{activeJamoChar}</span>
        {#if showKpm}
          <span
            class="relative z-10 font-mono font-bold leading-none text-purple-700 dark:text-purple-300 bg-purple-200/80 dark:bg-purple-900/80 px-1.5 py-0.5 rounded text-xs whitespace-nowrap"
          >
            {activeKpm !== null && activeKpm !== undefined ? `${activeKpm} KPM` : '— KPM'}
          </span>
        {/if}
      </span>
    </div>
  {:else if isPostGame && showKpm}
    <div
      class="flex items-center gap-1 md:gap-1.5 pl-1.5 border-l border-purple-200 dark:border-purple-800/80 shrink-0 whitespace-nowrap"
    >
      <span
        class="relative overflow-hidden text-xs md:text-sm font-bold font-mono text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/80 px-1.5 md:px-2 py-0.5 rounded-md border border-purple-300 dark:border-purple-700 leading-none flex items-center gap-1 md:gap-1.5 shadow-2xs whitespace-nowrap shrink-0"
      >
        <span class="whitespace-nowrap"
          >{activeKpm !== null && activeKpm !== undefined ? `${activeKpm} KPM` : '— KPM'}</span
        >
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
        {#if activeJamoProgress > 0}
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
            class="relative z-10 font-mono font-bold leading-none text-amber-900 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[10px]"
          >
            {activeTargetRemaining}
          </span>
        {/if}
      </span>
    </div>
  {/if}
</button>
