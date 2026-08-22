import { createWavBlob } from '@dannyyoo/korean-tts';
import type { TTSWorkerRequest, TTSWorkerResponse, VoiceMetadata } from '../types/tts';

/** Maximum number of audio blob URLs retained in memory before LRU eviction. */
const MAX_AUDIO_CACHE_SIZE = 50;

/** Silent 1-sample WAV data URI to unlock audio playback on Safari/iOS within user gestures. */
const SILENT_AUDIO_DATA_URI =
  'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';

/**
 * Controller singleton for interacting with the TTS Web Worker and managing
 * client-side speech synthesis audio playback and pre-generation cache.
 */
export class TTSController {
  private worker: Worker | null = null;
  private isLoaded = $state(false);
  private isLoading = $state(false);
  private isSpeaking = $state(false);
  private downloadProgress = $state(0);
  private downloadStatus = $state('');
  private currentFileName = $state('');
  private isCached = $state(false);
  private modelSizeFormatted = $state('');
  private availableVoices = $state<VoiceMetadata[]>([]);
  private loadError = $state<string | null>(null);

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
  private loadModelPromise: Promise<void> | null = null;
  private nextRequestId = 0;
  private currentBatchToken = 0;

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
          this.isCached = msg.payload.isCached;
          if (msg.payload.modelSizeFormatted) {
            this.modelSizeFormatted = msg.payload.modelSizeFormatted;
          }
          while (this.pendingCacheChecks.length > 0) {
            this.pendingCacheChecks.shift()!(msg.payload.isCached);
          }
          break;

        case 'LOAD_PROGRESS':
          this.isLoading = true;
          this.downloadProgress = Math.round(msg.payload.progress);
          this.downloadStatus = msg.payload.status;
          this.currentFileName = msg.payload.file;
          break;

        case 'LOAD_SUCCESS':
          this.isLoading = false;
          this.isLoaded = true;
          this.isCached = true;
          this.availableVoices = msg.payload.voices;
          if (msg.payload.modelSizeFormatted) {
            this.modelSizeFormatted = msg.payload.modelSizeFormatted;
          }
          this.loadError = null;
          // Re-check storage in worker to get exact finalized cached footprint
          this.checkCache(true);
          break;

        case 'LOAD_ERROR':
          this.isLoading = false;
          this.isLoaded = false;
          this.loadError = msg.payload.error;
          break;

        case 'SYNTHESIS_SUCCESS': {
          console.log('[TTS] SYNTHESIS_SUCCESS received from worker:', msg.payload.id);
          const pending = this.pendingSyntheses.get(msg.payload.id);
          if (pending) {
            let audioBlobUrl: string;
            if (msg.payload.audioPcm) {
              const wavBlob = createWavBlob(msg.payload.audioPcm, msg.payload.sampleRate ?? 24000);
              audioBlobUrl = URL.createObjectURL(wavBlob);
              console.log('[TTS] Created window Blob URL:', audioBlobUrl);
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
          this.isCached = false;
          this.isLoaded = false;
          this.modelSizeFormatted = '';
          this.clearAudioCache();
          break;
      }
    };

    this.worker.onerror = (err: ErrorEvent) => {
      console.error('TTS Web Worker Error:', err);
      this.isLoading = false;
      this.loadError = err.message || 'Web Worker failed to initialize or execute';
      if (this.worker) {
        this.worker.terminate();
        this.worker = null;
      }
    };

    this.worker.onmessageerror = (err: MessageEvent) => {
      console.error('TTS Web Worker Message Error:', err);
      this.isLoading = false;
      this.loadError = 'Web Worker failed to deserialize message';
    };

    return this.worker;
  }

  public async checkCache(force: boolean = false): Promise<boolean> {
    if (!force && this.isLoaded && this.isCached && this.modelSizeFormatted) {
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
    if (this.isLoaded) {
      return;
    }
    if (this.loadModelPromise) {
      return this.loadModelPromise;
    }
    this.isLoading = true;
    this.loadError = null;
    const w = this.initWorker();

    this.loadModelPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.loadModelPromise = null;
        if (this.isLoading) {
          this.isLoading = false;
          reject(new Error('Model loading timed out. Please check network connection.'));
        }
      }, 120000);

      const checkInterval = setInterval(() => {
        if (this.isLoaded) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          this.loadModelPromise = null;
          resolve();
        } else if (this.loadError) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          this.loadModelPromise = null;
          reject(new Error(this.loadError));
        }
      }, 100);

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
    this.isLoading = false;
    this.downloadProgress = 0;
    this.downloadStatus = '';
    this.currentFileName = '';
    this.loadError = null;
    this.inFlightSyntheses.clear();
    this.pendingSyntheses.clear();
  }

  public preload(
    text: string,
    voice: string = 'jm_kumo',
    speed: number = 1.0,
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
    voice: string = 'jm_kumo',
    speed: number = 1.0,
  ): Promise<void> {
    const token = ++this.currentBatchToken;
    for (const text of texts) {
      if (token !== this.currentBatchToken) {
        break; // Batch cancelled by newer batch or stop()
      }
      if (!text || text.trim().length === 0) {
        continue;
      }
      const cacheKey = `${text}_${voice}_${speed}`;
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
    voice: string = 'jm_kumo',
    speed: number = 1.0,
  ): Promise<string> {
    const cacheKey = `${text}_${voice}_${speed}`;
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

    const synthesisPromise = (async () => {
      if (!this.isLoaded) {
        await this.loadModel();
      }

      const w = this.initWorker();
      const id = `syn_${++this.nextRequestId}`;

      return new Promise<string>((resolve, reject) => {
        this.pendingSyntheses.set(id, {
          resolve: (audioBlobUrl: string) => {
            this.putCachedAudio(cacheKey, audioBlobUrl);
            this.inFlightSyntheses.delete(cacheKey);
            resolve(audioBlobUrl);
          },
          reject: (err: Error) => {
            this.inFlightSyntheses.delete(cacheKey);
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
    this.isSpeaking = false;
  }

  public async speak(text: string, voice: string = 'jm_kumo', speed: number = 1.0): Promise<void> {
    if (!text || text.trim().length === 0) {
      return;
    }

    console.log('[TTS] speak() called for:', text);
    // Prime the audio subsystem synchronously during the active user gesture
    this.unlockAudio();
    this.stopAudio();

    try {
      this.isSpeaking = true;
      const audioUrl = await this.synthesize(text, voice, speed);
      console.log('[TTS] synthesize() resolved with audioUrl:', audioUrl);

      if (!this.playerAudio) {
        this.playerAudio = new Audio();
      }
      const audio = this.playerAudio;
      audio.src = audioUrl;
      console.log('[TTS] Invoking audio.play() on HTMLAudioElement');

      return new Promise((resolve) => {
        const cleanup = () => {
          audio.onended = null;
          audio.onerror = null;
          this.isSpeaking = false;
        };

        audio.onended = () => {
          console.log('[TTS] audio.play() onended triggered');
          cleanup();
          resolve();
        };
        audio.onerror = (e) => {
          console.error('[TTS] audio.play() onerror triggered:', e);
          cleanup();
          resolve();
        };
        audio.play().then(() => {
          console.log('[TTS] audio.play() promise resolved successfully');
        }).catch((err) => {
          console.warn('[TTS] audio.play() promise rejected:', err);
          cleanup();
          resolve();
        });
      });
    } catch (err) {
      console.error('[TTS] speak() failed with error:', err);
      this.isSpeaking = false;
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

  // Reactive getters
  public getIsLoaded(): boolean {
    return this.isLoaded;
  }

  public getIsLoading(): boolean {
    return this.isLoading;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getDownloadProgress(): number {
    return this.downloadProgress;
  }

  public getDownloadStatus(): string {
    return this.downloadStatus;
  }

  public getCurrentFileName(): string {
    return this.currentFileName;
  }

  public getIsCached(): boolean {
    return this.isCached;
  }

  public getModelSizeFormatted(): string {
    return this.modelSizeFormatted;
  }

  public getVoices(): VoiceMetadata[] {
    return this.availableVoices;
  }

  public getLoadError(): string | null {
    return this.loadError;
  }
}

/** Global singleton instance of the TTS Controller */
export const ttsController = new TTSController();
