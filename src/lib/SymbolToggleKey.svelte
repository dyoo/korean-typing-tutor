<script lang="ts">
  interface Props {
    /** True when the keyboard is showing the symbol layout; false for the letter layout. */
    isSymbolMode: boolean;
    customClass?: string;
    onselect?: (e: MouseEvent) => void;
  }

  let { isSymbolMode, customClass = 'h-14 flex-[1.5] max-w-[18%]', onselect }: Props = $props();
</script>

<button
  type="button"
  tabindex="-1"
  onmousedown={(e) => onselect?.(e)}
  class="rounded-lg border text-xs font-bold font-mono transition-colors cursor-pointer flex items-center justify-center bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 active:bg-slate-300 dark:active:bg-slate-600 shadow-2xs {customClass}"
  aria-label={isSymbolMode ? 'Switch to Korean Letters' : 'Switch to Numbers and Symbols'}
>
  {isSymbolMode ? 'ㄱㄴㄷ' : '?123'}
</button>
