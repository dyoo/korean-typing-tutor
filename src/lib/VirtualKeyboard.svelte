<script lang="ts">
  import { DUBEOLSIK_ROWS } from '../utils/keyboardData';
  import ShiftKey from './ShiftKey.svelte';

  interface Props {
    activeKeys?: string[];
    onkeyselect?: (key: string) => void;
  }

  let { activeKeys = [], onkeyselect }: Props = $props();

  let isVirtualShiftActive = $state(false);

  let isSpaceTarget = $derived(activeKeys.includes(' '));
  let isLeftShiftTarget = $derived(
    isVirtualShiftActive || activeKeys.includes('left-shift') || activeKeys.includes('shift'),
  );
  let isRightShiftTarget = $derived(
    isVirtualShiftActive || activeKeys.includes('right-shift') || activeKeys.includes('shift'),
  );

  let isShiftActive = $derived(isLeftShiftTarget || isRightShiftTarget);

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

<div
  role="region"
  aria-label="Virtual Korean Keyboard Helper"
  class="virtual-keyboard w-full max-w-4xl flex flex-col items-center gap-1.5 p-3 bg-white/90 dark:bg-gray-800/90 border-2 border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm select-none"
>
  {#each DUBEOLSIK_ROWS as row, rowIndex}
    <div
      class="grid w-full max-w-4xl gap-1 sm:gap-1.5"
      style="grid-template-columns: repeat(26, minmax(0, 1fr));"
    >
      {#if rowIndex === 0}
        <!-- Left spacer (span 2) -->
        <div style="grid-column: span 2;"></div>

        {#each row as cap}
          {@const isTarget = activeKeys.includes(cap.key.toLowerCase())}
          {@const isConsonant = cap.type === 'consonant'}

          <button
            type="button"
            tabindex="-1"
            onmousedown={(e) => handleKeyClick(cap.key, e)}
            style="grid-column: span 2;"
            class="relative flex flex-col items-center justify-between h-10 sm:h-13 rounded-lg border text-center transition-colors cursor-pointer p-1
              {isTarget
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-500 font-bold'
              : isConsonant
                ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-gray-900 dark:text-gray-100 hover:bg-amber-100/70 dark:hover:bg-amber-900/50'}"
            aria-label="{cap.jamo} (Key {cap.key.toUpperCase()})"
          >
            <div
              class="flex items-center justify-between w-full text-[9px] sm:text-[10px] leading-none font-mono"
            >
              <span
                class={isTarget ? 'text-blue-100 font-bold' : 'text-gray-400 dark:text-gray-500'}
              >
                {cap.key.toUpperCase()}
              </span>
              {#if cap.shiftJamo}
                <span
                  class={isTarget ? 'text-blue-200 font-bold' : 'text-gray-400 dark:text-gray-500'}
                >
                  {cap.shiftJamo}
                </span>
              {/if}
            </div>
            <span class="text-sm sm:text-lg md:text-xl font-semibold leading-none my-auto">
              {isShiftActive && cap.shiftJamo ? cap.shiftJamo : cap.jamo}
            </span>
          </button>
        {/each}

        <!-- Backspace (span 4) -->
        <button
          type="button"
          tabindex="-1"
          onmousedown={(e) => handleKeyClick('Backspace', e)}
          style="grid-column: span 4;"
          class="flex items-center justify-center gap-1 h-10 sm:h-13 rounded-lg border text-xs font-semibold transition-colors cursor-pointer p-1 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label="Backspace"
        >
          <span class="text-sm font-bold">⌫</span>
          <span class="hidden sm:inline text-[10px]">Delete</span>
        </button>
      {:else if rowIndex === 1}
        <!-- Left Caps stagger offset (span 3) -->
        <div style="grid-column: span 3;"></div>

        {#each row as cap}
          {@const isTarget = activeKeys.includes(cap.key.toLowerCase())}
          {@const isConsonant = cap.type === 'consonant'}

          <button
            type="button"
            tabindex="-1"
            onmousedown={(e) => handleKeyClick(cap.key, e)}
            style="grid-column: span 2;"
            class="relative flex flex-col items-center justify-between h-10 sm:h-13 rounded-lg border text-center transition-colors cursor-pointer p-1
              {isTarget
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-500 font-bold'
              : isConsonant
                ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-gray-900 dark:text-gray-100 hover:bg-amber-100/70 dark:hover:bg-amber-900/50'}"
            aria-label="{cap.jamo} (Key {cap.key.toUpperCase()})"
          >
            <div
              class="flex items-center justify-between w-full text-[9px] sm:text-[10px] leading-none font-mono"
            >
              <span
                class={isTarget ? 'text-blue-100 font-bold' : 'text-gray-400 dark:text-gray-500'}
              >
                {cap.key.toUpperCase()}
              </span>
              {#if cap.shiftJamo}
                <span
                  class={isTarget ? 'text-blue-200 font-bold' : 'text-gray-400 dark:text-gray-500'}
                >
                  {cap.shiftJamo}
                </span>
              {/if}
            </div>
            <span class="text-sm sm:text-lg md:text-xl font-semibold leading-none my-auto">
              {isShiftActive && cap.shiftJamo ? cap.shiftJamo : cap.jamo}
            </span>
          </button>
        {/each}

        <!-- Right Enter balance offset (span 5) -->
        <div style="grid-column: span 5;"></div>
      {:else if rowIndex === 2}
        <!-- Left Shift (span 4) -->
        <div style="grid-column: span 4;">
          <ShiftKey
            side="Left"
            isTarget={isLeftShiftTarget}
            widthClass="w-full"
            onselect={(e) => handleKeyClick('Shift', e)}
          />
        </div>

        {#each row as cap}
          {@const isTarget = activeKeys.includes(cap.key.toLowerCase())}
          {@const isConsonant = cap.type === 'consonant'}
          {@const isPunctuation = cap.type === 'punctuation'}

          <button
            type="button"
            tabindex="-1"
            onmousedown={(e) => handleKeyClick(cap.key, e)}
            style="grid-column: span 2;"
            class="relative flex flex-col items-center justify-between h-10 sm:h-13 rounded-lg border text-center transition-colors cursor-pointer p-1
              {isTarget
              ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-500 font-bold'
              : isConsonant
                ? 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                : isPunctuation
                  ? 'bg-slate-100/80 dark:bg-slate-800/60 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60 text-gray-900 dark:text-gray-100 hover:bg-amber-100/70 dark:hover:bg-amber-900/50'}"
            aria-label="{cap.jamo} (Key {cap.key.toUpperCase()})"
          >
            <div
              class="flex items-center justify-between w-full text-[9px] sm:text-[10px] leading-none font-mono"
            >
              <span
                class={isTarget ? 'text-blue-100 font-bold' : 'text-gray-400 dark:text-gray-500'}
              >
                {cap.key.toUpperCase()}
              </span>
              {#if cap.shiftJamo}
                <span
                  class={isTarget ? 'text-blue-200 font-bold' : 'text-gray-400 dark:text-gray-500'}
                >
                  {cap.shiftJamo}
                </span>
              {/if}
            </div>
            <span class="text-sm sm:text-lg md:text-xl font-semibold leading-none my-auto">
              {isShiftActive && cap.shiftJamo ? cap.shiftJamo : cap.jamo}
            </span>
          </button>
        {/each}

        <!-- Right Shift (span 4) -->
        <div style="grid-column: span 4;">
          <ShiftKey
            side="Right"
            isTarget={isRightShiftTarget}
            widthClass="w-full"
            onselect={(e) => handleKeyClick('Shift', e)}
          />
        </div>
      {/if}
    </div>
  {/each}

  <!-- Bottom Spacebar Row -->
  <div class="flex items-center justify-center w-full mt-0.5">
    <button
      type="button"
      tabindex="-1"
      onmousedown={(e) => handleKeyClick(' ', e)}
      class="w-48 sm:w-64 md:w-80 h-7 sm:h-8 rounded-lg border text-xs font-semibold uppercase tracking-wider flex items-center justify-center transition-colors cursor-pointer shrink-0
        {isSpaceTarget
        ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500 shadow-sm'
        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}"
      aria-label="Spacebar"
    >
      <span>Space</span>
    </button>
  </div>
</div>
