<script lang="ts">
  import type { TutorSettings, ThemeMode } from './settings';

  interface Props {
    isOpen: boolean;
    settings: TutorSettings;
    ontogglesettings: (e?: MouseEvent) => void;
    onclose: () => void;
    onthemechange: (theme: ThemeMode) => void;
    ontogglepronunciation: () => void;
    ontoggletranslation: () => void;
    ontogglevirtualkeyboard: () => void;
  }

  let {
    isOpen,
    settings,
    ontogglesettings,
    onclose,
    onthemechange,
    ontogglepronunciation,
    ontoggletranslation,
    ontogglevirtualkeyboard
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

<div class="relative flex items-center gap-2">
  <button
    type="button"
    onclick={ontogglesettings}
    onmousedown={(e) => e.stopPropagation()}
    class="settings-btn flex items-center gap-1.5 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg px-3 py-1.5 hover:border-blue-600 dark:hover:border-blue-500 focus:outline-none shadow-sm text-sm cursor-pointer"
    aria-label="Settings"
  >
    <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
    <span class="hidden sm:inline">Settings</span>
  </button>

  {#if isOpen}
    <div
      tabindex="-1"
      role="region"
      aria-label="Display Settings Panel"
      class="settings-modal absolute right-0 top-11 z-50 w-64 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-xl p-4 flex flex-col gap-3"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
      onmousedown={(e) => e.stopPropagation()}
    >
      <div class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 font-mono pb-1 border-b border-gray-100 dark:border-gray-700">
        Display Settings
      </div>
      
      <label class="flex items-center justify-between cursor-pointer select-none text-sm font-semibold text-gray-700 dark:text-gray-200">
        <span>Theme</span>
        <select
          value={settings.theme}
          onchange={handleSelectTheme}
          class="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-600 cursor-pointer"
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </label>

      <label class="flex items-center justify-between cursor-pointer select-none text-sm font-semibold text-gray-700 dark:text-gray-200">
        <span>Show Pronunciation</span>
        <input
          type="checkbox"
          checked={settings.showPronunciation}
          onchange={ontogglepronunciation}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <label class="flex items-center justify-between cursor-pointer select-none text-sm font-semibold text-gray-700 dark:text-gray-200">
        <span>Show Translation</span>
        <input
          type="checkbox"
          checked={settings.showTranslation}
          onchange={ontoggletranslation}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <label class="flex items-center justify-between cursor-pointer select-none text-sm font-semibold text-gray-700 dark:text-gray-200">
        <span>Show Virtual Keyboard</span>
        <input
          type="checkbox"
          checked={settings.showVirtualKeyboard}
          onchange={ontogglevirtualkeyboard}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>
    </div>
  {/if}
</div>
