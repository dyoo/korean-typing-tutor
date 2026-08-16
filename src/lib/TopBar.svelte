<script lang="ts">
  import SettingsModal from './SettingsModal.svelte';
  import GitHubLink from './GitHubLink.svelte';
  import ModeSwitcher from './ModeSwitcher.svelte';
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
    activeLearningCombination?: [string, string];
    activeJamoProgress?: number;
    showSettingsModal: boolean;
    settings: TutorSettings;
    ontogglemode: () => void;
    ontogglecurriculum: (e?: MouseEvent) => void;
    ontogglemastery: (e?: MouseEvent) => void;
    ontogglesettings: (e?: MouseEvent) => void;
    onclosesettings: () => void;
    onthemechange: (theme: ThemeMode) => void;
    ontogglepronunciation: () => void;
    ontoggletranslation: () => void;
    ontogglevirtualkeyboard: () => void;
    ontogglekeyboardhint: () => void;
    onminfontsizechange: (minFontSizeRem: number) => void;
    onmaxfontsizechange: (maxFontSizeRem: number) => void;
    ontogglelockfontsize: () => void;
    oncursorcolorchange: (cursorColor: CursorColorMode) => void;
    ontoggletts?: () => void;
    ontoggleautospeak?: () => void;
    onvoicechange?: (voice: string) => void;
    onspeedchange?: (speed: number) => void;
    onclearttscache?: () => void;
  }

  let {
    mode,
    enabledModuleCount,
    totalModuleCount,
    masteryUnlockedCount,
    masteryTotalCount,
    activeJamoChar = null,
    activeLearningCombination,
    activeJamoProgress = 0,
    showSettingsModal,
    settings,
    ontogglemode,
    ontogglecurriculum,
    ontogglemastery,
    ontogglesettings,
    onclosesettings,
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
    ontoggleautospeak,
    onvoicechange,
    onspeedchange,
    onclearttscache,
  }: Props = $props();
</script>

<div class="w-full max-w-7xl flex items-center justify-between gap-4 shrink-0">
  <div class="relative flex items-center gap-3">
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
      <button
        type="button"
        onclick={ontogglemastery}
        onmousedown={(e) => e.stopPropagation()}
        class="flex items-center gap-2.5 bg-white dark:bg-gray-800 border-2 border-amber-300 dark:border-amber-700/60 text-gray-800 dark:text-gray-200 font-semibold rounded-lg px-3 py-1.5 hover:border-amber-600 dark:hover:border-amber-500 focus:outline-none shadow-sm text-sm cursor-pointer"
        aria-label="Open Mastery Progress Sidebar"
      >
        <svg
          class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0"
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
          Jamos Unlocked
        </span>
        <span
          class="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800"
        >
          {masteryUnlockedCount}/{masteryTotalCount}
        </span>
        {#if activeJamoChar}
          <div
            class="flex items-center gap-1.5 pl-1.5 border-l border-amber-200 dark:border-amber-800/80"
          >
            <span
              class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline"
            >
              Focus:
            </span>
            <span
              class="relative overflow-hidden text-base sm:text-lg font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700 leading-none flex items-center justify-center min-w-[28px] shadow-2xs gap-1"
            >
              {#if activeJamoProgress > 0}
                <div
                  class="absolute bottom-0 inset-x-0 pointer-events-none {activeJamoProgress >= 100
                    ? 'bg-emerald-500/25 dark:bg-emerald-400/25'
                    : 'bg-amber-400/30 dark:bg-amber-400/25'}"
                  style="height: {activeJamoProgress}%;"
                ></div>
              {/if}
              <span class="relative z-10">{activeJamoChar}</span>
              {#if activeLearningCombination}
                <span
                  class="relative z-10 text-[11px] font-medium text-amber-600/90 dark:text-amber-400/90"
                >
                  ({activeLearningCombination[0]}+{activeLearningCombination[1]})
                </span>
              {/if}
            </span>
          </div>
        {/if}
      </button>
    {/if}
  </div>

  <div class="flex items-center gap-2">
    <GitHubLink />

    <ModeSwitcher {mode} {ontogglemode} />

    <SettingsModal
      isOpen={showSettingsModal}
      {settings}
      {ontogglesettings}
      onclose={onclosesettings}
      {onthemechange}
      {ontogglepronunciation}
      {ontoggletranslation}
      {ontogglevirtualkeyboard}
      {ontogglekeyboardhint}
      onminfontsizechange={onminfontsizechange}
      onmaxfontsizechange={onmaxfontsizechange}
      ontogglelockfontsize={ontogglelockfontsize}
      oncursorcolorchange={oncursorcolorchange}
      {ontoggletts}
      {ontoggleautospeak}
      {onvoicechange}
      {onspeedchange}
      {onclearttscache}
    />
  </div>
</div>
