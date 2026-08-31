<script lang="ts">
  import { getCursorColorClass } from '../utils/cursorColor';
  import { settingsStore } from './settings.svelte';

  interface Props {
    char: string;
    isError?: boolean;
    isCurrent?: boolean;
    isLeadingCursor?: boolean;
    variant?: 'target' | 'input';
    dataIndex?: number;
    elementRef?: HTMLElement | null;
    onselect?: () => void;
  }

  let {
    char,
    isError = false,
    isCurrent = false,
    isLeadingCursor = false,
    variant = 'target',
    dataIndex = undefined,
    elementRef = $bindable(null),
    onselect,
  }: Props = $props();

  let textColor = $derived(
    isError
      ? variant === 'target'
        ? 'text-red-600 dark:text-red-400'
        : 'text-red-500 dark:text-red-400 font-medium'
      : variant === 'target'
        ? 'text-gray-900 dark:text-gray-100'
        : 'text-blue-600 dark:text-blue-400 font-medium',
  );

  let cursorBgClass = $derived(getCursorColorClass(settingsStore.current.cursorColor));

  function handleClick(e: MouseEvent) {
    if (variant === 'input' && onselect) {
      e.stopPropagation();
      onselect();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<span
  bind:this={elementRef}
  data-target-index={dataIndex}
  data-char={char}
  onclick={handleClick}
  class="relative inline-flex flex-col items-center mx-0.5 {variant === 'input'
    ? 'cursor-pointer py-0.5'
    : 'pb-2 pt-1'}"
>
  <span class="whitespace-pre {textColor}">
    {char === ' ' ? ' ' : char}
  </span>
  {#if isCurrent}
    {#if variant === 'input'}
      <span
        class="absolute {isLeadingCursor
          ? '-left-0.5'
          : '-right-0.5'} top-1/2 -translate-y-1/2 h-[65%] w-[2.5px] {cursorBgClass} rounded-full"
      ></span>
    {:else}
      <span
        class="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[0.85em] {cursorBgClass} rounded-full"
      ></span>
    {/if}
  {/if}
</span>
