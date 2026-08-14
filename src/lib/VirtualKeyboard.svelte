<script lang="ts">
  import { DUBEOLSIK_ROWS } from '../utils/keyboardData';
  import {
    calculateJamoProgress,
    getUnlockedJamos,
    getActiveLearningJamo,
  } from '../utils/jamoMastery';
  import ShiftKey from './ShiftKey.svelte';
  import VirtualKey from './VirtualKey.svelte';
  import type { TutorMode, MasteryState } from '../types/mastery';

  interface Props {
    activeKeys?: string[];
    onkeyselect?: (key: string) => void;
    mode?: TutorMode;
    masteryState?: MasteryState;
    isLeftShiftPressed?: boolean;
    isRightShiftPressed?: boolean;
  }

  let {
    activeKeys = [],
    onkeyselect,
    mode = 'curriculum',
    masteryState,
    isLeftShiftPressed = false,
    isRightShiftPressed = false,
  }: Props = $props();

  // Derive values internally so they only trigger re-renders when the underlying masteryState actually changes,
  // preventing the entire keyboard from re-rendering on every keystroke.
  let unlockedJamos = $derived(masteryState ? getUnlockedJamos(masteryState) : new Set());
  let activeJamo = $derived(masteryState ? getActiveLearningJamo(masteryState) : null);
  let jamoStats = $derived(masteryState ? masteryState.jamoStats : {});

  let isVirtualShiftActive = $state(false);

  let isSpaceTarget = $derived(activeKeys.includes(' '));
  let isLeftShiftTarget = $derived(
    activeKeys.includes('left-shift') ||
      (activeKeys.includes('shift') && !activeKeys.includes('right-shift')),
  );
  let isRightShiftTarget = $derived(
    activeKeys.includes('right-shift') ||
      (activeKeys.includes('shift') && !activeKeys.includes('left-shift')),
  );

  let isShiftActive = $derived(
    isVirtualShiftActive ||
      isLeftShiftPressed ||
      isRightShiftPressed ||
      isLeftShiftTarget ||
      isRightShiftTarget,
  );

  function toggleShift(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    isVirtualShiftActive = !isVirtualShiftActive;
  }

  function handleKeyClick(key: string, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (key === 'Shift') {
      toggleShift(e);
      return;
    }

    let outputKey = key;
    if (key.length === 1 && isShiftActive) {
      outputKey = key.toUpperCase();
    }

    if (isVirtualShiftActive) {
      isVirtualShiftActive = false;
    }

    onkeyselect?.(outputKey);
  }
</script>

<style>
  /* Desktop: 26-col grid matching physical keyboard layout */
  .kb-grid {
    grid-template-columns: repeat(26, minmax(0, 1fr));
  }

  /* Mobile: 23-col grid with separate modifier rows, preserving physical stagger */
  @media (max-width: 639px) {
    .kb-grid {
      grid-template-columns: repeat(23, minmax(0, 1fr));
    }
  }
</style>

<div
  role="region"
  aria-label="Virtual Korean Keyboard Helper"
  class="virtual-keyboard w-screen sm:w-full -mx-[calc((100vw-100%)/2)] sm:mx-0 max-w-none sm:max-w-5xl flex flex-col items-center gap-1.5 p-2 sm:p-3 bg-white/90 dark:bg-gray-800/90 border-2 border-gray-200 dark:border-gray-700 rounded-2xl sm:rounded-b-none shadow-sm select-none"
>
  <!-- Row 0: Q W E R T Y U I O P -->
  <div class="grid w-full gap-1 sm:gap-1.5 kb-grid">
    <!-- Desktop: 2-col left spacer -->
    <div style="grid-column: span 2;" class="hidden sm:block"></div>
    <!-- Mobile: 1-col left spacer -->
    <div style="grid-column: span 1;" class="sm:hidden"></div>

    {#each DUBEOLSIK_ROWS[0] as cap}
      {@const activeChar = isShiftActive && cap.shiftJamo ? cap.shiftJamo : cap.jamo}
      {@const isLocked = mode === 'mastery' && unlockedJamos.size > 0 && !unlockedJamos.has(activeChar)}
      {@const isActiveLearning = mode === 'mastery' && activeJamo?.jamo === activeChar}
      {@const isMastered = mode === 'mastery' && (jamoStats[activeChar]?.isMastered ?? false)}
      {@const progressPercent = mode === 'mastery' ? calculateJamoProgress(jamoStats[activeChar]) : 0}

      <VirtualKey
        {cap}
        isTarget={activeKeys.includes(cap.key.toLowerCase())}
        {isShiftActive}
        {isLocked}
        {isActiveLearning}
        {isMastered}
        {progressPercent}
        onselect={handleKeyClick}
      />
    {/each}

    <!-- Desktop: Backspace (span 4) at end of row -->
    <button
      type="button"
      tabindex="-1"
      onmousedown={(e) => handleKeyClick('Backspace', e)}
      style="grid-column: span 4;"
      class="hidden sm:flex items-center justify-center gap-1 h-10 sm:h-13 rounded-lg border text-xs font-semibold transition-colors cursor-pointer p-1 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700
        {activeKeys.includes('Backspace')
          ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500 shadow-sm'
          : ''}"
      aria-label="Backspace"
    >
      <span class="text-sm font-bold">⌫</span>
      <span class="hidden sm:inline text-[10px]">Delete</span>
    </button>
    <!-- Mobile: 2-col right spacer (1 + 20 + 2 = 23) -->
    <div style="grid-column: span 2;" class="sm:hidden"></div>
  </div>

  <!-- Row 1: A S D F G H J K L -->
  <div class="grid w-full gap-1 sm:gap-1.5 kb-grid">
    <!-- Desktop: 3-col left spacer -->
    <div style="grid-column: span 3;" class="hidden sm:block"></div>
    <!-- Mobile: 2-col left spacer (staggered +1 from row 0) -->
    <div style="grid-column: span 2;" class="sm:hidden"></div>

    {#each DUBEOLSIK_ROWS[1] as cap}
      {@const activeChar = isShiftActive && cap.shiftJamo ? cap.shiftJamo : cap.jamo}
      {@const isLocked = mode === 'mastery' && unlockedJamos.size > 0 && !unlockedJamos.has(activeChar)}
      {@const isActiveLearning = mode === 'mastery' && activeJamo?.jamo === activeChar}
      {@const isMastered = mode === 'mastery' && (jamoStats[activeChar]?.isMastered ?? false)}
      {@const progressPercent = mode === 'mastery' ? calculateJamoProgress(jamoStats[activeChar]) : 0}

      <VirtualKey
        {cap}
        isTarget={activeKeys.includes(cap.key.toLowerCase())}
        {isShiftActive}
        {isLocked}
        {isActiveLearning}
        {isMastered}
        {progressPercent}
        onselect={handleKeyClick}
      />
    {/each}

    <!-- Desktop: 5-col right spacer -->
    <div style="grid-column: span 5;" class="hidden sm:block"></div>
    <!-- Mobile: 3-col right spacer (2 + 18 + 3 = 23) -->
    <div style="grid-column: span 3;" class="sm:hidden"></div>
  </div>

  <!-- Row 2: Z X C V B N M , . -->
  <div class="grid w-full gap-1 sm:gap-1.5 kb-grid">
    <!-- Desktop: left Shift (span 4) -->
    <div style="grid-column: span 4;" class="hidden sm:block">
      <ShiftKey
        side="Left"
        isTarget={isLeftShiftTarget}
        isPressed={isVirtualShiftActive || isLeftShiftPressed}
        widthClass="w-full"
        onselect={(e) => handleKeyClick('Shift', e)}
      />
    </div>
    <!-- Mobile: 3-col left spacer (staggered +1 from row 1) -->
    <div style="grid-column: span 3;" class="sm:hidden"></div>

    {#each DUBEOLSIK_ROWS[2] as cap}
      {@const activeChar = isShiftActive && cap.shiftJamo ? cap.shiftJamo : cap.jamo}
      {@const isLocked = mode === 'mastery' && unlockedJamos.size > 0 && !unlockedJamos.has(activeChar)}
      {@const isActiveLearning = mode === 'mastery' && activeJamo?.jamo === activeChar}
      {@const isMastered = mode === 'mastery' && (jamoStats[activeChar]?.isMastered ?? false)}
      {@const progressPercent = mode === 'mastery' ? calculateJamoProgress(jamoStats[activeChar]) : 0}

      <VirtualKey
        {cap}
        isTarget={activeKeys.includes(cap.key.toLowerCase())}
        {isShiftActive}
        {isLocked}
        {isActiveLearning}
        {isMastered}
        {progressPercent}
        onselect={handleKeyClick}
      />
    {/each}

    <!-- Desktop: right Shift (span 4) -->
    <div style="grid-column: span 4;" class="hidden sm:block">
      <ShiftKey
        side="Right"
        isTarget={isRightShiftTarget}
        isPressed={isVirtualShiftActive || isRightShiftPressed}
        widthClass="w-full"
        onselect={(e) => handleKeyClick('Shift', e)}
      />
    </div>
    <!-- Mobile: 2-col right spacer (3 + 18 + 2 = 23) -->
    <div style="grid-column: span 2;" class="sm:hidden"></div>
  </div>

  <!-- Mobile: Shift + Space + Backspace row -->
  <div class="flex items-center w-full gap-1 sm:hidden mt-0.5">
    <button
      type="button"
      tabindex="-1"
      onmousedown={(e) => handleKeyClick('Shift', e)}
      class="h-14 flex-1 max-w-[15%] rounded-lg border text-lg font-semibold transition-colors cursor-pointer bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700
        {(isLeftShiftTarget || isRightShiftTarget || isVirtualShiftActive || isLeftShiftPressed || isRightShiftPressed)
          ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500 shadow-sm'
          : ''}"
      aria-label="Shift"
    >
      ⇧
    </button>
    <button
      type="button"
      tabindex="-1"
      onmousedown={(e) => handleKeyClick(' ', e)}
      class="h-14 flex-1 rounded-lg border text-sm font-semibold uppercase tracking-wider flex items-center justify-center transition-colors cursor-pointer bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 active:bg-gray-200 dark:active:bg-gray-700
        {isSpaceTarget
          ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500 shadow-sm'
          : ''}"
      aria-label="Spacebar"
    >
      <span>Space</span>
    </button>
    <button
      type="button"
      tabindex="-1"
      onmousedown={(e) => handleKeyClick('Backspace', e)}
      class="h-14 flex-1 max-w-[15%] rounded-lg border text-lg font-bold transition-colors cursor-pointer bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700
        {activeKeys.includes('Backspace')
          ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500 shadow-sm'
          : ''}"
      aria-label="Backspace"
    >
      ⌫
    </button>
  </div>

  <!-- Desktop Spacebar Row -->
  <div class="hidden sm:flex items-center justify-center w-full mt-0.5">
    <button
      type="button"
      tabindex="-1"
      onmousedown={(e) => handleKeyClick(' ', e)}
      class="w-64 md:w-80 h-8 rounded-lg border text-xs font-semibold uppercase tracking-wider flex items-center justify-center transition-colors cursor-pointer shrink-0
        {isSpaceTarget
        ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500 shadow-sm'
        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}"
      aria-label="Spacebar"
    >
      <span>Space</span>
    </button>
  </div>
</div>
