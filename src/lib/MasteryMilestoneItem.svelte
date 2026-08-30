<script lang="ts">
  interface Props {
    title: string;
    completedCount: number;
    requiredCompletions: number;
    isMastered: boolean;
    isSelected: boolean;
    onselect: () => void;
  }

  let { title, completedCount, requiredCompletions, isMastered, isSelected, onselect }: Props =
    $props();

  let percent = $derived(
    requiredCompletions > 0
      ? Math.min(100, Math.round((completedCount / requiredCompletions) * 100))
      : 0,
  );
</script>

<label
  class="flex items-center gap-2.5 p-1.5 mt-1 rounded-lg border border-dashed border-amber-300 dark:border-amber-700/60 hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none {isSelected
    ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-500 dark:border-amber-400'
    : 'bg-amber-50/50 dark:bg-amber-950/20'}"
>
  <input
    type="radio"
    name="mastery-level"
    checked={isSelected}
    onchange={onselect}
    class="w-4 h-4 text-amber-600 rounded-full cursor-pointer shrink-0 accent-amber-600"
  />
  <div class="flex flex-col min-w-0 flex-1">
    <div class="flex items-center justify-between gap-1">
      <span class="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
        <span class="text-gray-500 dark:text-gray-400 font-medium">Milestone:</span>
        {title}
      </span>
      <span
        class="text-xs font-mono font-bold px-1.5 py-0.5 rounded shrink-0 {isMastered
          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'}"
      >
        {completedCount}/{requiredCompletions}
      </span>
    </div>
    {#if percent > 0}
      <div class="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-1 overflow-hidden">
        <div
          class="h-full {isMastered ? 'bg-emerald-500' : 'bg-amber-500'} transition-all"
          style="width: {percent}%;"
        ></div>
      </div>
    {/if}
  </div>
</label>
