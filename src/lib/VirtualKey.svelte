<script lang="ts">
  import type { KeyCapDefinition } from '../utils/keyboardData';

  interface Props {
    cap: KeyCapDefinition;
    isTarget?: boolean;
    isShiftActive?: boolean;
    isLocked?: boolean;
    isActiveLearning?: boolean;
    isMastered?: boolean;
    onselect?: (key: string, e: MouseEvent) => void;
  }

  let {
    cap,
    isTarget = false,
    isShiftActive = false,
    isLocked = false,
    isActiveLearning = false,
    isMastered = false,
    onselect,
  }: Props = $props();

  let isConsonant = $derived(cap.type === 'consonant');
  let isPunctuation = $derived(cap.type === 'punctuation');

  let activeColorClasses = $derived(
    isTarget
      ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-500 font-bold'
      : isLocked
        ? 'bg-gray-100/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 opacity-50'
        : isActiveLearning
          ? 'bg-amber-100 dark:bg-amber-950/80 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/50 font-bold'
          : isConsonant
            ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
            : isPunctuation
              ? 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-gray-900 dark:text-gray-100 hover:bg-amber-100/70 dark:hover:bg-amber-900/50',
  );
</script>

<button
  type="button"
  tabindex="-1"
  onmousedown={(e) => onselect?.(cap.key, e)}
  style="grid-column: span 2;"
  class="relative flex flex-col items-center justify-between h-10 sm:h-13 rounded-lg border text-center transition-colors cursor-pointer p-1 {activeColorClasses}"
  aria-label="{cap.jamo} (Key {cap.key.toUpperCase()})"
>
  <div
    class="flex items-center justify-between w-full text-[9px] sm:text-[10px] leading-none font-mono"
  >
    <span class={isTarget ? 'text-blue-100 font-bold' : 'text-gray-400 dark:text-gray-500'}>
      {cap.key.toUpperCase()}
    </span>
    {#if isMastered && !isTarget}
      <span class="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
    {:else if cap.shiftJamo}
      <span class={isTarget ? 'text-blue-200 font-bold' : 'text-gray-400 dark:text-gray-500'}>
        {cap.shiftJamo}
      </span>
    {/if}
  </div>
  <span class="text-sm sm:text-lg md:text-xl font-semibold leading-none my-auto">
    {isShiftActive && cap.shiftJamo ? cap.shiftJamo : cap.jamo}
  </span>
</button>
