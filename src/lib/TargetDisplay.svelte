<script lang="ts">
  import CharDisplay from './CharDisplay.svelte';
  import TTSAudioButton from './TTSAudioButton.svelte';
  import type { LessonItem } from '../types/korean';
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
    enableTTS?: boolean;
    isTTSSpeaking?: boolean;
    isTTSLoading?: boolean;
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
    enableTTS = false,
    isTTSSpeaking = false,
    isTTSLoading = false,
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
  let lastItemId = $state<string>('');
  let rafId: number | null = null;

  $effect(() => {
    const currentId = currentItem?.id;
    const isNewItem = currentId !== lastItemId;

    if (isNewItem) {
      lastItemId = currentId || '';
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (targetContainerElement) {
        targetContainerElement.scrollTo({ top: 0, behavior: 'auto' });
      }
    }

    // Reset scroll when switching items or starting at beginning
    if (activeTargetCursorIndex === 0 && !isCompleted && targetContainerElement) {
      targetContainerElement.scrollTo({ top: 0, behavior: 'auto' });
    }

    // When exercise is completed, smoothly scroll all the way to bottom to show audio button and subtext
    if (isCompleted && targetContainerElement) {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }

      rafId = requestAnimationFrame(() => {
        const container = targetContainerElement;
        if (!container) {
          rafId = null;
          return;
        }
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'smooth',
        });
        rafId = null;
      });
      return;
    }

    if (activeTargetCursorIndex !== undefined && activeCursorElement && targetContainerElement) {
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
          container.scrollBy({
            top: cursorRect.top - containerRect.top - padding,
            behavior: 'smooth',
          });
        } else if (cursorRect.bottom > containerRect.bottom - padding) {
          container.scrollBy({
            top: cursorRect.bottom - containerRect.bottom + padding,
            behavior: 'smooth',
          });
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
            />
          {:else}
            <CharDisplay
              char=" "
              {isError}
              {isCurrent}
              variant="target"
              dataIndex={i}
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
                />
              {:else}
                <CharDisplay
                  {char}
                  {isError}
                  {isCurrent}
                  variant="target"
                  dataIndex={i}
                />
              {/if}
            {/each}
          </span>
        {/if}
      {/each}
    </div>

    {#if enableTTS}
      <div class="audio-control-row mt-2 md:mt-3 flex items-center justify-center">
        <TTSAudioButton
          isSpeaking={isTTSSpeaking}
          isLoading={isTTSLoading}
          onclick={onspeak}
        />
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
