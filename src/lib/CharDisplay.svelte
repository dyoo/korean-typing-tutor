<script lang="ts">
  interface Props {
    char: string;
    isError?: boolean;
    isCurrent?: boolean;
    variant?: 'target' | 'input';
    dataIndex?: number;
    elementRef?: HTMLElement | null;
  }

  let {
    char,
    isError = false,
    isCurrent = false,
    variant = 'target',
    dataIndex = undefined,
    elementRef = $bindable(null)
  }: Props = $props();

  let textColor = $derived(
    isError
      ? variant === 'target'
        ? 'text-red-600 dark:text-red-400 font-bold'
        : 'text-red-500 dark:text-red-400'
      : variant === 'target'
        ? 'text-gray-900 dark:text-gray-100 font-bold'
        : 'text-blue-600 dark:text-blue-400'
  );
</script>

<span
  bind:this={elementRef}
  data-target-index={dataIndex}
  class="relative inline-flex flex-col items-center pb-2 pt-1 mx-0.5"
>
  <span class="whitespace-pre {textColor}">
    {char === ' ' ? ' ' : char}
  </span>
  {#if isError}
    <span class="absolute bottom-0 h-[3px] w-[0.7em] bg-red-500 dark:bg-red-400 rounded-full"
    ></span>
  {:else if isCurrent}
    <span class="absolute bottom-0 h-[3px] w-[0.7em] bg-blue-600 dark:bg-blue-500 rounded-full"
    ></span>
  {/if}
</span>
