<script lang="ts">
  import type { TutorSettings, ThemeMode } from './settings';
  import type { CursorColorMode } from '../utils/cursorColor';
  import DualRangeSlider from './DualRangeSlider.svelte';
  import CursorColorSelect from './CursorColorSelect.svelte';
  import TTSSettingsControl from './TTSSettingsControl.svelte';

  interface Props {
    isOpen: boolean;
    settings: TutorSettings;
    onclose: () => void;
    onthemechange: (theme: ThemeMode) => void;
    ontogglepronunciation: () => void;
    ontoggletranslation: () => void;
    ontogglevirtualkeyboard: () => void;
    ontogglekeyboardhint: () => void;
    onminfontsizechange?: (minSize: number) => void;
    onmaxfontsizechange?: (maxSize: number) => void;
    ontogglelockfontsize?: () => void;
    oncursorcolorchange?: (cursorColor: CursorColorMode) => void;
    ontoggletts?: () => void;
    ontogglespeakoncompletion?: () => void;
    ontogglespeakonappearance?: () => void;
    onvoicechange?: (voice: string) => void;
    onspeedchange?: (speed: number) => void;
    ontogglekpm?: () => void;
    onresetkpm?: () => void;
  }

  let {
    isOpen,
    settings,
    onclose,
    onthemechange,
    ontogglepronunciation,
    ontoggletranslation,
    ontogglevirtualkeyboard,
    ontogglekeyboardhint,
    onminfontsizechange,
    onmaxfontsizechange,
    ontogglelockfontsize,
    oncursorcolorchange,
    ontoggletts,
    ontogglespeakoncompletion,
    ontogglespeakonappearance,
    onvoicechange,
    onspeedchange,
    ontogglekpm,
    onresetkpm,
  }: Props = $props();

  let showConfirmResetKpm = $state(false);

  function handleResetKpmClick() {
    if (!showConfirmResetKpm) {
      showConfirmResetKpm = true;
      return;
    }
    showConfirmResetKpm = false;
    onresetkpm?.();
  }

  function handleCancelResetKpm() {
    showConfirmResetKpm = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onclose();
    }
  }

  function handleSelectTheme(e: Event) {
    const val = (e.target as HTMLSelectElement).value as ThemeMode;
    onthemechange(val);
  }

  function handleMinFontSizeInput(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    onminfontsizechange?.(val);
  }

  let minVal = $derived(settings.minFontSizeRem ?? 2.0);
  let maxVal = $derived(settings.maxFontSizeRem ?? 6.0);
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Transparent backdrop overlay for reliable click-outside closing -->
  <div
    role="button"
    tabindex="-1"
    aria-label="Close settings modal backdrop"
    onclick={onclose}
    onkeydown={(e) => {
      if (e.key === 'Escape') {
        onclose();
      }
    }}
    class="fixed inset-0 z-40 bg-transparent select-none"
  ></div>

  <div
    tabindex="-1"
    role="region"
    aria-label="Display Settings Panel"
    class="settings-modal fixed top-12 md:top-14 right-4 md:right-8 w-80 md:w-96 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl pl-4 pr-6 py-4 md:pl-5 md:pr-7 md:py-5 z-50 flex flex-col gap-4 text-sm font-semibold text-gray-700 dark:text-gray-200"
  >
    <div
      class="sticky -top-4 -ml-4 -mr-6 md:-top-5 md:-ml-5 md:-mr-7 pl-4 pr-6 md:pl-5 md:pr-7 pt-1 pb-2.5 bg-white dark:bg-gray-800 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 z-10"
    >
      <span
        class="font-bold text-base text-gray-900 dark:text-gray-100 uppercase tracking-wider font-mono"
      >
        Settings
      </span>
        <button
          type="button"
          onclick={onclose}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md cursor-pointer"
          aria-label="Close Settings Panel"
        >
          <svg
            class="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Theme Selector -->
      <div class="flex items-center justify-between">
        <label for="theme-select" class="cursor-pointer font-bold text-gray-900 dark:text-gray-100">Theme</label>
        <select
          id="theme-select"
          value={settings.theme}
          onchange={handleSelectTheme}
          class="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        >
          <option value="system">System Default</option>
          <option value="light">Light Mode</option>
          <option value="dark">Dark Mode</option>
        </select>
      </div>

      <!-- Cursor Color Accent Selector -->
      <CursorColorSelect
        value={settings.cursorColor ?? 'amber'}
        onchange={(color) => oncursorcolorchange?.(color)}
      />

      <!-- Romanization / Pronunciation Toggle -->
      <label class="flex items-center justify-between cursor-pointer">
        <span class="font-bold text-gray-900 dark:text-gray-100">Show Romanization</span>
        <input
          type="checkbox"
          checked={settings.showPronunciation}
          onchange={ontogglepronunciation}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <!-- English Translation Toggle -->
      <label class="flex items-center justify-between cursor-pointer">
        <span class="font-bold text-gray-900 dark:text-gray-100">Show English Translation</span>
        <input
          type="checkbox"
          checked={settings.showTranslation}
          onchange={ontoggletranslation}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <!-- Virtual Keyboard Section -->
      <div class="flex flex-col gap-2 pt-2.5 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <span class="font-bold text-gray-900 dark:text-gray-100">Virtual Keyboard</span>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showVirtualKeyboard}
              onchange={ontogglevirtualkeyboard}
              class="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <span>Enable</span>
          </label>
        </div>

        {#if settings.showVirtualKeyboard}
          <div class="flex flex-col gap-2 mt-1 pl-2">
            <!-- Keyboard Hint Toggle -->
            <label class="flex items-center justify-between cursor-pointer">
              <span class="text-xs text-gray-600 dark:text-gray-400">Show keyboard hints</span>
              <input
                type="checkbox"
                checked={settings.showKeyboardHint}
                onchange={ontogglekeyboardhint}
                class="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>
        {/if}
      </div>

      <!-- Target Text Size Slider & Lock Toggle -->
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

        <div class="flex flex-col gap-2 mt-1">
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

      <!-- Voice Synthesis (TTS) Section -->
      <TTSSettingsControl
        {settings}
        {ontoggletts}
        {ontogglespeakoncompletion}
        {ontogglespeakonappearance}
        {onvoicechange}
        {onspeedchange}
      />

      <!-- Speed Analytics (KPM) Section -->
      <div class="flex flex-col gap-2 pt-2.5 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <span class="font-bold text-gray-900 dark:text-gray-100">Speed Analytics (KPM)</span>
          <label class="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.showKpm ?? true}
              onchange={ontogglekpm}
              class="w-4 h-4 text-blue-600 rounded cursor-pointer"
            />
            <span>Enable</span>
          </label>
        </div>

        <div class="flex flex-col gap-2 mt-1">
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-600 dark:text-gray-400">Speed & accuracy history</span>
            {#if showConfirmResetKpm}
              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  onclick={handleResetKpmClick}
                  class="px-2 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500 rounded cursor-pointer transition-colors"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onclick={handleCancelResetKpm}
                  class="px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            {:else}
              <button
                type="button"
                onclick={handleResetKpmClick}
                class="px-2.5 py-1 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 rounded cursor-pointer transition-colors"
              >
                Reset Stats
              </button>
            {/if}
          </div>
        </div>
      </div>
    </div>
  {/if}

