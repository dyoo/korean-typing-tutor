<script lang="ts">
  interface Props {
    side: 'Left' | 'Right';
    isTarget?: boolean;
    onselect?: (e: MouseEvent) => void;
  }

  let { side, isTarget = false, onselect }: Props = $props();
</script>

<button
  type="button"
  tabindex="-1"
  onmousedown={(e) => onselect?.(e)}
  class="relative flex items-center justify-center w-10 sm:w-14 md:w-16 h-10 sm:h-13 rounded-lg border text-center transition-colors cursor-pointer shrink-0 text-xs sm:text-sm font-semibold uppercase tracking-wide
    {isTarget
      ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-500 shadow-sm font-bold'
      : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}"
  aria-label="{side} Shift Key"
>
  <span>Shift ⇧</span>
</button>
