import { KoreanSpeaker, type SpeakerProgress, type SynthesisTask } from 'korean-tts';
import type { TTSWorkerRequest, TTSWorkerResponse, VoiceMetadata } from '../types/tts';

/**
 * Dedicated Web Worker for Kokoro-82M TTS synthesis.
 * Handles ONNX Runtime Web model loading, phonetic IPA transcription,
 * and audio generation off the main UI thread.
 */

let speaker: KoreanSpeaker | null = null;
let isModelLoaded = false;
const activeTasks = new Map<string, SynthesisTask>();

interface PendingSynthesisRequest {
  id: string;
  text: string;
  voice: string;
  speed: number;
}

const synthesisQueue: PendingSynthesisRequest[] = [];
let isProcessingQueue = false;

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
 * Sequentially process pending synthesis requests with cooperative yielding to allow
 * cancellation messages in the worker event queue to be processed before heavy WASM inference starts.
 */
async function processSynthesisQueue(): Promise<void> {
  if (isProcessingQueue) {
    return;
  }
  isProcessingQueue = true;

  try {
    while (synthesisQueue.length > 0) {
      // Cooperative yield to the macro-task event loop so any incoming CANCEL_SYNTHESIS
      // or other messages queued in the worker event loop are processed before starting heavy WASM compute
      await new Promise<void>((resolve) => setTimeout(resolve, 0));

      if (synthesisQueue.length === 0) {
        break;
      }

      const req = synthesisQueue.shift()!;
      const { id, text, voice, speed } = req;

      try {
        if (!speaker || !isModelLoaded) {
          throw new Error('TTS Model is not loaded yet');
        }

        const task = speaker.synthesize({
          text,
          voice,
          speed,
        });
        activeTasks.set(id, task);

        const result = await task;
        activeTasks.delete(id);

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
        activeTasks.delete(id);
        const isCancelled =
          (typeof err === 'object' &&
            err !== null &&
            'isCancelled' in err &&
            Boolean((err as { isCancelled?: boolean }).isCancelled)) ||
          (err instanceof Error &&
            (err.name === 'AbortError' || err.message.includes('cancelled'))) ||
          String(err).includes('cancelled');

        if (isCancelled) {
          postResponse({
            type: 'SYNTHESIS_CANCELLED',
            payload: { id },
          });
        } else {
          const errorMsg = err instanceof Error ? err.message : String(err);
          postResponse({
            type: 'SYNTHESIS_ERROR',
            payload: { id, error: errorMsg },
          });
        }
      }
    }
  } finally {
    isProcessingQueue = false;
  }
}

function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) {
    return '0 B';
  }
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Directly inspects CacheStorage inside the Web Worker context where window is undefined.
 */
async function inspectWorkerStorage(): Promise<{ isCached: boolean; modelSizeFormatted: string }> {
  let isCached = false;
  let modelSizeBytes = 0;

  if (typeof caches !== 'undefined') {
    for (const cacheName of ['transformers-cache', 'kokoro-voices', 'onnx-wasm-runtime']) {
      try {
        if (await caches.has(cacheName)) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          for (const req of keys) {
            if (
              req.url.includes('Kokoro-82M') ||
              req.url.includes('kokoro') ||
              req.url.includes('.onnx') ||
              req.url.includes('.wasm') ||
              req.url.includes('voices')
            ) {
              isCached = true;
              const res = await cache.match(req);
              if (res) {
                const blob = await res.clone().blob();
                modelSizeBytes += blob.size;
              }
            }
          }
        }
      } catch {
        // Ignore cache inspection errors
      }
    }
  }

  return {
    isCached,
    modelSizeFormatted: formatBytes(modelSizeBytes),
  };
}

/**
 * Directly removes cached neural model files and runtime WASM binary from CacheStorage.
 */
async function clearWorkerStorage(): Promise<void> {
  if (typeof caches !== 'undefined') {
    for (const cacheName of ['transformers-cache', 'kokoro-voices', 'onnx-wasm-runtime']) {
      try {
        await caches.delete(cacheName);
      } catch {
        // Ignore cache deletion errors
      }
    }
  }
}

/**
 * Handle incoming messages from the main thread.
 */
self.onmessage = async (event: MessageEvent<TTSWorkerRequest>) => {
  const message = event.data;

  switch (message.type) {
    case 'CHECK_CACHE': {
      try {
        const storageInfo = await inspectWorkerStorage();
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
      synthesisQueue.push({ id, text, voice, speed });
      void processSynthesisQueue();
      break;
    }

    case 'CANCEL_SYNTHESIS': {
      const targetId = message.payload?.id;
      if (targetId) {
        const queueIndex = synthesisQueue.findIndex((req) => req.id === targetId);
        if (queueIndex !== -1) {
          synthesisQueue.splice(queueIndex, 1);
          postResponse({
            type: 'SYNTHESIS_CANCELLED',
            payload: { id: targetId },
          });
        }
        const task = activeTasks.get(targetId);
        if (task) {
          task.cancel('Cancelled by client');
          activeTasks.delete(targetId);
        }
      } else {
        while (synthesisQueue.length > 0) {
          const req = synthesisQueue.shift()!;
          postResponse({
            type: 'SYNTHESIS_CANCELLED',
            payload: { id: req.id },
          });
        }
        if (speaker) {
          speaker.cancelAll('Cancelled by client');
        }
        activeTasks.clear();
      }
      break;
    }

    case 'CLEAR_CACHE': {
      try {
        while (synthesisQueue.length > 0) {
          const req = synthesisQueue.shift()!;
          postResponse({
            type: 'SYNTHESIS_CANCELLED',
            payload: { id: req.id },
          });
        }
        activeTasks.clear();
        if (speaker) {
          speaker.dispose();
          speaker = null;
          isModelLoaded = false;
        }
        await clearWorkerStorage();
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
