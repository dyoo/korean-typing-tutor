<script lang="ts">
  import { DUBEOLSIK_ROWS, SYMBOL_ROWS } from '../utils/keyboardData';
  import { getUnlockedJamos, getActiveLearningJamo } from '../utils/jamoMastery';
  import { isShiftTarget, resolveKeyOutput } from '../utils/virtualKeyboardShift';
  import ShiftKey from './ShiftKey.svelte';
  import SymbolToggleKey from './SymbolToggleKey.svelte';
  import VirtualKey from './VirtualKey.svelte';
  import MasteryVirtualKey from './MasteryVirtualKey.svelte';
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
  let unlockedJamos = $derived(masteryState ? getUnlockedJamos(masteryState) : new Set<string>());
  let activeJamo = $derived(masteryState ? getActiveLearningJamo(masteryState) : null);
  let jamoStats = $derived(masteryState ? masteryState.jamoStats : {});

  let isVirtualShiftActive = $state(false);
  let isSymbolMode = $state(false);

  let isSpaceTarget = $derived(activeKeys.includes(' '));
  let isCommaTarget = $derived(activeKeys.includes(','));
  let isPeriodTarget = $derived(activeKeys.includes('.'));
  let isBackspaceTarget = $derived(
    activeKeys.includes('backspace') || activeKeys.includes('Backspace'),
  );
  let isLeftShiftTarget = $derived(isShiftTarget(activeKeys, 'left'));
  let isRightShiftTarget = $derived(isShiftTarget(activeKeys, 'right'));

  // Actual shift state: only from physical keyboard or virtual toggle, never from target highlighting.
  // This prevents the keyboard from auto-shifting when the target character requires shift.
  let isShiftPressed = $derived(isVirtualShiftActive || isLeftShiftPressed || isRightShiftPressed);

  // Combined shift state for display: includes target highlighting so keys show the shifted jamo.
  let isShiftActive = $derived(isShiftPressed || isLeftShiftTarget || isRightShiftTarget);

  function toggleShift(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    isVirtualShiftActive = !isVirtualShiftActive;
  }

  function toggleSymbolMode(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    isSymbolMode = !isSymbolMode;
  }

  function handleKeyClick(key: string, e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (key === 'Shift') {
      toggleShift(e);
      return;
    }

    let outputKey = resolveKeyOutput(key, isShiftPressed);

    if (isVirtualShiftActive) {
      isVirtualShiftActive = false;
    }

    onkeyselect?.(outputKey);
  }

  const TARGET_KEY_ACTIVE_CLASSES =
    'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500 shadow-sm font-bold';
</script>

{#snippet masteryKey(cap: (typeof DUBEOLSIK_ROWS)[0][0])}
  <MasteryVirtualKey
    {cap}
    {isShiftActive}
    {isShiftPressed}
    {activeKeys}
    {mode}
    {unlockedJamos}
    {activeJamo}
    {jamoStats}
    onselect={handleKeyClick}
  />
{/snippet}

{#snippet specialKeyButton({
  key,
  isTarget,
  ariaLabel,
  customClass = '',
  style = '',
  content,
}: {
  key: string;
  isTarget: boolean;
  ariaLabel: string;
  customClass?: string;
  style?: string;
  content: import('svelte').Snippet;
})}
  <button
    type="button"
    tabindex="-1"
    onmousedown={(e) => handleKeyClick(key, e)}
    {style}
    class="rounded-lg border transition-colors cursor-pointer flex items-center justify-center {customClass} {isTarget
      ? TARGET_KEY_ACTIVE_CLASSES
      : ''}"
    aria-label={ariaLabel}
  >
    {@render content()}
  </button>
{/snippet}

<div
  role="region"
  aria-label="Virtual Korean Keyboard Helper"
  class="virtual-keyboard w-screen md:w-full -mx-[calc((100vw-100%)/2)] md:mx-0 max-w-none md:max-w-5xl flex flex-col items-center gap-1.5 p-2 md:p-3 bg-white/90 dark:bg-gray-800/90 border-2 border-b-0 md:border-b-2 border-gray-200 dark:border-gray-700 rounded-t-2xl rounded-b-none md:rounded-2xl shadow-sm select-none"
>
  <!-- ==================== DESKTOP LAYOUT (md: and above) ==================== -->
  <div class="hidden md:flex flex-col items-center w-full gap-1.5">
    {#if !isSymbolMode}
      <!-- Desktop Row 0: Q W E R T Y U I O P + Backspace -->
      <div class="grid w-full gap-1.5 kb-grid">
        <div style="grid-column: span 2;"></div>

        {#each DUBEOLSIK_ROWS[0] as cap}
          {@render masteryKey(cap)}
        {/each}

        {#snippet backspaceContent()}
          <span class="text-sm font-bold">⌫</span>
          <span class="text-[10px]">Delete</span>
        {/snippet}

        {@render specialKeyButton({
          key: 'Backspace',
          isTarget: isBackspaceTarget,
          ariaLabel: 'Backspace',
          style: 'grid-column: span 4;',
          customClass:
            'gap-1 h-13 text-xs font-semibold p-1 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
          content: backspaceContent,
        })}
      </div>

      <!-- Desktop Row 1: A S D F G H J K L -->
      <div class="grid w-full gap-1.5 kb-grid">
        <div style="grid-column: span 3;"></div>

        {#each DUBEOLSIK_ROWS[1] as cap}
          {@render masteryKey(cap)}
        {/each}

        <div style="grid-column: span 5;"></div>
      </div>

      <!-- Desktop Row 2: Left Shift + Z X C V B N M , . + Right Shift -->
      <div class="grid w-full gap-1.5 kb-grid">
        <div style="grid-column: span 4;">
          <ShiftKey
            side="Left"
            isTarget={isLeftShiftTarget}
            isPressed={isVirtualShiftActive || isLeftShiftPressed}
            widthClass="w-full"
            onselect={(e) => handleKeyClick('Shift', e)}
          />
        </div>

        {#each DUBEOLSIK_ROWS[2] as cap}
          {@render masteryKey(cap)}
        {/each}

        <div style="grid-column: span 4;">
          <ShiftKey
            side="Right"
            isTarget={isRightShiftTarget}
            isPressed={isVirtualShiftActive || isRightShiftPressed}
            widthClass="w-full"
            onselect={(e) => handleKeyClick('Shift', e)}
          />
        </div>
      </div>
    {:else}
      <!-- Desktop Symbol Mode Row 0: 1 2 3 4 5 6 7 8 9 0 + Backspace -->
      <div class="grid w-full gap-1.5 kb-grid">
        <div style="grid-column: span 2;"></div>

        {#each SYMBOL_ROWS[0] as cap}
          <VirtualKey
            {cap}
            isTarget={activeKeys.includes(cap.key)}
            isShiftActive={false}
            onselect={handleKeyClick}
          />
        {/each}

        {#snippet symbolBackspaceContent()}
          <span class="text-sm font-bold">⌫</span>
          <span class="text-[10px]">Delete</span>
        {/snippet}

        {@render specialKeyButton({
          key: 'Backspace',
          isTarget: isBackspaceTarget,
          ariaLabel: 'Backspace',
          style: 'grid-column: span 4;',
          customClass:
            'gap-1 h-13 text-xs font-semibold p-1 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700',
          content: symbolBackspaceContent,
        })}
      </div>

      <!-- Desktop Symbol Mode Row 1: @ # ₩ _ & - + ( ) / -->
      <div class="grid w-full gap-1.5 kb-grid">
        <div style="grid-column: span 3;"></div>

        {#each SYMBOL_ROWS[1] as cap}
          <VirtualKey
            {cap}
            isTarget={activeKeys.includes(cap.key)}
            isShiftActive={false}
            onselect={handleKeyClick}
          />
        {/each}

        <div style="grid-column: span 3;"></div>
      </div>

      <!-- Desktop Symbol Mode Row 2: * " ' : ; ! ? (7 keys) -->
      <div class="grid w-full gap-1.5 kb-grid">
        <div style="grid-column: span 6;"></div>

        {#each SYMBOL_ROWS[2] as cap}
          <VirtualKey
            {cap}
            isTarget={activeKeys.includes(cap.key)}
            isShiftActive={false}
            onselect={handleKeyClick}
          />
        {/each}

        <div style="grid-column: span 6;"></div>
      </div>
    {/if}

    <!-- Desktop Spacebar Row -->
    <div class="flex items-center justify-center gap-1.5 w-full mt-0.5">
      <SymbolToggleKey
        {isSymbolMode}
        customClass="h-8 px-3 w-20 shrink-0"
        onselect={toggleSymbolMode}
      />

      {#snippet spaceContent()}
        <span>Space</span>
      {/snippet}

      {@render specialKeyButton({
        key: ' ',
        isTarget: isSpaceTarget,
        ariaLabel: 'Spacebar',
        customClass:
          'w-80 h-8 text-xs font-semibold uppercase tracking-wider shrink-0 bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700',
        content: spaceContent,
      })}

      <SymbolToggleKey
        {isSymbolMode}
        customClass="h-8 px-3 w-20 shrink-0"
        onselect={toggleSymbolMode}
      />
    </div>
  </div>

  <!-- ==================== MOBILE LAYOUT (< md) ==================== -->
  <div class="flex md:hidden flex-col items-center w-full gap-1">
    {#if !isSymbolMode}
      <!-- Mobile Row 0: Q W E R T Y U I O P (10 keys) -->
      <div class="flex items-center w-full gap-1">
        {#each DUBEOLSIK_ROWS[0] as cap}
          {@render masteryKey(cap)}
        {/each}
      </div>

      <!-- Mobile Row 1: A S D F G H J K L (9 keys, staggered with 5% offset) -->
      <div class="flex items-center justify-center w-full gap-1 px-[5%]">
        {#each DUBEOLSIK_ROWS[1] as cap}
          {@render masteryKey(cap)}
        {/each}
      </div>

      <!-- Mobile Row 2: Shift (1.5x) + ㅋ ㅌ ㅊ ㅍ ㅠ ㅜ ㅡ (7 keys) + Backspace (1.5x) -->
      <div class="flex items-center w-full gap-1">
        <button
          type="button"
          tabindex="-1"
          onmousedown={(e) => handleKeyClick('Shift', e)}
          class="h-14 flex-[1.5] min-w-0 rounded-lg border text-lg font-semibold transition-colors cursor-pointer flex items-center justify-center bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700
            {isLeftShiftTarget ||
          isRightShiftTarget ||
          isVirtualShiftActive ||
          isLeftShiftPressed ||
          isRightShiftPressed
            ? TARGET_KEY_ACTIVE_CLASSES
            : ''}"
          aria-label="Shift"
        >
          ⇧
        </button>

        {#each DUBEOLSIK_ROWS[2].slice(0, 7) as cap}
          {@render masteryKey(cap)}
        {/each}

        {#snippet mobileBackspaceContent()}
          ⌫
        {/snippet}

        {@render specialKeyButton({
          key: 'Backspace',
          isTarget: isBackspaceTarget,
          ariaLabel: 'Backspace',
          customClass:
            'h-14 flex-[1.5] min-w-0 text-lg font-bold bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700',
          content: mobileBackspaceContent,
        })}
      </div>
    {:else}
      <!-- Mobile Symbol Mode Row 0: 1 2 3 4 5 6 7 8 9 0 (10 keys) -->
      <div class="flex items-center w-full gap-1">
        {#each SYMBOL_ROWS[0] as cap}
          <VirtualKey
            {cap}
            isTarget={activeKeys.includes(cap.key)}
            isShiftActive={false}
            onselect={handleKeyClick}
          />
        {/each}
      </div>

      <!-- Mobile Symbol Mode Row 1: @ # ₩ _ & - + ( ) / (10 keys) -->
      <div class="flex items-center w-full gap-1">
        {#each SYMBOL_ROWS[1] as cap}
          <VirtualKey
            {cap}
            isTarget={activeKeys.includes(cap.key)}
            isShiftActive={false}
            onselect={handleKeyClick}
          />
        {/each}
      </div>

      <!-- Mobile Symbol Mode Row 2: Spacer + * " ' : ; ! ? (7 keys) + Backspace -->
      <div class="flex items-center w-full gap-1">
        <div class="flex-[1.5] min-w-0"></div>

        {#each SYMBOL_ROWS[2] as cap}
          <VirtualKey
            {cap}
            isTarget={activeKeys.includes(cap.key)}
            isShiftActive={false}
            onselect={handleKeyClick}
          />
        {/each}

        {#snippet mobileSymbolBackspaceContent()}
          ⌫
        {/snippet}

        {@render specialKeyButton({
          key: 'Backspace',
          isTarget: isBackspaceTarget,
          ariaLabel: 'Backspace',
          customClass:
            'h-14 flex-[1.5] min-w-0 text-lg font-bold bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 active:bg-slate-200 dark:active:bg-slate-700',
          content: mobileSymbolBackspaceContent,
        })}
      </div>
    {/if}

    <!-- Mobile Bottom Row: ?123 Toggle + Comma + Space + Period + ?123 Toggle (symmetric) -->
    <div class="flex items-center w-full gap-1 mt-0.5">
      <SymbolToggleKey
        {isSymbolMode}
        onselect={toggleSymbolMode}
      />

      {#snippet commaContent()}
        ,
      {/snippet}

      {@render specialKeyButton({
        key: ',',
        isTarget: isCommaTarget,
        ariaLabel: 'Comma',
        customClass:
          'h-14 flex-1 max-w-[12%] text-lg font-bold font-mono bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 active:bg-slate-200 dark:active:bg-slate-700',
        content: commaContent,
      })}

      {#snippet mobileSpaceContent()}
        <span>Space</span>
      {/snippet}

      {@render specialKeyButton({
        key: ' ',
        isTarget: isSpaceTarget,
        ariaLabel: 'Spacebar',
        customClass:
          'h-14 flex-[5] text-sm font-semibold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 active:bg-gray-200 dark:active:bg-gray-700',
        content: mobileSpaceContent,
      })}

      {#snippet periodContent()}
        .
      {/snippet}

      {@render specialKeyButton({
        key: '.',
        isTarget: isPeriodTarget,
        ariaLabel: 'Period',
        customClass:
          'h-14 flex-1 max-w-[12%] text-lg font-bold font-mono bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 active:bg-slate-200 dark:active:bg-slate-700',
        content: periodContent,
      })}

      <SymbolToggleKey
        {isSymbolMode}
        onselect={toggleSymbolMode}
      />
    </div>
  </div>
</div>

<style>
  /* Desktop: 26-col grid matching physical keyboard layout */
  .kb-grid {
    grid-template-columns: repeat(26, minmax(0, 1fr));
  }
</style>
