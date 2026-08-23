import { createWavBlob } from '@dannyyoo/korean-tts';
import type { TTSWorkerRequest, TTSWorkerResponse, VoiceMetadata } from '../types/tts';

/** Maximum number of audio blob URLs retained in memory before LRU eviction. */
const MAX_AUDIO_CACHE_SIZE = 50;

/** Default voice profile identifier for Kokoro TTS. */
export const DEFAULT_TTS_VOICE = 'jm_kumo';

/** Default speech synthesis rate multiplier. */
export const DEFAULT_TTS_SPEED = 1.0;

/** Silent 1-sample WAV data URI to unlock audio playback on Safari/iOS within user gestures. */
const SILENT_AUDIO_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/** Computes a consistent composite cache key for preloaded and synthesized audio buffers. */
export function getTTSCacheKey(
  text: string,
  voice: string = DEFAULT_TTS_VOICE,
  speed: number = DEFAULT_TTS_SPEED,
): string {
  return `${text}_${voice}_${speed}`;
}

/**
 * Controller singleton for interacting with the TTS Web Worker and managing
 * client-side speech synthesis audio playback and pre-generation cache.
 */
export class TTSController {
  private worker: Worker | null = null;
  private _isLoaded = $state(false);
  private _isLoading = $state(false);
  private _isSpeaking = $state(false);
  private _downloadProgress = $state(0);
  private _downloadStatus = $state('');
  private _currentFileName = $state('');
  private _isCached = $state(false);
  private _modelSizeFormatted = $state('');
  private _availableVoices = $state<VoiceMetadata[]>([]);
  private _loadError = $state<string | null>(null);
  private _generatingKeys = $state<string[]>([]);

  private playerAudio: HTMLAudioElement | null = null;
  private isAudioUnlocked = false;
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Internal request tracking map intentionally non-reactive to avoid re-triggering effects
  private pendingSyntheses = new Map<
    string,
    {
      resolve: (audioBlobUrl: string) => void;
      reject: (err: Error) => void;
    }
  >();
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Internal cache map intentionally non-reactive to avoid re-triggering effects
  private audioCache = new Map<string, string>(); // text -> blobUrl
  // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Internal in-flight promise map intentionally non-reactive to avoid re-triggering effects
  private inFlightSyntheses = new Map<string, Promise<string>>(); // cacheKey -> Promise
  private pendingCacheChecks: Array<(cached: boolean) => void> = [];
  private pendingModelLoadResolvers: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];
  private loadModelPromise: Promise<void> | null = null;
  private nextRequestId = 0;
  private currentBatchToken = 0;
  private currentPlaybackToken = 0;

  constructor() {
    // Lazily initialized when needed
  }

  /** Safely revokes a Blob URL to free underlying browser audio memory. */
  private revokeAudioBlobUrl(url?: string): void {
    if (url && typeof URL !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // Ignore revocation errors in headless or mock test environments
      }
    }
  }

  /** Clears the in-memory audio cache and revokes all active Blob URLs. */
  private clearAudioCache(): void {
    for (const url of this.audioCache.values()) {
      this.revokeAudioBlobUrl(url);
    }
    this.audioCache.clear();
    this.inFlightSyntheses.clear();
    this._generatingKeys = [];
  }

  /** Stores a synthesized audio URL in the LRU cache, evicting the oldest entry when at capacity. */
  private putCachedAudio(key: string, url: string): void {
    if (this.audioCache.has(key)) {
      const existingUrl = this.audioCache.get(key);
      if (existingUrl && existingUrl !== url) {
        this.revokeAudioBlobUrl(existingUrl);
      }
      this.audioCache.delete(key);
    } else if (this.audioCache.size >= MAX_AUDIO_CACHE_SIZE) {
      const oldestKey = this.audioCache.keys().next().value;
      if (oldestKey !== undefined) {
        const oldestUrl = this.audioCache.get(oldestKey);
        this.revokeAudioBlobUrl(oldestUrl);
        this.audioCache.delete(oldestKey);
      }
    }
    this.audioCache.set(key, url);
  }

  /** Flushes and notifies all in-flight model loading promise resolvers. */
  private flushModelLoadResolvers(error: Error | null): void {
    const resolvers = this.pendingModelLoadResolvers.splice(0, this.pendingModelLoadResolvers.length);
    for (const r of resolvers) {
      if (error) {
        r.reject(error);
      } else {
        r.resolve();
      }
    }
    this.loadModelPromise = null;
  }

  private initWorker(): Worker {
    if (this.worker) {
      return this.worker;
    }

    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- Vite static analysis requires literal new URL(..., import.meta.url)
    this.worker = new Worker(new URL('../workers/tts.worker.ts', import.meta.url), {
      type: 'module',
    });

    this.worker.onmessage = (event: MessageEvent<TTSWorkerResponse>) => {
      const msg = event.data;

      switch (msg.type) {
        case 'CACHE_STATUS':
          this._isCached = msg.payload.isCached;
          if (msg.payload.modelSizeFormatted) {
            this._modelSizeFormatted = msg.payload.modelSizeFormatted;
          }
          while (this.pendingCacheChecks.length > 0) {
            this.pendingCacheChecks.shift()!(msg.payload.isCached);
          }
          break;

        case 'LOAD_PROGRESS':
          this._isLoading = true;
          this._downloadProgress = Math.round(msg.payload.progress);
          this._downloadStatus = msg.payload.status;
          this._currentFileName = msg.payload.file;
          break;

        case 'LOAD_SUCCESS':
          this._isLoading = false;
          this._isLoaded = true;
          this._isCached = true;
          this._availableVoices = msg.payload.voices;
          if (msg.payload.modelSizeFormatted) {
            this._modelSizeFormatted = msg.payload.modelSizeFormatted;
          }
          this._loadError = null;
          this.flushModelLoadResolvers(null);
          // Re-check storage in worker to get exact finalized cached footprint
          this.checkCache(true);
          break;

        case 'LOAD_ERROR':
          this._isLoading = false;
          this._isLoaded = false;
          this._loadError = msg.payload.error;
          this.flushModelLoadResolvers(new Error(msg.payload.error));
          break;

        case 'SYNTHESIS_SUCCESS': {
          const pending = this.pendingSyntheses.get(msg.payload.id);
          if (pending) {
            let audioBlobUrl: string;
            if (msg.payload.audioPcm) {
              const wavBlob = createWavBlob(msg.payload.audioPcm, msg.payload.sampleRate ?? 24000);
              audioBlobUrl = URL.createObjectURL(wavBlob);
            } else {
              audioBlobUrl = (msg.payload as unknown as { audioBlobUrl: string }).audioBlobUrl || '';
            }
            pending.resolve(audioBlobUrl);
            this.pendingSyntheses.delete(msg.payload.id);
          }
          break;
        }

        case 'SYNTHESIS_CANCELLED': {
          const pending = this.pendingSyntheses.get(msg.payload.id);
          if (pending) {
            pending.reject(new Error('Synthesis cancelled'));
            this.pendingSyntheses.delete(msg.payload.id);
          }
          break;
        }

        case 'SYNTHESIS_ERROR': {
          const pending = this.pendingSyntheses.get(msg.payload.id);
          if (pending) {
            pending.reject(new Error(msg.payload.error));
            this.pendingSyntheses.delete(msg.payload.id);
          }
          break;
        }

        case 'CLEAR_CACHE_SUCCESS':
          this._isCached = false;
          this._isLoaded = false;
          this._modelSizeFormatted = '';
          this.clearAudioCache();
          break;
      }
    };

    this.worker.onerror = (err: ErrorEvent) => {
      console.error('TTS Web Worker Error:', err);
      this._isLoading = false;
      this._loadError = err.message || 'Web Worker failed to initialize or execute';
      this.flushModelLoadResolvers(new Error(this._loadError));
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    };

    this.worker.onmessageerror = (err: MessageEvent) => {
      console.error('TTS Web Worker Message Error:', err);
      this._isLoading = false;
      this._loadError = 'Web Worker failed to deserialize message';
      this.flushModelLoadResolvers(new Error(this._loadError));
    };

    return this.worker;
  }

  public async checkCache(force: boolean = false): Promise<boolean> {
    if (!force && this._isLoaded && this._isCached && this._modelSizeFormatted) {
      return true;
    }
    const w = this.initWorker();
    const promise = new Promise<boolean>((resolve) => {
      this.pendingCacheChecks.push(resolve);
    });
    w.postMessage({ type: 'CHECK_CACHE' } satisfies TTSWorkerRequest);
    return promise;
  }

  public async loadModel(): Promise<void> {
    if (this._isLoaded) {
      return;
    }
    if (this.loadModelPromise) {
      return this.loadModelPromise;
    }
    this._isLoading = true;
    this._loadError = null;
    const w = this.initWorker();

    this.loadModelPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this._isLoading) {
          this._isLoading = false;
          const timeoutErr = new Error('Model loading timed out. Please check network connection.');
          this.flushModelLoadResolvers(timeoutErr);
        }
      }, 120000);

      this.pendingModelLoadResolvers.push({
        resolve: () => {
          clearTimeout(timeout);
          resolve();
        },
        reject: (err: Error) => {
          clearTimeout(timeout);
          reject(err);
        },
      });

      w.postMessage({
        type: 'LOAD_MODEL',
        payload: { dtype: 'q8', device: 'wasm' },
      } satisfies TTSWorkerRequest);
    });

    return this.loadModelPromise;
  }

  /**
   * Aborts model downloading and terminates active worker threads.
   */
  public cancelLoading(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this._isLoading = false;
    this._downloadProgress = 0;
    this._downloadStatus = '';
    this._currentFileName = '';
    this._loadError = null;
    this.inFlightSyntheses.clear();
    this.pendingSyntheses.clear();
    this._generatingKeys = [];
    this.flushModelLoadResolvers(new Error('Model loading cancelled'));
  }

  public preload(
    text: string,
    voice: string = DEFAULT_TTS_VOICE,
    speed: number = DEFAULT_TTS_SPEED,
  ): Promise<string | null> | null {
    if (!text || text.trim().length === 0) {
      return null;
    }
    return this.synthesize(text, voice, speed).catch(() => null);
  }

  /**
   * Sequentially pre-synthesizes an array of upcoming prompt targets in the background
   * during browser idle periods.
   * Cancels any previously active batch if a new batch is scheduled or if stop() is called.
   */
  public async preloadBatch(
    texts: string[],
    voice: string = DEFAULT_TTS_VOICE,
    speed: number = DEFAULT_TTS_SPEED,
  ): Promise<void> {
    const token = ++this.currentBatchToken;
    for (const text of texts) {
      if (token !== this.currentBatchToken) {
        break; // Batch cancelled by newer batch or stop()
      }
      if (!text || text.trim().length === 0) {
        continue;
      }
      const cacheKey = getTTSCacheKey(text, voice, speed);
      if (this.audioCache.has(cacheKey) || this.inFlightSyntheses.has(cacheKey)) {
        continue;
      }
      try {
        await this.synthesize(text, voice, speed);
      } catch {
        // Silently skip if item failed or was cancelled
      }
    }
  }

  /** Cancels any active in-flight batch preloading sequence. */
  public cancelBatchPreload(): void {
    this.currentBatchToken++;
  }

  public async synthesize(
    text: string,
    voice: string = DEFAULT_TTS_VOICE,
    speed: number = DEFAULT_TTS_SPEED,
  ): Promise<string> {
    const cacheKey = getTTSCacheKey(text, voice, speed);
    if (this.audioCache.has(cacheKey)) {
      const cachedUrl = this.audioCache.get(cacheKey)!;
      // Refresh LRU recency on cache hit
      this.audioCache.delete(cacheKey);
      this.audioCache.set(cacheKey, cachedUrl);
      return cachedUrl;
    }

    if (this.inFlightSyntheses.has(cacheKey)) {
      return this.inFlightSyntheses.get(cacheKey)!;
    }

    if (!this._generatingKeys.includes(cacheKey)) {
      this._generatingKeys = [...this._generatingKeys, cacheKey];
    }

    const synthesisPromise = (async () => {
      if (!this._isLoaded) {
        await this.loadModel();
      }

      const w = this.initWorker();
      const id = `syn_${++this.nextRequestId}`;

      return new Promise<string>((resolve, reject) => {
        this.pendingSyntheses.set(id, {
          resolve: (audioBlobUrl: string) => {
            this.putCachedAudio(cacheKey, audioBlobUrl);
            this.inFlightSyntheses.delete(cacheKey);
            this._generatingKeys = this._generatingKeys.filter((k) => k !== cacheKey);
            resolve(audioBlobUrl);
          },
          reject: (err: Error) => {
            this.inFlightSyntheses.delete(cacheKey);
            this._generatingKeys = this._generatingKeys.filter((k) => k !== cacheKey);
            reject(err);
          },
        });

        w.postMessage({
          type: 'SYNTHESIZE',
          payload: { id, text, voice, speed },
        } satisfies TTSWorkerRequest);
      });
    })();

    this.inFlightSyntheses.set(cacheKey, synthesisPromise);
    return synthesisPromise;
  }

  /**
   * Prime and unlock the browser audio subsystem within an active user gesture (click/keydown).
   * Unlocks HTMLAudioElement playback so subsequent playback is permitted by
   * Safari / WebKit and Chrome autoplay policies.
   */
  public unlockAudio(): void {
    if (typeof Audio !== 'undefined') {
      if (!this.playerAudio) {
        this.playerAudio = new Audio();
      }
      if (!this.isAudioUnlocked) {
        this.isAudioUnlocked = true;
        this.playerAudio.src = SILENT_AUDIO_DATA_URI;
        this.playerAudio.play().catch(() => {
          // Revert unlock state if rejected outside a recognized user gesture
          this.isAudioUnlocked = false;
        });
      }
    }
  }

  public stopAudio(): void {
    this.currentPlaybackToken++;
    if (this.playerAudio) {
      this.playerAudio.onended = null;
      this.playerAudio.onerror = null;
      this.playerAudio.pause();
      try {
        this.playerAudio.currentTime = 0;
      } catch {
        // Ignore seek errors on unseekable media
      }
    }
    this._isSpeaking = false;
  }

  public async speak(
    text: string,
    voice: string = DEFAULT_TTS_VOICE,
    speed: number = DEFAULT_TTS_SPEED,
  ): Promise<void> {
    if (!text || text.trim().length === 0) {
      return;
    }

    // Prime the audio subsystem synchronously during the active user gesture
    this.unlockAudio();
    this.stopAudio();
    const playbackToken = this.currentPlaybackToken;

    try {
      this._isSpeaking = true;
      const audioUrl = await this.synthesize(text, voice, speed);

      // If stopAudio() or another speak() was called while synthesis was in flight, abort playback
      if (playbackToken !== this.currentPlaybackToken) {
        return;
      }

      if (!this.playerAudio) {
        this.playerAudio = new Audio();
      }
      const audio = this.playerAudio;
      audio.src = audioUrl;

      return new Promise((resolve) => {
        const cleanup = () => {
          audio.onended = null;
          audio.onerror = null;
          if (playbackToken === this.currentPlaybackToken) {
            this._isSpeaking = false;
          }
        };

        audio.onended = () => {
          cleanup();
          resolve();
        };
        audio.onerror = () => {
          cleanup();
          resolve();
        };
        audio.play().catch(() => {
          cleanup();
          resolve();
        });
      });
    } catch {
      if (playbackToken === this.currentPlaybackToken) {
        this._isSpeaking = false;
      }
    }
  }

  public cancelSynthesis(id?: string): void {
    if (this.worker) {
      this.worker.postMessage({
        type: 'CANCEL_SYNTHESIS',
        payload: id ? { id } : undefined,
      } satisfies TTSWorkerRequest);
    }
    if (id) {
      const pending = this.pendingSyntheses.get(id);
      if (pending) {
        pending.reject(new Error('Synthesis cancelled'));
        this.pendingSyntheses.delete(id);
      }
    } else {
      for (const pending of this.pendingSyntheses.values()) {
        pending.reject(new Error('Synthesis cancelled'));
      }
      this.pendingSyntheses.clear();
      this.inFlightSyntheses.clear();
      this._generatingKeys = [];
    }
  }

  public stop(): void {
    this.cancelBatchPreload();
    this.stopAudio();
    this.cancelSynthesis();
  }

  public async clearCache(): Promise<void> {
    this.stop();
    this.clearAudioCache();
    const w = this.initWorker();
    w.postMessage({ type: 'CLEAR_CACHE' } satisfies TTSWorkerRequest);
  }

  /** Checks if the model or audio synthesis for a given prompt is actively loading. */
  public isAudioLoading(
    text?: string,
    voice: string = DEFAULT_TTS_VOICE,
    speed: number = DEFAULT_TTS_SPEED,
  ): boolean {
    if (this._isLoading || !this._isLoaded) {
      return true;
    }
    if (!text || text.trim().length === 0) {
      return false;
    }
    const key = getTTSCacheKey(text, voice, speed);
    return !this.audioCache.has(key) && this._generatingKeys.includes(key);
  }

  /** Checks if synthesized audio for a given prompt is already available in the LRU cache. */
  public isAudioCached(
    text: string,
    voice: string = DEFAULT_TTS_VOICE,
    speed: number = DEFAULT_TTS_SPEED,
  ): boolean {
    return this.audioCache.has(getTTSCacheKey(text, voice, speed));
  }

  // Reactive property getters
  public get isLoaded(): boolean {
    return this._isLoaded;
  }

  public get isLoading(): boolean {
    return this._isLoading;
  }

  public get isSpeaking(): boolean {
    return this._isSpeaking;
  }

  public get downloadProgress(): number {
    return this._downloadProgress;
  }

  public get downloadStatus(): string {
    return this._downloadStatus;
  }

  public get currentFileName(): string {
    return this._currentFileName;
  }

  public get isCached(): boolean {
    return this._isCached;
  }

  public get modelSizeFormatted(): string {
    return this._modelSizeFormatted;
  }

  public get voices(): VoiceMetadata[] {
    return this._availableVoices;
  }

  public get loadError(): string | null {
    return this._loadError;
  }
}

/** Global singleton instance of the TTS Controller */
export const ttsController = new TTSController();
