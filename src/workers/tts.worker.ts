import { KoreanSpeaker } from '@dannyyoo/korean-kokoro';
import type { SpeakerProgress } from '@dannyyoo/korean-kokoro';
import type { TTSWorkerRequest, TTSWorkerResponse, VoiceMetadata } from '../types/tts';

/**
 * Dedicated Web Worker for Kokoro-82M TTS synthesis.
 * Handles ONNX Runtime Web model loading, phonetic IPA transcription,
 * and audio generation off the main UI thread.
 */

let speaker: KoreanSpeaker | null = null;
let isModelLoaded = false;

// Fallback voice metadata in case speaker.getVoices() is called
const FALLBACK_VOICES: VoiceMetadata[] = [
  {
    id: 'jf_nezumi',
    name: 'Nezumi',
    lang: 'ja',
    gender: 'Female',
    traits: 'Clear, rhythmic, ideal for Korean syllables',
  },
  {
    id: 'jf_tebukuro',
    name: 'Tebukuro',
    lang: 'ja',
    gender: 'Female',
    traits: 'Calm, soft tone',
  },
  {
    id: 'jm_kumo',
    name: 'Kumo',
    lang: 'ja',
    gender: 'Male',
    traits: 'Deep, steady tone',
  },
  {
    id: 'zf_xiaobei',
    name: 'Xiaobei',
    lang: 'zh',
    gender: 'Female',
    traits: 'Bright, articulated tone',
  },
  {
    id: 'zm_yunjian',
    name: 'Yunjian',
    lang: 'zh',
    gender: 'Male',
    traits: 'Resonant, crisp pronunciation',
  },
];

function postResponse(response: TTSWorkerResponse): void {
  self.postMessage(response);
}

/**
 * Handle incoming messages from the main thread.
 */
self.onmessage = async (event: MessageEvent<TTSWorkerRequest>) => {
  const message = event.data;

  switch (message.type) {
    case 'CHECK_CACHE': {
      try {
        const tempSpeaker = speaker ?? new KoreanSpeaker({ dtype: 'q8', device: 'wasm' });
        const storageInfo = await tempSpeaker.getStorageInfo();
        postResponse({
          type: 'CACHE_STATUS',
          payload: {
            isCached: storageInfo.isCached,
            modelSizeFormatted: storageInfo.modelSizeFormatted,
          },
        });
      } catch {
        postResponse({
          type: 'CACHE_STATUS',
          payload: { isCached: false },
        });
      }
      break;
    }

    case 'LOAD_MODEL': {
      try {
        if (isModelLoaded && speaker) {
          postResponse({
            type: 'LOAD_SUCCESS',
            payload: {
              voices: (speaker.getVoices() as VoiceMetadata[]) || FALLBACK_VOICES,
            },
          });
          return;
        }

        const dtype = message.payload?.dtype ?? 'q8';
        const device = message.payload?.device ?? 'wasm';

        speaker = new KoreanSpeaker({ dtype, device });

        await speaker.load({
          progressCallback: (progress: SpeakerProgress) => {
            const file = 'file' in progress ? (progress.file ?? '') : '';
            const percent = 'progress' in progress ? (progress.progress ?? 0) : 0;
            const status = progress.status;

            postResponse({
              type: 'LOAD_PROGRESS',
              payload: {
                file,
                progress: percent,
                status,
              },
            });
          },
        });

        isModelLoaded = true;
        const voices = (speaker.getVoices() as VoiceMetadata[]) || FALLBACK_VOICES;

        postResponse({
          type: 'LOAD_PROGRESS',
          payload: {
            file: 'voices',
            progress: 100,
            status: 'Preloading voice profiles...',
          },
        });

        // Preload and cache all voice vector embeddings so first playback is instant
        const voiceIds = voices.map((v) => v.id);
        await speaker.preloadVoices(voiceIds);

        postResponse({
          type: 'LOAD_SUCCESS',
          payload: { voices },
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        postResponse({
          type: 'LOAD_ERROR',
          payload: { error: errorMsg },
        });
      }
      break;
    }

    case 'SYNTHESIZE': {
      const { id, text, voice = 'jm_kumo', speed = 1.0 } = message.payload;
      try {
        if (!speaker || !isModelLoaded) {
          throw new Error('TTS Model is not loaded yet');
        }

        const result = await speaker.synthesize({
          text,
          voice,
          speed,
        });

        const audioBlob = result.toWavBlob();
        const audioBlobUrl = URL.createObjectURL(audioBlob);

        postResponse({
          type: 'SYNTHESIS_SUCCESS',
          payload: {
            id,
            audioBlobUrl,
            genTimeMs: result.genTimeMs,
            durationSec: result.durationSec,
            ipa: result.ipa,
          },
        });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        postResponse({
          type: 'SYNTHESIS_ERROR',
          payload: { id, error: errorMsg },
        });
      }
      break;
    }

    case 'CLEAR_CACHE': {
      try {
        if (speaker) {
          await speaker.clearStorage();
          speaker.dispose();
          speaker = null;
          isModelLoaded = false;
        } else {
          const tempSpeaker = new KoreanSpeaker({ dtype: 'q8', device: 'wasm' });
          await tempSpeaker.clearStorage();
        }
        postResponse({ type: 'CLEAR_CACHE_SUCCESS' });
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        postResponse({
          type: 'CLEAR_CACHE_ERROR',
          payload: { error: errorMsg },
        });
      }
      break;
    }
  }
};
