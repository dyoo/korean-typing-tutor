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
    onclearttscache?: () => void;
  }

  let {
    settings,
    ontoggletts,
    ontogglespeakoncompletion,
    ontogglespeakonappearance,
    onvoicechange,
    onspeedchange,
    onclearttscache,
  }: Props = $props();

  let isConfirmingClear = $state(false);
  let hasCache = $derived(ttsController.getIsCached() || ttsController.getIsLoaded());
  let cacheSizeText = $derived(ttsController.getModelSizeFormatted() || '~100 MB');

  onMount(() => {
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
    <div class="flex flex-col gap-2 mt-1 pl-2">
      <!-- Speak On Completion Toggle -->
      <label class="flex items-center justify-between cursor-pointer">
        <span class="text-gray-600 dark:text-gray-400">Speak on completion</span>
        <input
          type="checkbox"
          checked={settings.speakOnCompletion}
          onchange={ontogglespeakoncompletion}
          class="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <!-- Speak On Appearance Toggle -->
      <label class="flex items-center justify-between cursor-pointer">
        <span class="text-gray-600 dark:text-gray-400">Speak on appearance</span>
        <input
          type="checkbox"
          checked={settings.speakOnAppearance}
          onchange={ontogglespeakonappearance}
          class="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
        />
      </label>

      <!-- Voice Selection -->
      <div class="flex items-center justify-between">
        <label for="tts-voice-select" class="text-gray-600 dark:text-gray-400 cursor-pointer">
          Voice
        </label>
        <select
          id="tts-voice-select"
          value={settings.ttsVoice ?? 'jf_nezumi'}
          onchange={(e) => onvoicechange?.((e.target as HTMLSelectElement).value)}
          class="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg px-2 py-0.5 text-xs focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
        >
          <option value="jf_nezumi">Nezumi (Female, CJK)</option>
          <option value="jf_tebukuro">Tebukuro (Female, CJK)</option>
          <option value="jm_kumo">Kumo (Male, CJK)</option>
          <option value="zf_xiaobei">Xiaobei (Female, CJK)</option>
          <option value="zm_yunjian">Yunjian (Male, CJK)</option>
        </select>
      </div>

      <!-- Playback Speed Slider -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <span class="text-gray-600 dark:text-gray-400">Speed</span>
          <span
            class="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800"
          >
            {settings.ttsSpeed ?? 1.0}x
          </span>
        </div>
        <div class="pl-2">
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={settings.ttsSpeed ?? 1.0}
            oninput={(e) => onspeedchange?.(parseFloat((e.target as HTMLInputElement).value))}
            class="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
          />
        </div>
      </div>
    </div>
  {:else if hasCache}
    <div class="flex flex-col gap-2 mt-1">
      <!-- Clear Cache Action & Confirmation -->
      {#if isConfirmingClear}
        <div
          class="flex flex-col gap-2 p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-lg text-left"
        >
          <p class="text-[11px] text-red-700 dark:text-red-300 font-medium leading-normal break-words">
            Delete offline voice cache ({cacheSizeText})?
          </p>
          <div class="flex items-center justify-end gap-2 pt-0.5">
            <button
              type="button"
              onclick={() => (isConfirmingClear = false)}
              class="px-2.5 py-1 text-[11px] bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onclick={() => {
                isConfirmingClear = false;
                onclearttscache?.();
              }}
              class="px-2.5 py-1 text-[11px] bg-red-600 hover:bg-red-700 text-white font-medium rounded cursor-pointer transition-colors"
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
            class="text-[11px] text-red-600 dark:text-red-400 hover:underline cursor-pointer text-right leading-tight break-words"
          >
            Clear Offline Voice Cache ({cacheSizeText})
          </button>
        </div>
      {/if}
    </div>
  {/if}
</div>
