<script lang="ts">
  import SettingsModal from './SettingsModal.svelte';
  import type { TutorSettings, ThemeMode } from './settings';
  import type { CursorColorMode } from '../utils/cursorColor';

  interface Props {
    enabledModuleCount: number;
    totalModuleCount: number;
    showSettingsModal: boolean;
    settings: TutorSettings;
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
  }

  let {
    enabledModuleCount,
    totalModuleCount,
    showSettingsModal,
    settings,
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
  }: Props = $props();
</script>

<div class="w-full max-w-7xl flex items-center justify-between gap-4 shrink-0">
  <div class="relative flex items-center gap-3">
    <button
      type="button"
      onclick={ontogglecurriculum}
      onmousedown={(e) => e.stopPropagation()}
      class="flex items-center gap-2 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg px-3 py-1.5 hover:border-blue-600 dark:hover:border-blue-500 focus:outline-none shadow-sm text-sm cursor-pointer"
      aria-label="Open Curriculum Sidebar"
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
        Curriculum
      </span>
      <span
        class="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800"
      >
        {enabledModuleCount}/{totalModuleCount}
      </span>
    </button>
  </div>

  <SettingsModal
    isOpen={showSettingsModal}
    {settings}
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
  />
</div>
