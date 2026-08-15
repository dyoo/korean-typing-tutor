<script lang="ts">
  import type { CursorColorMode } from '../utils/cursorColor';

  interface Props {
    value?: CursorColorMode;
    onchange?: (color: CursorColorMode) => void;
  }

  let { value = 'amber', onchange }: Props = $props();

  let isOpen = $state(false);

  const OPTIONS: Array<{ id: CursorColorMode; label: string; swatchClass: string }> = [
    { id: 'amber', label: 'Warm Amber', swatchClass: 'bg-amber-500' },
    { id: 'sky', label: 'Vibrant Sky', swatchClass: 'bg-sky-400' },
    { id: 'emerald', label: 'Emerald Green', swatchClass: 'bg-emerald-500' },
    { id: 'blue', label: 'Classic Blue', swatchClass: 'bg-blue-600' },
  ];

  let currentOption = $derived(OPTIONS.find((opt) => opt.id === value) ?? OPTIONS[0]);

  function selectOption(id: CursorColorMode) {
    onchange?.(id);
    isOpen = false;
  }
</script>

<div
  class="relative flex items-center justify-between select-none text-sm font-semibold text-gray-700 dark:text-gray-200"
>
  <span>Cursor Color</span>

  <div class="relative">
    <button
      type="button"
      onclick={() => (isOpen = !isOpen)}
      class="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded px-2.5 py-1 text-xs focus:outline-none focus:border-blue-600 cursor-pointer shadow-2xs"
    >
      <span class="w-3 h-3 rounded-full shrink-0 {currentOption.swatchClass}"></span>
      <span>{currentOption.label}</span>
      <svg
        class="w-3 h-3 text-gray-500 dark:text-gray-400 shrink-0"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fill-rule="evenodd"
          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
          clip-rule="evenodd"
        />
      </svg>
    </button>

    {#if isOpen}
      <!-- Backdrop overlay for click-outside, z-index above SettingsModal panel (z-50) -->
      <div
        role="button"
        tabindex="-1"
        aria-label="Close cursor color menu backdrop"
        onclick={(e) => {
          e.stopPropagation();
          isOpen = false;
        }}
        onkeydown={(e) => {
          if (e.key === 'Escape') isOpen = false;
        }}
        class="fixed inset-0 z-[60] bg-transparent"
      ></div>

      <div
        class="absolute right-0 top-full mt-1 z-[70] w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 flex flex-col gap-0.5"
      >
        {#each OPTIONS as opt}
          {@const isSelected = opt.id === value}
          <button
            type="button"
            onclick={() => selectOption(opt.id)}
            class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-left hover:bg-gray-100 dark:hover:bg-gray-700/80 transition-colors cursor-pointer {isSelected
              ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/30'
              : 'text-gray-700 dark:text-gray-200'}"
          >
            <span class="w-3 h-3 rounded-full shrink-0 {opt.swatchClass}"></span>
            <span class="flex-1">{opt.label}</span>
            {#if isSelected}
              <svg
                class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                />
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>
