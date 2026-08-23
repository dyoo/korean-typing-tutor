<script lang="ts">
  import { onMount } from 'svelte';
  import type { TutorSettings } from './settings';
  import { ttsController } from '../utils/ttsController.svelte';

  interface Props {
    settings: TutorSettings;
    ontoggletts?: () => void;
    onenginechange?: (engine: 'native' | 'kokoro') => void;
    ontogglespeakoncompletion?: () => void;
    ontogglespeakonappearance?: () => void;
    onvoicechange?: (voice: string) => void;
    onnativevoicechange?: (voiceURI: string) => void;
    onspeedchange?: (speed: number) => void;
    onclearttscache?: () => void;
  }

  let {
    settings,
    ontoggletts,
    onenginechange,
    ontogglespeakoncompletion,
    ontogglespeakonappearance,
    onvoicechange,
    onnativevoicechange,
    onspeedchange,
    onclearttscache,
  }: Props = $props();

  let isConfirmingClear = $state(false);
  let hasCache = $derived(ttsController.isCached || ttsController.isLoaded);
  let cacheSizeText = $derived(ttsController.modelSizeFormatted || '~100 MB');
  let nativeVoices = $derived(ttsController.nativeVoices);
  let isNative = $derived((settings.ttsEngine ?? 'native') === 'native');

  onMount(() => {
    ttsController.refreshNativeVoices();
    ttsController.checkCache(true);
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
      <!-- Engine Selection (System vs Neural Kokoro) -->
      <div class="flex flex-col gap-1.5">
        <label for="tts-engine-select" class="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Speech Engine
        </label>
        <div class="grid grid-cols-2 gap-1.5 p-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onclick={() => onenginechange?.('native')}
            class="py-1.5 px-2 text-xs font-medium rounded-md transition-all cursor-pointer {isNative ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
          >
            System Voice (Instant)
          </button>
          <button
            type="button"
            onclick={() => onenginechange?.('kokoro')}
            class="py-1.5 px-2 text-xs font-medium rounded-md transition-all cursor-pointer {!isNative ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-2xs font-bold' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}"
          >
            Neural Kokoro-82M
          </button>
        </div>
      </div>

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

      {#if isNative}
        <!-- Native OS Voice Selection -->
        <div class="flex items-center justify-between">
          <label for="tts-native-voice-select" class="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            System Voice
          </label>
          {#if nativeVoices.length > 0}
            <select
              id="tts-native-voice-select"
              value={settings.ttsNativeVoice || nativeVoices[0]?.id || ''}
              onchange={(e) => onnativevoicechange?.((e.target as HTMLSelectElement).value)}
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
      {:else}
        <!-- Kokoro Neural Voice Selection -->
        <div class="flex items-center justify-between">
          <label for="tts-voice-select" class="text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
            Neural Persona
          </label>
          <select
            id="tts-voice-select"
            value={settings.ttsVoice ?? 'jm_kumo'}
            onchange={(e) => onvoicechange?.((e.target as HTMLSelectElement).value)}
            class="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            <option value="jf_nezumi">Nezumi (Female, CJK)</option>
            <option value="jf_tebukuro">Tebukuro (Female, CJK)</option>
            <option value="jm_kumo">Kumo (Male, CJK)</option>
            <option value="zf_xiaobei">Xiaobei (Female, CJK)</option>
            <option value="zm_yunjian">Yunjian (Male, CJK)</option>
          </select>
        </div>
      {/if}

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

  {#if hasCache}
    <div class="flex flex-col gap-2 mt-1">
      <!-- Clear Cache Action & Confirmation -->
      {#if isConfirmingClear}
        <div
          class="flex flex-col gap-2 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-lg text-left"
        >
          <p class="text-xs text-red-700 dark:text-red-300 font-medium leading-normal break-words">
            Delete offline voice cache ({cacheSizeText})?
          </p>
          <div class="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onclick={() => (isConfirmingClear = false)}
              class="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick={() => {
                isConfirmingClear = false;
                onclearttscache?.();
              }}
              class="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white font-medium rounded cursor-pointer transition-colors"
            >
              Delete Cache
            </button>
          </div>
        </div>
      {:else}
        <div class="flex justify-end">
          <button
            type="button"
            onclick={() => (isConfirmingClear = true)}
            class="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer text-right leading-tight break-words"
          >
            Clear Offline Neural Voice Cache ({cacheSizeText})
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
