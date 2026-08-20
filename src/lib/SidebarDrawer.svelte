<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    isOpen: boolean;
    title: string;
    subtitle: string;
    ariaLabel: string;
    onclose: () => void;
    headerActions?: Snippet;
    children: Snippet;
  }

  let {
    isOpen,
    title,
    subtitle,
    ariaLabel,
    onclose,
    headerActions,
    children,
  }: Props = $props();

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onclose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop Overlay -->
  <div
    role="button"
    tabindex="-1"
    aria-label="Close sidebar backdrop"
    onclick={onclose}
    onkeydown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onclose();
      }
    }}
    class="fixed inset-0 z-40 bg-black/40 dark:bg-black/60 transition-opacity select-none"
  ></div>

  <!-- Sidebar Panel -->
  <div
    role="dialog"
    aria-modal="true"
    aria-label={ariaLabel}
    class="fixed inset-y-0 left-0 z-50 w-80 md:w-96 bg-white dark:bg-gray-800 border-r-2 border-gray-200 dark:border-gray-700 shadow-2xl flex flex-col"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/80"
    >
      <div class="flex flex-col">
        <h2
          class="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 font-mono"
        >
          {title}
        </h2>
        <span class="text-xs text-gray-500 dark:text-gray-400 font-semibold mt-0.5">
          {subtitle}
        </span>
      </div>

      <button
        type="button"
        onclick={onclose}
        class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        aria-label="Close Sidebar"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    {#if headerActions}
      {@render headerActions()}
    {/if}

    {@render children()}
  </div>
{/if}
