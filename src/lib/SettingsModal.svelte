<script lang="ts">
  import type { TutorSettings, ThemeMode } from './settings';
  import type { CursorColorMode } from '../utils/cursorColor';
  import DualRangeSlider from './DualRangeSlider.svelte';
  import CursorColorSelect from './CursorColorSelect.svelte';
  import TTSSettingsControl from './TTSSettingsControl.svelte';

  interface Props {
    isOpen: boolean;
    settings: TutorSettings;
    ontogglesettings: (e?: MouseEvent) => void;
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
    onvoicechange?: (voice: string) => void;
    onspeedchange?: (speed: number) => void;
    onclearttscache?: () => void;
  }

  let {
    isOpen,
    settings,
    ontogglesettings,
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
    onvoicechange,
    onspeedchange,
    onclearttscache,
  }: Props = $props();

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

<div class="relative flex items-center gap-2">
  <button
    type="button"
    onclick={ontogglesettings}
    onmousedown={(e) => e.stopPropagation()}
    class="settings-btn flex items-center gap-1.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg px-3 py-1.5 hover:border-blue-600 dark:hover:border-blue-500 focus:outline-none shadow-sm text-sm cursor-pointer"
    aria-label="Settings"
  >
    <svg
      class="w-4 h-4 text-gray-500 dark:text-gray-400"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    <span class="hidden sm:inline">Settings</span>
  </button>

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
      class="settings-modal absolute right-0 top-full mt-2 w-72 sm:w-84 max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 z-50 flex flex-col gap-4 text-xs font-semibold text-gray-700 dark:text-gray-200"
    >
      <div
        class="sticky -top-4 -mx-4 px-4 pt-1 pb-2 bg-white dark:bg-gray-800 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 z-10"
      >
        <span
          class="font-bold text-sm text-gray-900 dark:text-gray-100 uppercase tracking-wider font-mono"
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
        <label for="theme-select" class="cursor-pointer">Theme</label>
        <select
          id="theme-select"
          value={settings.theme}
          onchange={handleSelectTheme}
          class="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-2.5 py-1 text-xs focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
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
        <span>Show Romanization</span>
        <input
          type="checkbox"
          checked={settings.showPronunciation}
          onchange={ontogglepronunciation}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <!-- English Translation Toggle -->
      <label class="flex items-center justify-between cursor-pointer">
        <span>Show English Translation</span>
        <input
          type="checkbox"
          checked={settings.showTranslation}
          onchange={ontoggletranslation}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <!-- Virtual Keyboard Section -->
      <div class="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
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
              <span class="text-gray-600 dark:text-gray-400">Show keyboard hints</span>
              <input
                type="checkbox"
                checked={settings.showKeyboardHint}
                onchange={ontogglekeyboardhint}
                class="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
              />
            </label>
          </div>
        {/if}
      </div>

      <!-- Target Text Size Slider & Lock Toggle -->
      <div class="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <span class="font-bold text-gray-900 dark:text-gray-100">Typography Sizing</span>
          <label
            class="flex items-center gap-1.5 cursor-pointer text-[11px] text-gray-500 dark:text-gray-400"
          >
            <input
              type="checkbox"
              checked={settings.lockFontSize}
              onchange={ontogglelockfontsize}
              class="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
            />
            <span>Lock Size</span>
          </label>
        </div>

        <div class="flex flex-col gap-2 mt-1 pl-2">
          {#if settings.lockFontSize}
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="text-gray-600 dark:text-gray-400">Font size</span>
                <span
                  class="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800"
                >
                  {minVal}rem
                </span>
              </div>
              <div class="pl-2">
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
                <span class="text-gray-600 dark:text-gray-400">Min & max font size</span>
                <span
                  class="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800"
                >
                  {minVal}rem – {maxVal}rem
                </span>
              </div>

              <div class="pl-2">
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
        {onvoicechange}
        {onspeedchange}
        {onclearttscache}
      />
    </div>
  {/if}
</div>
