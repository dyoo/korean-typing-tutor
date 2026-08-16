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
  onmousedown={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
  onpointerdown={(e) => {
    e.preventDefault();
    e.stopPropagation();
  }}
  title="Listen to Korean pronunciation"
  aria-label="Listen to Korean pronunciation"
  class="inline-flex items-center justify-center p-1 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 hover:text-blue-800 dark:hover:text-blue-200 transition-colors cursor-pointer shrink-0 align-middle leading-none my-auto"
>
  <svg
    class="w-[1.15em] h-[1.15em] {isSpeaking ? 'animate-pulse text-blue-500' : ''}"
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
</button>
