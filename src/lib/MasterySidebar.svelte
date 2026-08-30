<script lang="ts">
  import {
    JAMO_PROGRESSION_ORDER,
    JAMO_STAGES,
    VOWEL_FOCUS_LIST,
    CONSONANT_FOCUS_LIST,
    BATCHIM_FOCUS_LIST,
    calculateJamoProgress,
  } from '../utils/jamoMastery';
  import { getJamoKpmStats, getCategoryKpmStats } from '../utils/speedTracker';
  import type { SpeedMetricsStore } from '../utils/speedTracker';
  import type { JamoStats, SentenceCheckpointStats } from '../types/mastery';
  import SidebarDrawer from './SidebarDrawer.svelte';
  import MasteryStageItem from './MasteryStageItem.svelte';
  import MasteryMilestoneItem from './MasteryMilestoneItem.svelte';
  import MasteryFocusItem from './MasteryFocusItem.svelte';

  interface Props {
    isOpen: boolean;
    masteryUnlockedCount: number;
    currentStageNumber?: number;
    activeCheckpointId?: string | null;
    activeFocusBatchim?: string | null;
    jamoStats: Record<string, JamoStats>;
    sentenceCheckpointStats?: Record<string, SentenceCheckpointStats>;
    speedStore?: SpeedMetricsStore;
    showKpm?: boolean;
    collapsedStageIds?: string[];
    onclose: () => void;
    onmasterylevelchange: (level: number) => void;
    oncheckpointselect?: (checkpointId: string) => void;
    onfocusselect?: (batchim: string) => void;
    ontogglestagecollapse?: (stageName: string) => void;
  }

  let {
    isOpen,
    masteryUnlockedCount,
    currentStageNumber = 1,
    activeCheckpointId = null,
    activeFocusBatchim = null,
    jamoStats,
    sentenceCheckpointStats = {},
    speedStore,
    showKpm = true,
    collapsedStageIds = [],
    onclose,
    onmasterylevelchange,
    oncheckpointselect,
    onfocusselect,
    ontogglestagecollapse,
  }: Props = $props();

  let isWorkshopActive = $derived(Boolean(activeFocusBatchim));
  let isConsolidationCollapsed = $derived(
    collapsedStageIds.includes('Consolidation') || collapsedStageIds.includes('Batchim Workshop'),
  );
  let wordsStats = $derived(speedStore ? getCategoryKpmStats(speedStore, 'words') : null);
  let sentenceStats = $derived(speedStore ? getCategoryKpmStats(speedStore, 'sentences') : null);

  function getAccuracy(stats?: JamoStats): number | null {
    if (stats && stats.totalAttempts > 0) {
      return Math.round((stats.correctAttempts / stats.totalAttempts) * 100);
    }
    return null;
  }

  function toggleStageCollapse(stageName: string) {
    ontogglestagecollapse?.(stageName);
  }

  function handleLevelSelect(level: number) {
    onmasterylevelchange(level);
  }

  function handleCheckpointSelect(cpId: string) {
    oncheckpointselect?.(cpId);
  }

  function handleFocusSelect(batchim: string) {
    onfocusselect?.(batchim);
  }
</script>

<SidebarDrawer
  {isOpen}
  title="Jamo Mastery"
  subtitle="Unlocked ({masteryUnlockedCount}/{JAMO_PROGRESSION_ORDER.length})"
  ariaLabel="Mastery Progress Sidebar"
  {onclose}
>
  <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 [scrollbar-width:thin]">
    <!-- Linear Progression Stage Tree -->
    {#each JAMO_STAGES as stage}
      {@const isCurrentStage = !activeFocusBatchim && stage.stageNum === currentStageNumber}
      <div
        class="flex flex-col border {isCurrentStage
          ? 'border-amber-400/90 dark:border-amber-500/90 bg-amber-50/40 dark:bg-amber-950/20 ring-1 ring-amber-400/40 dark:ring-amber-500/30'
          : 'border-gray-200 dark:border-gray-700/60 bg-gray-50/60 dark:bg-gray-800/40'} rounded-xl p-2.5 gap-2"
      >
        <div
          class="flex items-center justify-between p-1 rounded-lg hover:bg-white dark:hover:bg-gray-700/70 transition-colors select-none"
        >
          <button
            type="button"
            onclick={() => toggleStageCollapse(stage.stageName)}
            class="flex items-center gap-1.5 font-bold text-sm uppercase tracking-wide {isCurrentStage
              ? 'text-amber-700 dark:text-amber-300 font-extrabold'
              : 'text-gray-800 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400'} cursor-pointer text-left min-w-0"
          >
            <svg
              class="w-3.5 h-3.5 {isCurrentStage
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-gray-400'} transition-transform shrink-0 {collapsedStageIds.includes(
                stage.stageName,
              )
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
            <span class="text-left leading-snug">{stage.stageName}</span>
          </button>
          {#if isCurrentStage}
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded border border-amber-300 dark:border-amber-700 shrink-0"
            >
              Current
            </span>
          {/if}
        </div>

        {#if !collapsedStageIds.includes(stage.stageName)}
          <div
            class="flex flex-col gap-1.5 pl-3 border-l-2 border-amber-500/30 dark:border-amber-400/30 ml-3 mb-1 mr-1"
          >
            {#each stage.items as item}
              {@const idx = JAMO_PROGRESSION_ORDER.indexOf(item)}
              {@const level = idx + 1}
              {@const isSelected = !activeCheckpointId && masteryUnlockedCount === level}
              {@const progress = calculateJamoProgress(jamoStats[item.jamo])}
              <MasteryStageItem
                jamo={item.jamo}
                keyName={item.key}
                shift={item.shift}
                {isSelected}
                {progress}
                onselect={() => handleLevelSelect(level)}
              />
            {/each}

            {#if stage.checkpoint}
              {@const cp = stage.checkpoint}
              {@const cpStats = sentenceCheckpointStats[cp.id]}
              {@const isCpSelected = activeCheckpointId === cp.id}
              <MasteryMilestoneItem
                title={cp.title}
                completedCount={cpStats?.completedCount ?? 0}
                requiredCompletions={cp.requiredCompletions}
                isMastered={cpStats?.isMastered ?? false}
                isSelected={isCpSelected}
                onselect={() => handleCheckpointSelect(cp.id)}
              />
            {/if}
          </div>
        {/if}
      </div>
    {/each}

    <!-- Post-game Consolidation Section -->
    <div
      class="flex flex-col border {isWorkshopActive
        ? 'border-purple-400 dark:border-purple-600 bg-purple-50/60 dark:bg-purple-950/30 ring-1 ring-purple-400/40 dark:ring-purple-500/30'
        : 'border-purple-200 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/20'} rounded-xl p-2.5 gap-2"
    >
      <div
        class="flex items-center justify-between p-1 rounded-lg hover:bg-white dark:hover:bg-gray-700/70 transition-colors select-none"
      >
        <button
          type="button"
          onclick={() => toggleStageCollapse('Consolidation')}
          class="flex items-center gap-1.5 font-bold text-sm uppercase tracking-wide {isWorkshopActive
            ? 'text-purple-700 dark:text-purple-300 font-extrabold'
            : 'text-purple-900 dark:text-purple-300 hover:text-purple-600 dark:hover:text-purple-400'} cursor-pointer"
        >
          <svg
            class="w-3.5 h-3.5 {isWorkshopActive
              ? 'text-purple-500 dark:text-purple-400'
              : 'text-purple-400'} transition-transform {isConsolidationCollapsed
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
          <span>Consolidation</span>
        </button>
        {#if isWorkshopActive}
          <span
            class="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.5 rounded border border-purple-300 dark:border-purple-700 shrink-0"
          >
            Current
          </span>
        {/if}
      </div>

      {#if !isConsolidationCollapsed}
        <div
          class="flex flex-col gap-1.5 pl-3 border-l-2 border-purple-500/30 dark:border-purple-400/30 ml-3 mb-1 mr-1"
        >
          <!-- All Words Practice Option -->
          <MasteryFocusItem
            label="Word Practice"
            isSelected={activeFocusBatchim === 'words'}
            {showKpm}
            kpmStats={wordsStats}
            onselect={() => handleFocusSelect('words')}
          />

          <!-- All Sentences Practice Option -->
          <MasteryFocusItem
            label="Sentence Practice"
            isSelected={activeFocusBatchim === 'sentences'}
            {showKpm}
            kpmStats={sentenceStats}
            onselect={() => handleFocusSelect('sentences')}
          />

          <!-- Vowels (모음) Section -->
          <div class="border-t border-purple-200/70 dark:border-purple-800/60 my-1 pt-1">
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-1"
            >
              Vowels (모음)
            </span>
          </div>

          {#each VOWEL_FOCUS_LIST as item}
            {@const isSelected =
              activeFocusBatchim === `vowel:${item.jamo}` || activeFocusBatchim === item.jamo}
            {@const stats = jamoStats[item.jamo]}
            {@const progress = calculateJamoProgress(stats)}
            {@const jamoKpm = speedStore ? getJamoKpmStats(speedStore, item.jamo) : null}
            <MasteryFocusItem
              label={item.jamo}
              isChar={true}
              {progress}
              {isSelected}
              {showKpm}
              kpmStats={jamoKpm}
              accuracy={getAccuracy(stats)}
              onselect={() => handleFocusSelect(`vowel:${item.jamo}`)}
            />
          {/each}

          <!-- Consonants (자음) Section -->
          <div class="border-t border-purple-200/70 dark:border-purple-800/60 my-1 pt-1">
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-1"
            >
              Consonants (자음)
            </span>
          </div>

          {#each CONSONANT_FOCUS_LIST as item}
            {@const isSelected =
              activeFocusBatchim === `consonant:${item.jamo}` || activeFocusBatchim === item.jamo}
            {@const stats = jamoStats[item.jamo]}
            {@const progress = calculateJamoProgress(stats)}
            {@const jamoKpm = speedStore ? getJamoKpmStats(speedStore, item.jamo) : null}
            <MasteryFocusItem
              label={item.jamo}
              isChar={true}
              {progress}
              {isSelected}
              {showKpm}
              kpmStats={jamoKpm}
              accuracy={getAccuracy(stats)}
              onselect={() => handleFocusSelect(`consonant:${item.jamo}`)}
            />
          {/each}

          <!-- Final Consonants (받침) Section -->
          <div class="border-t border-purple-200/70 dark:border-purple-800/60 my-1 pt-1">
            <span
              class="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-1"
            >
              Final Consonants (받침)
            </span>
          </div>

          {#each BATCHIM_FOCUS_LIST as item}
            {@const isSelected =
              activeFocusBatchim === `batchim:${item.batchim}` ||
              activeFocusBatchim === item.batchim}
            {@const stats = jamoStats[item.batchim]}
            {@const progress = calculateJamoProgress(stats)}
            {@const jamoKpm = speedStore ? getJamoKpmStats(speedStore, item.batchim) : null}
            <MasteryFocusItem
              label={item.batchim}
              isChar={true}
              {progress}
              {isSelected}
              {showKpm}
              kpmStats={jamoKpm}
              accuracy={getAccuracy(stats)}
              onselect={() => handleFocusSelect(`batchim:${item.batchim}`)}
            />
          {/each}
        </div>
      {/if}
    </div>
  </div>
</SidebarDrawer>
