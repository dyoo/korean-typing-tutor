<script lang="ts">
  import { JAMO_PROGRESSION_ORDER, JAMO_STAGES, calculateJamoProgress } from '../utils/jamoMastery';
  import type { JamoStats } from '../types/mastery';

  interface Props {
    isOpen: boolean;
    masteryUnlockedCount: number;
    jamoStats: Record<string, JamoStats>;
    onclose: () => void;
    onmasterylevelchange: (level: number) => void;
  }

  let { isOpen, masteryUnlockedCount, jamoStats, onclose, onmasterylevelchange }: Props = $props();

  let collapsedStageIds = $state<string[]>([]);

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onclose();
    }
  }

  function toggleStageCollapse(stageId: string) {
    if (collapsedStageIds.includes(stageId)) {
      collapsedStageIds = collapsedStageIds.filter((id) => id !== stageId);
    } else {
      collapsedStageIds = [...collapsedStageIds, stageId];
    }
  }

  function handleLevelSelect(level: number) {
    onmasterylevelchange(level);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    role="button"
    tabindex="-1"
    aria-label="Close sidebar backdrop"
    onclick={onclose}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onclose();
      }
    }}
    class="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 transition-opacity select-none"
  ></div>

  <div
    role="dialog"
    aria-modal="true"
    aria-label="Mastery Progress Sidebar"
    class="fixed inset-y-0 left-0 z-50 w-80 sm:w-96 bg-white dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
  >
    <div
      class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80"
    >
      <div class="flex flex-col">
        <h2
          class="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 font-mono"
        >
          Jamo Mastery
        </h2>
        <span class="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
          Unlocked ({masteryUnlockedCount}/{JAMO_PROGRESSION_ORDER.length})
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

    <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3 [scrollbar-width:thin]">
      {#each JAMO_STAGES as stage}
        <div
          class="flex flex-col border border-gray-200 dark:border-gray-700/60 rounded-xl p-2.5 bg-gray-50/60 dark:bg-gray-800/40 gap-2"
        >
          <div
            class="flex items-center justify-between p-1 rounded-lg hover:bg-white dark:hover:bg-gray-700/70 transition-colors select-none"
          >
            <button
              type="button"
              onclick={() => toggleStageCollapse(stage.stageName)}
              class="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide text-gray-800 dark:text-gray-200 hover:text-amber-600 dark:hover:text-amber-400 cursor-pointer"
            >
              <svg
                class="w-3.5 h-3.5 text-gray-400 transition-transform {collapsedStageIds.includes(
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
              <span>{stage.stageName}</span>
            </button>
            <span
              class="text-[10px] font-mono font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-700 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600 shrink-0"
            >
              {stage.items.length}
            </span>
          </div>

          {#if !collapsedStageIds.includes(stage.stageName)}
            <div
              class="flex flex-col gap-1.5 pl-3 border-l-2 border-amber-500/30 dark:border-amber-400/30 ml-3 mb-1 mr-1"
            >
              {#each stage.items as item}
                {@const idx = JAMO_PROGRESSION_ORDER.indexOf(item)}
                {@const level = idx + 1}
                {@const isSelected = masteryUnlockedCount === level}
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
                      class="relative overflow-hidden text-base font-bold min-w-[28px] text-center leading-none {progress >=
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
                    <span class="text-[10px] font-mono text-gray-500 dark:text-gray-400 uppercase">
                      {item.key}{item.shift ? '+Shift' : ''}
                    </span>
                  </div>
                </label>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}
