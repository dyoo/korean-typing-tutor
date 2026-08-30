<script lang="ts">
  interface Props {
    isSpeaking?: boolean;
    isLoading?: boolean;
    onclick?: (e: MouseEvent) => void;
  }

  let { isSpeaking = false, isLoading = false, onclick }: Props = $props();
</script>

<button
  type="button"
  disabled={isLoading}
  {onclick}
  onmousedown={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
  onpointerdown={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
  title={isLoading
    ? 'Generating Korean pronunciation...'
    : 'Listen to Korean pronunciation (Ctrl+S / ⌘S)'}
  aria-label={isLoading
    ? 'Generating Korean pronunciation...'
    : 'Listen to Korean pronunciation (Ctrl+S / ⌘S)'}
  class="inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors shrink-0 {isLoading
    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
    : 'text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:text-blue-800 dark:hover:text-blue-200 cursor-pointer'}"
>
  {#if isLoading}
    <svg
      class="w-5 h-5 text-gray-400 dark:text-gray-500"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2.2"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke-dasharray="3 3"
      />
      <circle
        cx="12"
        cy="12"
        r="2"
        fill="currentColor"
      />
    </svg>
  {:else}
    <svg
      class="w-5 h-5 {isSpeaking ? 'text-blue-500 dark:text-blue-300' : ''}"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2.2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
      />
    </svg>
  {/if}
</button>
