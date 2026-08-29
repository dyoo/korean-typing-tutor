<script lang="ts">
  import { onMount } from 'svelte';
  import { settingsStore } from './settings.svelte';
  import { ttsController } from '../utils/ttsController.svelte';

  let nativeVoices = $derived(ttsController.nativeVoices);
  let isSelectedVoiceOffline = $derived(ttsController.isVoiceOffline(settingsStore.current.ttsVoice));

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
        checked={settingsStore.current.enableTTS}
        onchange={() => {
          if (settingsStore.current.enableTTS) {
            ttsController.stopAudio();
          }
          settingsStore.toggle('enableTTS');
        }}
        class="w-4 h-4 text-blue-600 rounded cursor-pointer"
      />
      <span>Enable</span>
    </label>
  </div>

  {#if settingsStore.current.enableTTS}
    <div class="flex flex-col gap-2.5 mt-1 pl-2">
      <!-- Speak On Completion Toggle -->
      <label class="flex items-center justify-between cursor-pointer">
        <span class="text-xs text-gray-600 dark:text-gray-400">Speak on completion</span>
        <input
          type="checkbox"
          checked={settingsStore.current.speakOnCompletion}
          onchange={() => settingsStore.toggle('speakOnCompletion')}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <!-- Speak On Appearance Toggle -->
      <label class="flex items-center justify-between cursor-pointer">
        <span class="text-xs text-gray-600 dark:text-gray-400">Speak on appearance</span>
        <input
          type="checkbox"
          checked={settingsStore.current.speakOnAppearance}
          onchange={() => settingsStore.toggle('speakOnAppearance')}
          class="w-4 h-4 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <!-- Native OS Voice Selection -->
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between">
          <label for="tts-voice-select" class="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            Voice
          </label>
          {#if nativeVoices.length > 0}
            <select
              id="tts-voice-select"
              value={settingsStore.current.ttsVoice || nativeVoices[0]?.id || ''}
              onchange={(e) => settingsStore.update('ttsVoice', (e.target as HTMLSelectElement).value)}
              class="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-1.5 text-xs max-w-[210px] truncate focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              {#each nativeVoices as v}
                <option value={v.id}>
                  {v.name} ({v.localService ? 'Offline' : 'Online'})
                </option>
              {/each}
            </select>
          {:else}
            <span class="text-xs text-gray-500 dark:text-gray-400 italic">
              Default OS Voice
            </span>
          {/if}
        </div>

        {#if nativeVoices.length > 0 && !isSelectedVoiceOffline}
          <p class="text-[11px] text-amber-600 dark:text-amber-400 italic text-right">
            Online voice: requires internet connection
          </p>
        {/if}
      </div>

      {#if nativeVoices.length === 0}
        <!-- OS Voice Setup Guide Banner -->
        <div class="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-lg text-left text-xs">
          <p class="font-semibold text-amber-800 dark:text-amber-300 mb-1">
            No Korean voice detected on this device
          </p>
          <p class="text-amber-700 dark:text-amber-400 text-[11px] leading-relaxed mb-1.5">
            To enable free on-device speech, install a Korean voice in your operating system:
          </p>
          <ul class="space-y-1 text-[11px] text-amber-700 dark:text-amber-400 list-disc list-inside">
            <li><strong>Mac/iOS</strong>: System Settings → Accessibility → Spoken Content → Korean (Yuna)</li>
            <li><strong>Windows</strong>: Settings → Time & Language → Speech → Add voices</li>
            <li><strong>Android</strong>: Settings → Accessibility → Text-to-speech → Install voice data</li>
          </ul>
        </div>
      {/if}

      <!-- Playback Speed Slider -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="text-xs text-gray-600 dark:text-gray-400">Speed</span>
          <span
            class="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800"
          >
            {settingsStore.current.ttsSpeed ?? 1.0}x
          </span>
        </div>
        <div class="pl-1 pt-1">
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={settingsStore.current.ttsSpeed ?? 1.0}
            oninput={(e) => settingsStore.update('ttsSpeed', parseFloat((e.target as HTMLInputElement).value))}
            class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
          />
        </div>
      </div>
    </div>
  {/if}
</div>
