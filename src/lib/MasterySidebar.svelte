<script lang="ts">
  import {
    JAMO_PROGRESSION_ORDER,
    JAMO_STAGES,
    BATCHIM_FOCUS_LIST,
    calculateJamoProgress,
  } from '../utils/jamoMastery';
  import type {
    JamoStats,
    SentenceCheckpointStats,
  } from '../types/mastery';
  import SidebarDrawer from './SidebarDrawer.svelte';

  interface Props {
    isOpen: boolean;
    masteryUnlockedCount: number;
    currentStageNumber?: number;
    activeCheckpointId?: string | null;
    activeFocusBatchim?: string | null;
    jamoStats: Record<string, JamoStats>;
    sentenceCheckpointStats?: Record<string, SentenceCheckpointStats>;
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
    collapsedStageIds = [],
    onclose,
    onmasterylevelchange,
    oncheckpointselect,
    onfocusselect,
    ontogglestagecollapse,
  }: Props = $props();

  let isWorkshopActive = $derived(Boolean(activeFocusBatchim));
  let isConsolidationCollapsed = $derived(
    collapsedStageIds.includes('Consolidation') ||
      collapsedStageIds.includes('Batchim Workshop'),
  );

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
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
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
                <label
                  class="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none {isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/40'
                    : ''}"
                >
                  <input
                    type="radio"
                    name="mastery-level"
                    checked={isSelected}
                    onchange={() => handleLevelSelect(level)}
                    class="w-4 h-4 text-amber-600 rounded-full cursor-pointer shrink-0 accent-amber-600"
                  />
                  <div class="flex items-center gap-2">
                    <span
                      class="relative overflow-hidden text-lg font-bold min-w-[32px] text-center leading-none {progress >=
                      100
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'}"
                    >
                      {#if progress > 0}
                        <div
                          class="absolute bottom-0 inset-x-0 pointer-events-none {progress >= 100
                            ? 'bg-emerald-500/25 dark:bg-emerald-400/25'
                            : 'bg-amber-400/30 dark:bg-amber-400/25'}"
                          style="height: {progress}%;"
                        ></div>
                      {/if}
                      <span class="relative z-10">{item.jamo}</span>
                    </span>
                    <span class="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase">
                      {item.key}{item.shift ? '+Shift' : ''}
                    </span>
                  </div>
                </label>
              {/each}

              {#if stage.checkpoint}
                {@const cp = stage.checkpoint}
                {@const cpStats = sentenceCheckpointStats[cp.id]}
                {@const isCpSelected = activeCheckpointId === cp.id}
                {@const cpCompleted = cpStats?.completedCount ?? 0}
                {@const cpMastered = cpStats?.isMastered ?? false}
                {@const cpPercent = Math.min(
                  100,
                  Math.round((cpCompleted / cp.requiredCompletions) * 100),
                )}
                <label
                  class="flex items-center gap-2.5 p-1.5 mt-1 rounded-lg border border-dashed border-amber-300 dark:border-amber-700/60 hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none {isCpSelected
                    ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-500 dark:border-amber-400'
                    : 'bg-amber-50/50 dark:bg-amber-950/20'}"
                >
                  <input
                    type="radio"
                    name="mastery-level"
                    checked={isCpSelected}
                    onchange={() => handleCheckpointSelect(cp.id)}
                    class="w-4 h-4 text-amber-600 rounded-full cursor-pointer shrink-0 accent-amber-600"
                  />
                  <div class="flex flex-col min-w-0 flex-1">
                    <div class="flex items-center justify-between gap-1">
                      <span class="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                        <span class="text-gray-500 dark:text-gray-400 font-medium">Milestone:</span>
                        {cp.title}
                      </span>
                      <span
                        class="text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0 {cpMastered
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'}"
                      >
                        {cpCompleted}/{cp.requiredCompletions}
                      </span>
                    </div>
                    {#if cpPercent > 0}
                      <div
                        class="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1 overflow-hidden"
                      >
                        <div
                          class="h-full {cpMastered
                            ? 'bg-emerald-500'
                            : 'bg-amber-500'} transition-all"
                          style="width: {cpPercent}%;"
                        ></div>
                      </div>
                    {/if}
                  </div>
                </label>
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
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
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
            <label
              class="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none {activeFocusBatchim ===
              'words'
                ? 'bg-purple-100/80 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700'
                : ''}"
            >
              <input
                type="radio"
                name="mastery-level"
                checked={activeFocusBatchim === 'words'}
                onchange={() => handleFocusSelect('words')}
                class="w-4 h-4 text-purple-600 rounded-full cursor-pointer shrink-0 accent-purple-600"
              />
              <div class="flex items-center justify-between gap-2 flex-1 min-w-0">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="text-xs font-bold font-mono uppercase bg-purple-200/70 dark:bg-purple-900/70 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded shrink-0"
                  >
                    단어
                  </span>
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      Word Practice
                    </span>
                    <span class="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      All vocabulary (≤ 12 chars)
                    </span>
                  </div>
                </div>
                <span class="text-[11px] font-mono text-purple-600 dark:text-purple-400 shrink-0 font-medium">
                  All Jamo
                </span>
              </div>
            </label>

            <!-- All Sentences Practice Option -->
            <label
              class="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none {activeFocusBatchim ===
              'sentences'
                ? 'bg-purple-100/80 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700'
                : ''}"
            >
              <input
                type="radio"
                name="mastery-level"
                checked={activeFocusBatchim === 'sentences'}
                onchange={() => handleFocusSelect('sentences')}
                class="w-4 h-4 text-purple-600 rounded-full cursor-pointer shrink-0 accent-purple-600"
              />
              <div class="flex items-center justify-between gap-2 flex-1 min-w-0">
                <div class="flex items-center gap-2 min-w-0">
                  <span
                    class="text-xs font-bold font-mono uppercase bg-purple-200/70 dark:bg-purple-900/70 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded shrink-0"
                  >
                    문장
                  </span>
                  <div class="flex flex-col min-w-0">
                    <span class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
                      Sentence Practice
                    </span>
                    <span class="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      Full sentences & punctuation
                    </span>
                  </div>
                </div>
                <span class="text-[11px] font-mono text-purple-600 dark:text-purple-400 shrink-0 font-medium">
                  All Jamo
                </span>
              </div>
            </label>

            <div class="border-t border-purple-200/70 dark:border-purple-800/60 my-1 pt-1">
              <span class="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 px-1">
                Final Consonants (받침)
              </span>
            </div>

            {#each BATCHIM_FOCUS_LIST as item}
              {@const isSelected = activeFocusBatchim === item.batchim}
              {@const stats = jamoStats[item.batchim]}
              {@const progress = calculateJamoProgress(stats)}
              <label
                class="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none {isSelected
                  ? 'bg-purple-100/80 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700'
                  : ''}"
              >
                <input
                  type="radio"
                  name="mastery-level"
                  checked={isSelected}
                  onchange={() => handleFocusSelect(item.batchim)}
                  class="w-4 h-4 text-purple-600 rounded-full cursor-pointer shrink-0 accent-purple-600"
                />
                <div class="flex items-center justify-between gap-2 flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span
                      class="relative overflow-hidden text-lg font-bold min-w-[32px] text-center leading-none {progress >=
                      100
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-purple-700 dark:text-purple-300'}"
                    >
                      {#if progress > 0}
                        <div
                          class="absolute bottom-0 inset-x-0 pointer-events-none {progress >= 100
                            ? 'bg-emerald-500/25 dark:bg-emerald-400/25'
                            : 'bg-purple-400/30 dark:bg-purple-400/25'}"
                          style="height: {progress}%;"
                        ></div>
                      {/if}
                      <span class="relative z-10">{item.batchim}</span>
                    </span>
                    <span class="text-sm font-semibold text-gray-700 dark:text-gray-300 truncate">
                      {item.name ?? item.batchim}
                    </span>
                  </div>
                  <span class="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase shrink-0">
                    {item.key}{item.shift ? '+Shift' : ''}
                  </span>
                </div>
              </label>
            {/each}
          </div>
        {/if}
      </div>
  </div>
</SidebarDrawer>
