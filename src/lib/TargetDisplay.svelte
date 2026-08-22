<script lang="ts">
  import CharDisplay from './CharDisplay.svelte';
  import TTSAudioButton from './TTSAudioButton.svelte';
  import type { LessonItem } from '../types/korean';
  import type { CursorColorMode } from '../utils/cursorColor';
  import {
    getTargetFontSizeClass,
    getTargetFontWeightClass,
    getSubtextFontSizeClass,
    getTargetFontSizeStyle,
  } from '../utils/fontScaler';

  interface Props {
    wordTokens: Array<{ type: 'word' | 'space'; indices: number[] }>;
    errorMap: Map<number, boolean>;
    activeTargetCursorIndex: number;
    isCompleted: boolean;
    currentItem: LessonItem;
    displayText: string;
    minFontSizeRem?: number;
    maxFontSizeRem?: number;
    lockFontSize?: boolean;
    cursorColor?: CursorColorMode;
    enableTTS?: boolean;
    isTTSSpeaking?: boolean;
    onspeak?: () => void;
  }

  let {
    wordTokens,
    errorMap,
    activeTargetCursorIndex,
    isCompleted,
    currentItem,
    displayText,
    minFontSizeRem = 1.25,
    maxFontSizeRem = 5.5,
    lockFontSize = false,
    cursorColor = 'amber',
    enableTTS = false,
    isTTSSpeaking = false,
    onspeak,
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

  let targetContainerElement = $state<HTMLDivElement | null>(null);
  let activeCursorElement = $state<HTMLElement | null>(null);
  let rafId: number | null = null;

  $effect(() => {
    // Reset scroll when switching items or starting at beginning
    if (activeTargetCursorIndex === 0 && targetContainerElement) {
      targetContainerElement.scrollTop = 0;
    }

    if (
      activeTargetCursorIndex !== undefined &&
      activeCursorElement &&
      targetContainerElement
    ) {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const container = targetContainerElement;
        const cursor = activeCursorElement;
        if (!container || !cursor) {
          rafId = null;
          return;
        }

        const containerRect = container.getBoundingClientRect();
        const cursorRect = cursor.getBoundingClientRect();
        const padding = 20;

        if (cursorRect.top < containerRect.top + padding) {
          container.scrollTop += cursorRect.top - containerRect.top - padding;
        } else if (cursorRect.bottom > containerRect.bottom - padding) {
          container.scrollTop += cursorRect.bottom - containerRect.bottom + padding;
        }
        rafId = null;
      });
    }

    return () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  });
</script>

<div
  bind:this={targetContainerElement}
  class="w-full max-w-full flex-1 min-h-0 flex flex-col items-center overflow-y-auto px-2 py-2 select-text"
>
  <div class="my-auto w-full max-w-full flex flex-col items-center">
    <div
      class="target-display relative flex flex-wrap break-keep justify-center gap-y-3 md:gap-y-4 tracking-normal text-center w-full max-w-full {fontSizeClass} {fontWeightClass}"
      style={fontSizeStyle}
    >
      {#each wordTokens as token}
        {#if token.type === 'space'}
          {@const i = token.indices[0]}
          {@const isError = errorMap.get(i) ?? false}
          {@const isCurrent = i === activeTargetCursorIndex && !isCompleted}

          {#if isCurrent}
            <CharDisplay
              bind:elementRef={activeCursorElement}
              char=" "
              {isError}
              {isCurrent}
              variant="target"
              dataIndex={i}
              {cursorColor}
            />
          {:else}
            <CharDisplay
              char=" "
              {isError}
              {isCurrent}
              variant="target"
              dataIndex={i}
              {cursorColor}
            />
          {/if}
        {:else}
          <span class="inline-flex flex-wrap max-w-full">
            {#each token.indices as i}
              {@const char = currentItem.target[i]}
              {@const isError = errorMap.get(i) ?? false}
              {@const isCurrent = i === activeTargetCursorIndex && !isCompleted}

              {#if isCurrent}
                <CharDisplay
                  bind:elementRef={activeCursorElement}
                  {char}
                  {isError}
                  {isCurrent}
                  variant="target"
                  dataIndex={i}
                  {cursorColor}
                />
              {:else}
                <CharDisplay
                  {char}
                  {isError}
                  {isCurrent}
                  variant="target"
                  dataIndex={i}
                  {cursorColor}
                />
              {/if}
            {/each}
          </span>
        {/if}
      {/each}
    </div>

    {#if enableTTS}
      <div class="audio-control-row mt-2 md:mt-3 flex items-center justify-center">
        <TTSAudioButton isSpeaking={isTTSSpeaking} onclick={onspeak} />
      </div>
    {/if}

    {#if displayText.trim().length > 0}
      <div
        class="subtext-display text-gray-500 dark:text-gray-400 font-medium italic mt-2 text-center tracking-wide flex items-center justify-center max-w-full px-4 py-1 shrink-0 {subtextClass}"
      >
        <span>{displayText}</span>
      </div>
    {/if}
  </div>
</div>
