<script lang="ts">
  interface Props {
    isSpeaking?: boolean;
    onclick?: (e: MouseEvent) => void;
  }

  let { isSpeaking = false, onclick }: Props = $props();
</script>

<button
  type="button"
  {onclick}
  onmousedown={(e) => e.stopPropagation()}
  title="Listen to Korean pronunciation"
  aria-label="Listen to Korean pronunciation"
  class="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-medium px-3.5 py-1.5 rounded-full text-xs md:text-sm border border-blue-200 dark:border-blue-800 shadow-2xs transition-colors cursor-pointer"
>
  <svg
    class="w-4 h-4 {isSpeaking ? 'animate-pulse text-blue-500' : ''}"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="2"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
    />
  </svg>
  <span>{isSpeaking ? 'Playing...' : 'Pronounce'}</span>
</button>
