<script lang="ts">
  import type { TutorMode } from '../types/mastery';

  interface Props {
    mode: TutorMode;
    ontogglemode: () => void;
  }

  let { mode, ontogglemode }: Props = $props();
</script>

<div
  class="flex items-center bg-gray-200 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-300 dark:border-gray-700"
>
  <button
    type="button"
    onclick={() => {
      if (mode !== 'curriculum') ontogglemode();
    }}
    class="px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer {mode ===
    'curriculum'
      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
  >
    Free-form
  </button>
  <button
    type="button"
    onclick={() => {
      if (mode !== 'mastery') ontogglemode();
    }}
    class="px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer {mode ===
    'mastery'
      ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
  >
    Mastery
  </button>
</div>
