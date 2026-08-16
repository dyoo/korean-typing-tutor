import { SvelteMap } from 'svelte/reactivity';
import type { TTSWorkerRequest, TTSWorkerResponse, VoiceMetadata } from '../types/tts';

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

  private currentAudio: HTMLAudioElement | null = null;
  private pendingSyntheses = new SvelteMap<
    string,
    {
      resolve: (audioUrl: string) => void;
      reject: (err: Error) => void;
    }
  >();
  private audioCache = new SvelteMap<string, string>(); // text -> blobUrl
  private inFlightSyntheses = new SvelteMap<string, Promise<string>>(); // cacheKey -> Promise
  private nextRequestId = 0;

  constructor() {
    // Lazily initialized when needed
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
          this.loadError = null;
          break;

        case 'LOAD_ERROR':
          this.isLoading = false;
          this.isLoaded = false;
          this.loadError = msg.payload.error;
          break;

        case 'SYNTHESIS_SUCCESS': {
          const pending = this.pendingSyntheses.get(msg.payload.id);
          if (pending) {
            pending.resolve(msg.payload.audioBlobUrl);
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
          this.audioCache.clear();
          this.inFlightSyntheses.clear();
          break;
      }
    };

    this.worker.onerror = (err: ErrorEvent) => {
      console.error('TTS Web Worker Error:', err);
      this.isLoading = false;
      this.loadError = err.message || 'Web Worker failed to initialize or execute';
    };

    this.worker.onmessageerror = (err: MessageEvent) => {
      console.error('TTS Web Worker Message Error:', err);
      this.isLoading = false;
      this.loadError = 'Web Worker failed to deserialize message';
    };

    return this.worker;
  }

  public checkCache(): void {
    const w = this.initWorker();
    w.postMessage({ type: 'CHECK_CACHE' } satisfies TTSWorkerRequest);
  }

  public async loadModel(): Promise<void> {
    if (this.isLoaded) {
      return;
    }
    this.isLoading = true;
    this.loadError = null;
    const w = this.initWorker();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.isLoading) {
          this.isLoading = false;
          reject(new Error('Model loading timed out. Please check network connection.'));
        }
      }, 120000);

      const checkInterval = setInterval(() => {
        if (this.isLoaded) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          resolve();
        } else if (this.loadError) {
          clearInterval(checkInterval);
          clearTimeout(timeout);
          reject(new Error(this.loadError));
        }
      }, 100);

      w.postMessage({
        type: 'LOAD_MODEL',
        payload: { dtype: 'q8', device: 'wasm' },
      } satisfies TTSWorkerRequest);
    });
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
    voice: string = 'jf_nezumi',
    speed: number = 1.0,
  ): Promise<string> | null {
    if (!text || text.trim().length === 0) {
      return null;
    }
    return this.synthesize(text, voice, speed);
  }

  public async synthesize(
    text: string,
    voice: string = 'jf_nezumi',
    speed: number = 1.0,
  ): Promise<string> {
    const cacheKey = `${text}_${voice}_${speed}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
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
            this.audioCache.set(cacheKey, audioBlobUrl);
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

  public async speak(
    text: string,
    voice: string = 'jf_nezumi',
    speed: number = 1.0,
  ): Promise<void> {
    if (!text || text.trim().length === 0) {
      return;
    }

    this.stop();

    try {
      this.isSpeaking = true;
      const audioUrl = await this.synthesize(text, voice, speed);

      const audio = new Audio(audioUrl);
      this.currentAudio = audio;

      return new Promise((resolve) => {
        audio.onended = () => {
          this.isSpeaking = false;
          this.currentAudio = null;
          resolve();
        };
        audio.onerror = () => {
          this.isSpeaking = false;
          this.currentAudio = null;
          resolve();
        };
        audio.play().catch(() => {
          this.isSpeaking = false;
          this.currentAudio = null;
          resolve();
        });
      });
    } catch {
      this.isSpeaking = false;
    }
  }

  public stop(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isSpeaking = false;
  }

  public async clearCache(): Promise<void> {
    this.stop();
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
