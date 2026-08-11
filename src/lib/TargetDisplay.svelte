<script lang="ts">
  import CharDisplay from './CharDisplay.svelte';
  import type { ErrorReport, LessonItem } from '../types/korean';

  interface Props {
    wordTokens: Array<{ type: 'word' | 'space'; indices: number[] }>;
    errors: ErrorReport[];
    activeTargetCursorIndex: number;
    isCompleted: boolean;
    currentItem: LessonItem;
    displayText: string;
  }

  let {
    wordTokens,
    errors,
    activeTargetCursorIndex,
    isCompleted,
    currentItem,
    displayText,
  }: Props = $props();
</script>

<div
  class="target-display relative flex flex-wrap break-keep justify-center gap-y-4 font-bold tracking-normal text-center select-text w-full max-w-full text-giant"
>
  {#each wordTokens as token}
    {#if token.type === 'space'}
      {@const i = token.indices[0]}
      {@const isError = errors.find((e) => e.index === i)?.isError ?? false}
      {@const isCurrent = i === activeTargetCursorIndex && !isCompleted}

      <CharDisplay char=" " {isError} {isCurrent} variant="target" dataIndex={i} />
    {:else}
      <span class="inline-flex whitespace-nowrap">
        {#each token.indices as i}
          {@const char = currentItem.target[i]}
          {@const isError = errors.find((e) => e.index === i)?.isError ?? false}
          {@const isCurrent = i === activeTargetCursorIndex && !isCompleted}

          <CharDisplay {char} {isError} {isCurrent} variant="target" dataIndex={i} />
        {/each}
      </span>
    {/if}
  {/each}
</div>

{#if displayText.trim().length > 0}
  <div
    class="text-subgiant text-gray-500 dark:text-gray-400 font-medium italic mt-6 text-center tracking-wide min-h-[3rem] h-auto flex flex-col items-center justify-center select-text max-w-full px-4 py-2"
  >
    {displayText}
  </div>
{/if}
