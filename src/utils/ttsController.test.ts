import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TTSController } from './ttsController.svelte';
import type { TTSWorkerRequest } from '../types/tts';

describe('TTSController Unit Tests', () => {
  let controller: TTSController;
  let postedMessages: TTSWorkerRequest[] = [];
  let latestWorkerInstance: MockWorker | null = null;

  function setLatestWorker(instance: MockWorker) {
    latestWorkerInstance = instance;
  }

  class MockWorker {
    public onmessage: ((event: MessageEvent) => void) | null = null;
    public onerror: ((event: ErrorEvent) => void) | null = null;
    public onmessageerror: ((event: MessageEvent) => void) | null = null;

    constructor() {
      setLatestWorker(this);
    }

    public postMessage(msg: TTSWorkerRequest) {
      postedMessages.push(msg);
    }

    public terminate() {
      // Mock terminate
    }
  }

  beforeEach(() => {
    postedMessages = [];
    latestWorkerInstance = null;
    vi.stubGlobal('Worker', MockWorker);
    controller = new TTSController();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('initializes with default idle state', () => {
    expect(controller.getIsLoaded()).toBe(false);
    expect(controller.getIsLoading()).toBe(false);
    expect(controller.getIsSpeaking()).toBe(false);
    expect(controller.getIsCached()).toBe(false);
    expect(controller.getDownloadProgress()).toBe(0);
    expect(controller.getVoices()).toEqual([]);
  });

  it('returns null on preload with empty or whitespace string', () => {
    expect(controller.preload('')).toBeNull();
    expect(controller.preload('   ')).toBeNull();
  });

  it('posts CHECK_CACHE when checkCache is called', () => {
    controller.checkCache();
    expect(postedMessages).toContainEqual({ type: 'CHECK_CACHE' });
  });

  it('separates stopAudio from cancelSynthesis', () => {
    controller.stopAudio();
    expect(controller.getIsSpeaking()).toBe(false);
    expect(postedMessages.length).toBe(0);

    // Initializing worker via checkCache so stop() sends CANCEL_SYNTHESIS
    controller.checkCache();
    controller.stop();
    expect(postedMessages).toContainEqual({
      type: 'CANCEL_SYNTHESIS',
      payload: undefined,
    });
  });

  it('handles load progress and success messages from worker', async () => {
    const loadPromise = controller.loadModel();

    expect(controller.getIsLoading()).toBe(true);
    expect(postedMessages).toContainEqual({
      type: 'LOAD_MODEL',
      payload: { dtype: 'q8', device: 'wasm' },
    });

    // Simulate progress event
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_PROGRESS',
        payload: { file: 'model.onnx', progress: 45, status: 'download' },
      },
    } as MessageEvent);

    expect(controller.getDownloadProgress()).toBe(45);
    expect(controller.getCurrentFileName()).toBe('model.onnx');

    // Simulate success event
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: {
          voices: [
            {
              id: 'jf_nezumi',
              name: 'Nezumi',
              group: 'Japanese Voices',
              gender: 'Female',
              lang: 'ja',
              grade: 'B+',
              traits: 'Soft',
            },
          ],
        },
      },
    } as MessageEvent);

    await loadPromise;
    expect(controller.getIsLoaded()).toBe(true);
    expect(controller.getIsLoading()).toBe(false);
    expect(controller.getVoices().length).toBe(1);
  });

  it('handles synthesize success and audio caching', async () => {
    // First load the model
    const loadPromise = controller.loadModel();
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);
    await loadPromise;

    const synthPromise = controller.synthesize('안녕하세요', 'jf_nezumi', 1.0);

    const synthMsg = postedMessages.find((m) => m.type === 'SYNTHESIZE');
    expect(synthMsg).toBeDefined();
    if (synthMsg && synthMsg.type === 'SYNTHESIZE') {
      expect(synthMsg.payload.text).toBe('안녕하세요');

      // Simulate worker returning success
      latestWorkerInstance?.onmessage?.({
        data: {
          type: 'SYNTHESIS_SUCCESS',
          payload: {
            id: synthMsg.payload.id,
            audioBlobUrl: 'blob:http://localhost/sample-audio',
            genTimeMs: 120,
            durationSec: 1.5,
            ipa: 'an-nyeong-ha-se-yo',
          },
        },
      } as MessageEvent);
    }

    const audioUrl = await synthPromise;
    expect(audioUrl).toBe('blob:http://localhost/sample-audio');

    // Second call with same parameters should return cached result without new message
    const msgCountBefore = postedMessages.length;
    const cachedUrl = await controller.synthesize('안녕하세요', 'jf_nezumi', 1.0);
    expect(cachedUrl).toBe('blob:http://localhost/sample-audio');
    expect(postedMessages.length).toBe(msgCountBefore);
  });

  it('handles synthesis cancellation correctly', async () => {
    const loadPromise = controller.loadModel();
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);
    await loadPromise;

    const synthPromise = controller.synthesize('한글', 'jf_nezumi', 1.0);

    const synthMsg = postedMessages.find((m) => m.type === 'SYNTHESIZE' && m.payload.text === '한글');
    expect(synthMsg).toBeDefined();

    if (synthMsg && synthMsg.type === 'SYNTHESIZE') {
      controller.cancelSynthesis(synthMsg.payload.id);

      latestWorkerInstance?.onmessage?.({
        data: {
          type: 'SYNTHESIS_CANCELLED',
          payload: { id: synthMsg.payload.id },
        },
      } as MessageEvent);
    }

    await expect(synthPromise).rejects.toThrow('Synthesis cancelled');
  });

  it('uses default voice jm_kumo consistently across speak and synthesize', async () => {
    const loadPromise = controller.loadModel();
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);
    await loadPromise;

    void controller.synthesize('테스트');
    const synthMsg = postedMessages.find((m) => m.type === 'SYNTHESIZE' && m.payload.text === '테스트');
    expect(synthMsg).toBeDefined();
    if (synthMsg && synthMsg.type === 'SYNTHESIZE') {
      expect(synthMsg.payload.voice).toBe('jm_kumo');
    }
  });

  it('handles preload cancellation silently by resolving to null', async () => {
    const loadPromise = controller.loadModel();
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);
    await loadPromise;

    const preloadPromise = controller.preload('미리듣기');
    expect(preloadPromise).not.toBeNull();

    controller.stop();
    const result = await preloadPromise;
    expect(result).toBeNull();
  });
});
