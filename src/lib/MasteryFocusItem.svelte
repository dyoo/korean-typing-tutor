<script lang="ts">
  interface KpmStats {
    kpm: number;
    accuracy?: number;
    bestKpm?: number;
  }

  interface Props {
    label: string;
    isChar?: boolean;
    progress?: number;
    isSelected: boolean;
    showKpm?: boolean;
    kpmStats?: KpmStats | null;
    accuracy?: number | null;
    onselect: () => void;
  }

  let {
    label,
    isChar = false,
    progress = 0,
    isSelected,
    showKpm = true,
    kpmStats = null,
    accuracy = null,
    onselect,
  }: Props = $props();
</script>

<label
  class="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none {isSelected
    ? 'bg-purple-100/80 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-700'
    : ''}"
>
  <input
    type="radio"
    name="mastery-level"
    checked={isSelected}
    onchange={onselect}
    class="w-4 h-4 text-purple-600 rounded-full cursor-pointer shrink-0 accent-purple-600"
  />
  <div class="flex items-center justify-between gap-2 flex-1 min-w-0">
    {#if isChar}
      <span
        class="relative overflow-hidden text-lg font-bold min-w-[32px] text-center leading-none {progress >=
        100
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-purple-700 dark:text-purple-300'}"
      >
        {#if progress > 0}
          <div
            class="absolute bottom-0 inset-x-0 pointer-events-none {progress >= 100
              ? 'bg-emerald-500/25 dark:bg-emerald-400/25'
              : 'bg-purple-400/30 dark:bg-purple-400/25'}"
            style="height: {progress}%;"
          ></div>
        {/if}
        <span class="relative z-10">{label}</span>
      </span>
    {:else}
      <span class="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
        {label}
      </span>
    {/if}

    {#if showKpm}
      <div class="flex flex-col items-end shrink-0 text-right">
        {#if kpmStats}
          {#if kpmStats.bestKpm !== undefined}
            <span class="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
              {kpmStats.kpm} KPM
            </span>
            <span class="text-[10px] font-mono text-gray-500 dark:text-gray-400">
              {kpmStats.accuracy}% acc · Best {kpmStats.bestKpm}
            </span>
          {:else}
            <span class="text-xs font-mono font-bold text-gray-800 dark:text-gray-200">
              {kpmStats.kpm} KPM
            </span>
            {#if accuracy !== null}
              <span class="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                {accuracy}% acc
              </span>
            {/if}
          {/if}
        {:else if accuracy !== null}
          <span class="text-xs font-mono font-medium text-gray-600 dark:text-gray-300">
            {accuracy}% acc
          </span>
        {:else}
          <span class="text-[11px] font-mono text-gray-400 dark:text-gray-500">
            — KPM
          </span>
        {/if}
      </div>
    {/if}
  </div>
</label>
