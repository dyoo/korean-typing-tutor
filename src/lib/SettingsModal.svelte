<script lang="ts">
  import type { TutorSettings, ThemeMode } from './settings';
  import type { CursorColorMode } from '../utils/cursorColor';
  import CursorColorSelect from './CursorColorSelect.svelte';
  import TTSSettingsControl from './TTSSettingsControl.svelte';
  import TypographySettingsControl from './TypographySettingsControl.svelte';
  import SpeedSettingsControl from './SpeedSettingsControl.svelte';

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

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      onclose();
    }
  }

  function handleSelectTheme(e: Event) {
    const val = (e.target as HTMLSelectElement).value as ThemeMode;
    onthemechange(val);
  }
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
    <TypographySettingsControl
      {settings}
      {ontogglelockfontsize}
      {onminfontsizechange}
      {onmaxfontsizechange}
    />

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
    <SpeedSettingsControl
      {settings}
      {ontogglekpm}
      {onresetkpm}
    />
  </div>
{/if}
