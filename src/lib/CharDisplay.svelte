<script lang="ts">
  import { getCursorColorClass, type CursorColorMode } from '../utils/cursorColor';

  interface Props {
    char: string;
    isError?: boolean;
    isCurrent?: boolean;
    variant?: 'target' | 'input';
    dataIndex?: number;
    elementRef?: HTMLElement | null;
    cursorColor?: CursorColorMode;
  }

  let {
    char,
    isError = false,
    isCurrent = false,
    variant = 'target',
    dataIndex = undefined,
    elementRef = $bindable(null),
    cursorColor = 'amber',
  }: Props = $props();

  let textColor = $derived(
    isError
      ? variant === 'target'
        ? 'text-red-600 dark:text-red-400'
        : 'text-red-500 dark:text-red-400 font-bold'
      : variant === 'target'
        ? 'text-gray-900 dark:text-gray-100'
        : 'text-blue-600 dark:text-blue-400 font-bold',
  );

  let cursorBgClass = $derived(getCursorColorClass(cursorColor));
</script>

<span
  bind:this={elementRef}
  data-target-index={dataIndex}
  data-char={char}
  class="relative inline-flex flex-col items-center pb-2 pt-1 mx-0.5"
>
  <span class="whitespace-pre {textColor}">
    {char === ' ' ? ' ' : char}
  </span>
  {#if isCurrent}
    {#if variant === 'input'}
      <span
        class="absolute -right-0.5 top-1/2 -translate-y-1/2 h-[65%] w-[2.5px] {cursorBgClass} rounded-full"
      ></span>
    {:else}
      <span
        class="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-[0.85em] {cursorBgClass} rounded-full"
      ></span>
    {/if}
  {/if}
</span>
