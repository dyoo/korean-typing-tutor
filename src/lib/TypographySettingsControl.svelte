<script lang="ts">
  import DualRangeSlider from './DualRangeSlider.svelte';
  import type { TutorSettings } from './settings';

  interface Props {
    settings: TutorSettings;
    ontogglelockfontsize?: () => void;
    onminfontsizechange?: (minSize: number) => void;
    onmaxfontsizechange?: (maxSize: number) => void;
  }

  let {
    settings,
    ontogglelockfontsize,
    onminfontsizechange,
    onmaxfontsizechange,
  }: Props = $props();

  let minVal = $derived(settings.minFontSizeRem ?? 2.0);
  let maxVal = $derived(settings.maxFontSizeRem ?? 6.0);

  function handleMinFontSizeInput(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    onminfontsizechange?.(val);
  }
</script>

<div class="flex flex-col gap-2 pt-2.5 border-t border-gray-200 dark:border-gray-700">
  <div class="flex items-center justify-between">
    <span class="font-bold text-gray-900 dark:text-gray-100">Typography Sizing</span>
    <label
      class="flex items-center gap-1.5 cursor-pointer text-xs text-gray-500 dark:text-gray-400"
    >
      <input
        type="checkbox"
        checked={settings.lockFontSize}
        onchange={ontogglelockfontsize}
        class="w-4 h-4 text-blue-600 rounded cursor-pointer"
      />
      <span>Lock Size</span>
    </label>
  </div>

  <div class="flex flex-col gap-2 mt-1 pl-2">
    {#if settings.lockFontSize}
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-600 dark:text-gray-400">Font size</span>
          <span
            class="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800"
          >
            {minVal}rem
          </span>
        </div>
        <div class="pt-1">
          <input
            type="range"
            min="1.0"
            max="6.0"
            step="0.25"
            value={minVal}
            oninput={handleMinFontSizeInput}
            class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
          />
        </div>
      </div>
    {:else}
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-600 dark:text-gray-400">Min & max font size</span>
          <span
            class="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800"
          >
            {minVal}rem – {maxVal}rem
          </span>
        </div>

        <div class="pt-1">
          <DualRangeSlider
            min={1.0}
            max={6.0}
            step={0.25}
            minValue={minVal}
            maxValue={maxVal}
            onminchange={(val) => onminfontsizechange?.(val)}
            onmaxchange={(val) => onmaxfontsizechange?.(val)}
          />
        </div>
      </div>
    {/if}
  </div>
</div>
