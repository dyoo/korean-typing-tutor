<script lang="ts">
  import SettingsModal from './SettingsModal.svelte';
  import type { TutorSettings, ThemeMode } from './settings';
  import type { CursorColorMode } from '../utils/cursorColor';
  import type { TutorMode } from '../types/mastery';

  interface Props {
    mode: TutorMode;
    enabledModuleCount: number;
    totalModuleCount: number;
    masteryUnlockedCount: number;
    masteryTotalCount: number;
    activeJamoChar?: string | null;
    showSettingsModal: boolean;
    settings: TutorSettings;
    ontogglemode: () => void;
    ontogglecurriculum: (e?: MouseEvent) => void;
    ontogglesettings: (e: MouseEvent) => void;
    onclosesettings: () => void;
    onthemechange: (theme: ThemeMode) => void;
    ontogglepronunciation: () => void;
    ontoggletranslation: () => void;
    ontogglevirtualkeyboard: () => void;
    onminfontsizechange: (minFontSizeRem: number) => void;
    onmaxfontsizechange: (maxFontSizeRem: number) => void;
    ontogglelockfontsize: () => void;
    oncursorcolorchange: (cursorColor: CursorColorMode) => void;
    onmasterylevelchange?: (level: number) => void;
  }

  let {
    mode,
    enabledModuleCount,
    totalModuleCount,
    masteryUnlockedCount,
    masteryTotalCount,
    activeJamoChar = null,
    showSettingsModal,
    settings,
    ontogglemode,
    ontogglecurriculum,
    ontogglesettings,
    onclosesettings,
    onthemechange,
    ontogglepronunciation,
    ontoggletranslation,
    ontogglevirtualkeyboard,
    onminfontsizechange,
    onmaxfontsizechange,
    ontogglelockfontsize,
    oncursorcolorchange,
    onmasterylevelchange,
  }: Props = $props();
</script>

<div class="w-full max-w-7xl flex items-center justify-between gap-4 shrink-0">
  <div class="relative flex items-center gap-3">
    <!-- Mode Switcher Toggle Button -->
    <div class="flex items-center bg-gray-200 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-300 dark:border-gray-700">
      <button
        type="button"
        onclick={() => {
          if (mode !== 'curriculum') ontogglemode();
        }}
        class="px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer {mode === 'curriculum'
          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
      >
        Free-form
      </button>
      <button
        type="button"
        onclick={() => {
          if (mode !== 'mastery') ontogglemode();
        }}
        class="px-2.5 py-1 text-xs font-bold rounded-md transition-colors cursor-pointer {mode === 'mastery'
          ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
      >
        Mastery
      </button>
    </div>

    {#if mode === 'curriculum'}
      <button
        type="button"
        onclick={ontogglecurriculum}
        onmousedown={(e) => e.stopPropagation()}
        class="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg px-3 py-1.5 hover:border-blue-600 dark:hover:border-blue-500 focus:outline-none shadow-sm text-sm cursor-pointer"
        aria-label="Open Free-form Modules Sidebar"
      >
        <svg
          class="w-5 h-5 text-gray-600 dark:text-gray-300 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <span
          class="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 hidden sm:inline"
        >
          Modules
        </span>
        <span
          class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800"
        >
          {enabledModuleCount}/{totalModuleCount}
        </span>
      </button>
    {:else}
      <!-- Mastery Mode Progress Badge -->
      <div
        class="flex items-center gap-2.5 bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-700/60 text-gray-800 dark:text-gray-200 font-semibold rounded-lg px-3 py-1.5 shadow-sm text-sm"
      >
        <span class="font-bold text-xs uppercase tracking-wider text-gray-700 dark:text-gray-300 hidden sm:inline">
          Jamos Unlocked
        </span>
        <span
          class="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800"
        >
          {masteryUnlockedCount}/{masteryTotalCount}
        </span>
        {#if activeJamoChar}
          <div class="flex items-center gap-1.5 pl-1.5 border-l border-amber-200 dark:border-amber-800/80">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">
              Focus:
            </span>
            <span
              class="text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 leading-none flex items-center justify-center min-w-[28px] shadow-2xs"
            >
              {activeJamoChar}
            </span>
          </div>
        {/if}
      </div>
    {/if}
  </div>

  <SettingsModal
    isOpen={showSettingsModal}
    {settings}
    {masteryUnlockedCount}
    {ontogglesettings}
    onclose={onclosesettings}
    {onthemechange}
    {ontogglepronunciation}
    {ontoggletranslation}
    {ontogglevirtualkeyboard}
    {onminfontsizechange}
    {onmaxfontsizechange}
    {ontogglelockfontsize}
    {oncursorcolorchange}
    {onmasterylevelchange}
  />
</div>
