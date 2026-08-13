<script lang="ts">
  import CharDisplay from './CharDisplay.svelte';
  import type { ErrorReport, LessonItem } from '../types/korean';
  import type { CursorColorMode } from '../utils/cursorColor';
  import {
    getTargetFontSizeClass,
    getTargetFontWeightClass,
    getSubtextFontSizeClass,
    getTargetFontSizeStyle,
  } from '../utils/fontScaler';

  interface Props {
    wordTokens: Array<{ type: 'word' | 'space'; indices: number[] }>;
    errors: ErrorReport[];
    activeTargetCursorIndex: number;
    isCompleted: boolean;
    currentItem: LessonItem;
    displayText: string;
    minFontSizeRem?: number;
    maxFontSizeRem?: number;
    lockFontSize?: boolean;
    cursorColor?: CursorColorMode;
  }

  let {
    wordTokens,
    errors,
    activeTargetCursorIndex,
    isCompleted,
    currentItem,
    displayText,
    minFontSizeRem = 1.25,
    maxFontSizeRem = 5.5,
    lockFontSize = false,
    cursorColor = 'amber',
  }: Props = $props();

  let targetLength = $derived(currentItem.target.length);
  let displayTextLength = $derived(displayText.length);

  let fontSizeClass = $derived(getTargetFontSizeClass(targetLength, displayTextLength));
  let fontSizeStyle = $derived(
    getTargetFontSizeStyle(
      targetLength,
      displayTextLength,
      minFontSizeRem,
      maxFontSizeRem,
      lockFontSize,
    ),
  );
  let fontWeightClass = $derived(getTargetFontWeightClass(targetLength));
  let subtextClass = $derived(getSubtextFontSizeClass(targetLength));
</script>

<div
  class="w-full max-w-full flex-1 min-h-0 flex flex-col items-center justify-center overflow-y-auto px-2 py-2 select-text"
>
  <div
    class="target-display relative flex flex-wrap break-keep justify-center gap-y-3 md:gap-y-4 tracking-normal text-center w-full max-w-full {fontSizeClass} {fontWeightClass}"
    style={fontSizeStyle}
  >
    {#each wordTokens as token}
      {#if token.type === 'space'}
        {@const i = token.indices[0]}
        {@const isError = errors.find((e) => e.index === i)?.isError ?? false}
        {@const isCurrent = i === activeTargetCursorIndex && !isCompleted}

        <CharDisplay char=" " {isError} {isCurrent} variant="target" dataIndex={i} {cursorColor} />
      {:else}
        <span class="inline-flex flex-wrap max-w-full">
          {#each token.indices as i}
            {@const char = currentItem.target[i]}
            {@const isError = errors.find((e) => e.index === i)?.isError ?? false}
            {@const isCurrent = i === activeTargetCursorIndex && !isCompleted}

            <CharDisplay
              {char}
              {isError}
              {isCurrent}
              variant="target"
              dataIndex={i}
              {cursorColor}
            />
          {/each}
        </span>
      {/if}
    {/each}
  </div>

  {#if displayText.trim().length > 0}
    <div
      class="subtext-display text-gray-500 dark:text-gray-400 font-medium italic mt-3 md:mt-4 text-center tracking-wide flex flex-col items-center justify-center max-w-full px-4 py-1 shrink-0 {subtextClass}"
    >
      {displayText}
    </div>
  {/if}
</div>
