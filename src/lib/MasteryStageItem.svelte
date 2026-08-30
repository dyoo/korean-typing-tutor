<script lang="ts">
  interface Props {
    jamo: string;
    keyName: string;
    shift?: boolean;
    isSelected: boolean;
    progress: number;
    onselect: () => void;
  }

  let { jamo, keyName, shift = false, isSelected, progress, onselect }: Props = $props();
</script>

<label
  class="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-700/60 cursor-pointer transition-colors select-none {isSelected
    ? 'bg-amber-50 dark:bg-amber-950/40'
    : ''}"
>
  <input
    type="radio"
    name="mastery-level"
    checked={isSelected}
    onchange={onselect}
    class="w-4 h-4 text-amber-600 rounded-full cursor-pointer shrink-0 accent-amber-600"
  />
  <div class="flex items-center gap-2">
    <span
      class="relative overflow-hidden text-lg font-bold min-w-[32px] text-center leading-none {progress >=
      100
        ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-amber-600 dark:text-amber-400'}"
    >
      {#if progress > 0}
        <div
          class="absolute bottom-0 inset-x-0 pointer-events-none {progress >= 100
            ? 'bg-emerald-500/25 dark:bg-emerald-400/25'
            : 'bg-amber-400/30 dark:bg-amber-400/25'}"
          style="height: {progress}%;"
        ></div>
      {/if}
      <span class="relative z-10">{jamo}</span>
    </span>
    <span class="text-xs font-mono text-gray-500 dark:text-gray-400 uppercase">
      {keyName}{shift ? '+Shift' : ''}
    </span>
  </div>
</label>
