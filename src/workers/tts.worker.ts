import {
  polyfillReadableStreamAsyncIterator,
  KoreanSpeaker,
  type SpeakerProgress,
  type SynthesisTask,
} from '@dannyyoo/korean-tts';
import { env } from '@huggingface/transformers';
import type { TTSWorkerRequest, TTSWorkerResponse, VoiceMetadata } from '../types/tts';

polyfillReadableStreamAsyncIterator();

/**
 * Configure ONNX WebAssembly execution backend for Web Worker compatibility across all browsers.
 *
 * Safari & Mobile WebKit Compatibility:
 * 1. WebKit/Safari DedicatedWorkerGlobalScope does not support nested Web Workers (calling `new Worker()`
 *    from inside a Worker). When multi-threaded WASM initializes with numThreads > 1 (or default 0),
 *    ONNX Runtime attempts to spawn sub-worker threads, which throws a ReferenceError/TypeError in Safari.
 * 2. Setting `numThreads = 1` forces ONNX Runtime WASM to run in single-threaded mode within this
 *    already-isolated dedicated Web Worker thread. This ensures zero main-thread UI blocking while
 *    completely eliminating nested worker instantiation errors.
 * 3. Disable proxying (`proxy = false`) to avoid redundant main-thread worker proxies.
 */
if (env.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
  env.backends.onnx.wasm.proxy = false;
}

/**
 * Dedicated Web Worker for Kokoro-82M TTS synthesis.
 * Handles ONNX Runtime Web model loading, phonetic IPA transcription,
 * and audio generation off the main UI thread.
 */

let speaker: KoreanSpeaker | null = null;
let isModelLoaded = false;
let modelLoadingPromise: Promise<void> | null = null;
const activeTasks = new Map<string, SynthesisTask>();

interface PendingSynthesisRequest {
  id: string;
  text: string;
  voice: string;
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
 * Ensures the Kokoro ONNX model is loaded, deduplicating concurrent initialization calls.
 */
async function ensureModelLoaded(
  dtype: 'q8' | 'fp32' | 'fp16' | 'q4' = 'q8',
  device: 'wasm' | 'webgpu' = 'wasm',
): Promise<void> {
  if (isModelLoaded && speaker) {
    return;
  }
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }

  modelLoadingPromise = (async () => {
    try {
      console.debug('[TTS Worker] Loading Kokoro-82M model...');
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
      console.debug('[TTS Worker] Kokoro-82M model loaded and ready');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error('[TTS Worker] Model loading failed:', errorMsg);
      postResponse({
        type: 'LOAD_ERROR',
        payload: { error: errorMsg },
      });
      throw err;
    } finally {
      modelLoadingPromise = null;
    }
  })();

  return modelLoadingPromise;
}

/**
 * Sequentially process pending synthesis requests with cooperative yielding to allow
 * cancellation messages in the worker event queue to be processed before heavy WASM compute starts.
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

      // If model is currently loading or not yet initialized, wait for it before processing queue
      if (!isModelLoaded || !speaker) {
        console.debug('[TTS Worker] Awaiting model loading before synthesizing queue...');
        try {
          await ensureModelLoaded();
        } catch {
          // If model load failed, reject all queued synthesis requests gracefully
          while (synthesisQueue.length > 0) {
            const failedReq = synthesisQueue.shift()!;
            postResponse({
              type: 'SYNTHESIS_ERROR',
              payload: { id: failedReq.id, error: 'TTS model failed to load' },
            });
          }
          break;
        }
      }

      const req = synthesisQueue.shift()!;
      const { id, text, voice } = req;

      try {
        console.debug('[TTS Worker] Synthesizing text:', text, 'id:', id);
        if (!speaker || !isModelLoaded) {
          throw new Error('TTS Model is not loaded yet');
        }

        const task = speaker.synthesize({
          text,
          voice,
          speed: 1.0,
        });
        activeTasks.set(id, task);

        const result = await task;
        activeTasks.delete(id);
        console.debug('[TTS Worker] Synthesis complete for id:', id, 'genTimeMs:', result.genTimeMs);

        postResponse({
          type: 'SYNTHESIS_SUCCESS',
          payload: {
            id,
            audioPcm: result.audio,
            sampleRate: result.sampleRate ?? 24000,
            genTimeMs: result.genTimeMs,
            durationSec: result.durationSec,
            ipa: result.ipa,
          },
        });
      } catch (err: unknown) {
        console.error('[TTS Worker] Synthesis error for id:', id, err);
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
        const dtype = message.payload?.dtype ?? 'q8';
        const device = message.payload?.device ?? 'wasm';
        await ensureModelLoaded(dtype, device);
      } catch {
        // Error already handled and posted inside ensureModelLoaded
      }
      break;
    }

    case 'SYNTHESIZE': {
      const { id, text, voice = 'jm_kumo' } = message.payload;
      synthesisQueue.push({ id, text, voice });
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

/**
 * Global unhandled error handler for the worker context.
 * Forwards any uncaught runtime exceptions to the main thread with explicit error details.
 */
self.onerror = (event: Event | string, _source?: string, _lineno?: number, _colno?: number, error?: Error) => {
  console.error('Unhandled TTS worker error:', event, error);
  const message =
    error?.message ||
    (typeof event === 'string'
      ? event
      : 'message' in event && typeof (event as { message?: unknown }).message === 'string'
        ? (event as { message: string }).message
        : 'Web Worker encountered an unexpected error');
  postResponse({
    type: 'LOAD_ERROR',
    payload: { error: message },
  });
};

/**
 * Global unhandled promise rejection handler for the worker context.
 */
self.onunhandledrejection = (event: PromiseRejectionEvent) => {
  console.error('Unhandled TTS worker rejection:', event.reason);
  const message =
    event.reason instanceof Error
      ? event.reason.message
      : String(event.reason || 'Unhandled worker rejection');
  postResponse({
    type: 'LOAD_ERROR',
    payload: { error: message },
  });
};

