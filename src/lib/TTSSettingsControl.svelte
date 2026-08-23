<script lang="ts">
  import { onMount } from 'svelte';
  import type { TutorSettings } from './settings';
  import { ttsController } from '../utils/ttsController.svelte';

  interface Props {
    settings: TutorSettings;
    ontoggletts?: () => void;
    ontogglespeakoncompletion?: () => void;
    ontogglespeakonappearance?: () => void;
    onvoicechange?: (voice: string) => void;
    onspeedchange?: (speed: number) => void;
  }

  let {
    settings,
    ontoggletts,
    ontogglespeakoncompletion,
    ontogglespeakonappearance,
    onvoicechange,
    onspeedchange,
  }: Props = $props();

  let nativeVoices = $derived(ttsController.nativeVoices);

  onMount(() => {
    ttsController.refreshNativeVoices();
  });
</script>

<div class="flex flex-col gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
  <div class="flex items-center justify-between">
    <span class="font-bold text-gray-900 dark:text-gray-100">Voice Synthesis (TTS)</span>
    <label class="flex items-center gap-1.5 cursor-pointer">
      <input
        type="checkbox"
        checked={settings.enableTTS}
        onchange={(e) => {
          e.currentTarget.checked = !!settings.enableTTS;
          ontoggletts?.();
        }}
        class="w-4 h-4 text-blue-600 rounded cursor-pointer"
      />
      <span>Enable</span>
    </label>
  </div>

  {#if settings.enableTTS}
    <div class="flex flex-col gap-2.5 mt-1 pl-2">
      <!-- Speak On Completion Toggle -->
      <label class="flex items-center justify-between cursor-pointer">
        <span class="text-xs text-gray-600 dark:text-gray-400">Speak on completion</span>
        <input
          type="checkbox"
          checked={settings.speakOnCompletion}
          onchange={ontogglespeakoncompletion}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <!-- Speak On Appearance Toggle -->
      <label class="flex items-center justify-between cursor-pointer">
        <span class="text-xs text-gray-600 dark:text-gray-400">Speak on appearance</span>
        <input
          type="checkbox"
          checked={settings.speakOnAppearance}
          onchange={ontogglespeakonappearance}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <!-- Native OS Voice Selection -->
      <div class="flex items-center justify-between">
        <label for="tts-voice-select" class="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
          Voice
        </label>
        {#if nativeVoices.length > 0}
          <select
            id="tts-voice-select"
            value={settings.ttsVoice || nativeVoices[0]?.id || ''}
            onchange={(e) => onvoicechange?.((e.target as HTMLSelectElement).value)}
            class="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 text-xs max-w-[200px] truncate focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            {#each nativeVoices as v}
              <option value={v.id}>{v.name}</option>
            {/each}
          </select>
        {:else}
          <span class="text-xs text-gray-500 dark:text-gray-400 italic">
            Default OS Korean Voice
          </span>
        {/if}
      </div>

      <!-- Playback Speed Slider -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-600 dark:text-gray-400">Speed</span>
          <span
            class="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800"
          >
            {settings.ttsSpeed ?? 1.0}x
          </span>
        </div>
        <div class="pl-1 pt-1">
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={settings.ttsSpeed ?? 1.0}
            oninput={(e) => onspeedchange?.(parseFloat((e.target as HTMLInputElement).value))}
            class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
          />
        </div>
      </div>
    </div>
  {/if}
</div>
