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
    expect(controller.isLoaded).toBe(false);
    expect(controller.isLoading).toBe(false);
    expect(controller.isSpeaking).toBe(false);
    expect(controller.isCached).toBe(false);
    expect(controller.downloadProgress).toBe(0);
    expect(controller.voices).toEqual([]);
  });

  it('returns null on preload with empty or whitespace string', () => {
    expect(controller.preload('')).toBeNull();
    expect(controller.preload('   ')).toBeNull();
  });

  it('posts CHECK_CACHE when checkCache is called and updates isCached on CACHE_STATUS response', async () => {
    const checkPromise = controller.checkCache();
    expect(postedMessages).toContainEqual({ type: 'CHECK_CACHE' });
    expect(controller.isCached).toBe(false);

    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'CACHE_STATUS',
        payload: { isCached: true, modelSizeFormatted: '80 MB' },
      },
    } as MessageEvent);

    const isCachedResult = await checkPromise;
    expect(isCachedResult).toBe(true);
    expect(controller.isCached).toBe(true);
    expect(controller.modelSizeFormatted).toBe('80 MB');
  });

  it('separates stopAudio from cancelSynthesis', () => {
    controller.stopAudio();
    expect(controller.isSpeaking).toBe(false);
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

    expect(controller.isLoading).toBe(true);
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

    expect(controller.downloadProgress).toBe(45);
    expect(controller.currentFileName).toBe('model.onnx');

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
    expect(controller.isLoaded).toBe(true);
    expect(controller.isLoading).toBe(false);
    expect(controller.voices.length).toBe(1);
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

    const synthMsg = postedMessages.find(
      (m) => m.type === 'SYNTHESIZE' && m.payload.text === '한글',
    );
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
    const synthMsg = postedMessages.find(
      (m) => m.type === 'SYNTHESIZE' && m.payload.text === '테스트',
    );
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

  it('evicts oldest audio from cache and calls URL.revokeObjectURL when reaching capacity', async () => {
    const revokeObjectURLMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const loadPromise = controller.loadModel();
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);
    await loadPromise;

    // Fill the cache up to 50 items
    for (let i = 1; i <= 50; i++) {
      const p = controller.synthesize(`word_${i}`);
      const synthMsg = postedMessages[postedMessages.length - 1];
      if (synthMsg && synthMsg.type === 'SYNTHESIZE') {
        latestWorkerInstance?.onmessage?.({
          data: {
            type: 'SYNTHESIS_SUCCESS',
            payload: {
              id: synthMsg.payload.id,
              audioBlobUrl: `blob:http://localhost/audio_${i}`,
              genTimeMs: 10,
              durationSec: 1.0,
              ipa: `word-${i}`,
            },
          },
        } as MessageEvent);
      }
      await p;
    }

    expect(revokeObjectURLMock).not.toHaveBeenCalled();

    // Adding 51st item should evict word_1 and revoke blob:http://localhost/audio_1
    const p51 = controller.synthesize('word_51');
    const synthMsg51 = postedMessages[postedMessages.length - 1];
    if (synthMsg51 && synthMsg51.type === 'SYNTHESIZE') {
      latestWorkerInstance?.onmessage?.({
        data: {
          type: 'SYNTHESIS_SUCCESS',
          payload: {
            id: synthMsg51.payload.id,
            audioBlobUrl: 'blob:http://localhost/audio_51',
            genTimeMs: 10,
            durationSec: 1.0,
            ipa: 'word-51',
          },
        },
      } as MessageEvent);
    }
    await p51;

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/audio_1');
  });

  it('revokes all cached Blob URLs when clearCache is called', async () => {
    const revokeObjectURLMock = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    const loadPromise = controller.loadModel();
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);
    await loadPromise;

    // Synthesize two items
    const p1 = controller.synthesize('가');
    const msg1 = postedMessages[postedMessages.length - 1];
    if (msg1?.type === 'SYNTHESIZE') {
      latestWorkerInstance?.onmessage?.({
        data: {
          type: 'SYNTHESIS_SUCCESS',
          payload: {
            id: msg1.payload.id,
            audioBlobUrl: 'blob:http://localhost/ga',
            genTimeMs: 10,
            durationSec: 1.0,
            ipa: 'ga',
          },
        },
      } as MessageEvent);
    }
    await p1;

    const p2 = controller.synthesize('나');
    const msg2 = postedMessages[postedMessages.length - 1];
    if (msg2?.type === 'SYNTHESIZE') {
      latestWorkerInstance?.onmessage?.({
        data: {
          type: 'SYNTHESIS_SUCCESS',
          payload: {
            id: msg2.payload.id,
            audioBlobUrl: 'blob:http://localhost/na',
            genTimeMs: 10,
            durationSec: 1.0,
            ipa: 'na',
          },
        },
      } as MessageEvent);
    }
    await p2;

    await controller.clearCache();

    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/ga');
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/na');
  });

  it('clears modelSizeFormatted on CLEAR_CACHE_SUCCESS', async () => {
    controller.checkCache();
    // Set cached size
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'CACHE_STATUS',
        payload: { isCached: true, modelSizeFormatted: '88.1 MB' },
      },
    } as MessageEvent);
    expect(controller.modelSizeFormatted).toBe('88.1 MB');

    await controller.clearCache();
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'CLEAR_CACHE_SUCCESS',
      },
    } as MessageEvent);

    expect(controller.modelSizeFormatted).toBe('');
    expect(controller.isCached).toBe(false);
  });

  it('handles worker.onerror by setting loadError and terminating the worker instance', async () => {
    const loadPromise = controller.loadModel();
    const currentWorker = latestWorkerInstance;
    expect(currentWorker).not.toBeNull();

    // Trigger onerror with empty error message (typical Safari cross-origin / worker failure behavior)
    currentWorker?.onerror?.({ message: '' } as ErrorEvent);

    await expect(loadPromise).rejects.toThrow('Web Worker failed to initialize or execute');
    expect(controller.loadError).toBe('Web Worker failed to initialize or execute');
    expect(controller.isLoading).toBe(false);

    // Retrying loadModel should initialize a fresh worker instance
    const retryPromise = controller.loadModel();
    expect(latestWorkerInstance).not.toBe(currentWorker);

    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);

    await retryPromise;
    expect(controller.isLoaded).toBe(true);
    expect(controller.loadError).toBeNull();
  });

  it('handles LOAD_ERROR message from worker by setting loadError and resetting isLoading', async () => {
    const loadPromise = controller.loadModel();

    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_ERROR',
        payload: { error: 'Failed to fetch ONNX model' },
      },
    } as MessageEvent);

    await expect(loadPromise).rejects.toThrow('Failed to fetch ONNX model');
    expect(controller.loadError).toBe('Failed to fetch ONNX model');
    expect(controller.isLoading).toBe(false);
    expect(controller.isLoaded).toBe(false);
  });

  it('safely primes audio via unlockAudio and handles play with persistent player', async () => {
    let playCalled = false;
    class MockAudio {
      public src = '';
      public onended: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public play() {
        playCalled = true;
        return Promise.resolve();
      }
      public pause() {}
    }
    vi.stubGlobal('Audio', MockAudio);

    // Call unlockAudio
    controller.unlockAudio();
    expect(playCalled).toBe(true);

    // Calling unlockAudio second time should not re-trigger silent unlock once unlocked
    playCalled = false;
    controller.unlockAudio();
    expect(playCalled).toBe(false);
  });

  it('handles speak playback lifecycle and resolves when audio ends', async () => {
    let mockInstance: MockAudio | null = null;
    function setMockInstance(instance: MockAudio) {
      mockInstance = instance;
    }
    class MockAudio {
      public src = '';
      public onended: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      constructor() {
        setMockInstance(this);
      }
      public play() {
        return Promise.resolve();
      }
      public pause() {}
    }
    vi.stubGlobal('Audio', MockAudio);

    const loadPromise = controller.loadModel();
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);
    await loadPromise;

    const speakPromise = controller.speak('안녕하세요');
    expect(controller.isSpeaking).toBe(true);

    const synthMsg = postedMessages.find(
      (m) => m.type === 'SYNTHESIZE' && m.payload.text === '안녕하세요',
    );
    expect(synthMsg).toBeDefined();

    if (synthMsg && synthMsg.type === 'SYNTHESIZE') {
      latestWorkerInstance?.onmessage?.({
        data: {
          type: 'SYNTHESIS_SUCCESS',
          payload: {
            id: synthMsg.payload.id,
            audioBlobUrl: 'blob:http://localhost/annyeong',
            genTimeMs: 20,
            durationSec: 1.5,
            ipa: 'annyeong',
          },
        },
      } as MessageEvent);
    }

    // Allow promise resolutions in speak() to execute before triggering onended
    await new Promise((r) => setTimeout(r, 20));

    // Trigger onended on the mock audio instance
    expect(mockInstance).not.toBeNull();
    (mockInstance as MockAudio | null)?.onended?.();

    await speakPromise;
    expect(controller.isSpeaking).toBe(false);
  });

  it('sequentially pre-synthesizes upcoming items with preloadBatch and supports cancellation', async () => {
    const loadPromise = controller.loadModel();
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);
    await loadPromise;

    const batchPromise = controller.preloadBatch(['단어1', '단어2', '단어3']);

    // First item '단어1' should be requested
    const synth1 = postedMessages.find(
      (m) => m.type === 'SYNTHESIZE' && m.payload.text === '단어1',
    );
    expect(synth1).toBeDefined();

    if (synth1 && synth1.type === 'SYNTHESIZE') {
      latestWorkerInstance?.onmessage?.({
        data: {
          type: 'SYNTHESIS_SUCCESS',
          payload: {
            id: synth1.payload.id,
            audioBlobUrl: 'blob:http://localhost/word1',
            genTimeMs: 15,
            durationSec: 1.0,
            ipa: 'dan-eo-1',
          },
        },
      } as MessageEvent);
    }

    // Allow event loop to progress to second item '단어2'
    await new Promise((r) => setTimeout(r, 20));

    const synth2 = postedMessages.find(
      (m) => m.type === 'SYNTHESIZE' && m.payload.text === '단어2',
    );
    expect(synth2).toBeDefined();

    // Calling stop() cancels active batch preloading and in-flight synthesis
    controller.stop();

    await batchPromise;

    // Remaining item '단어3' should never have been requested
    const synth3 = postedMessages.find(
      (m) => m.type === 'SYNTHESIZE' && m.payload.text === '단어3',
    );
    expect(synth3).toBeUndefined();
  });

  it('handles synthesis requests initiated while model loading is in flight without race conditions', async () => {
    // 1. Trigger synthesis before model is loaded
    const synthPromise = controller.synthesize('동시합성', 'jm_kumo', 1.0);

    // Verify LOAD_MODEL message was dispatched
    const loadMsg = postedMessages.find((m) => m.type === 'LOAD_MODEL');
    expect(loadMsg).toBeDefined();

    // Verify concurrent calls to loadModel return the same in-flight promise
    const concurrentLoadPromise = controller.loadModel();

    // 2. Simulate progress updates from worker
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_PROGRESS',
        payload: { file: 'model_q8.onnx', progress: 50, status: 'download' },
      },
    } as MessageEvent);

    expect(controller.downloadProgress).toBe(50);

    // 3. Complete model loading
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);

    await concurrentLoadPromise;
    expect(controller.isLoaded).toBe(true);

    // Allow the synthesis promise microtask to advance and post SYNTHESIZE message
    await new Promise((r) => setTimeout(r, 10));

    // 4. Verify the queued synthesis message was posted to worker
    const synthMsg = postedMessages.find(
      (m) => m.type === 'SYNTHESIZE' && m.payload.text === '동시합성',
    );
    expect(synthMsg).toBeDefined();

    if (synthMsg && synthMsg.type === 'SYNTHESIZE') {
      latestWorkerInstance?.onmessage?.({
        data: {
          type: 'SYNTHESIS_SUCCESS',
          payload: {
            id: synthMsg.payload.id,
            audioPcm: new Float32Array(50),
            sampleRate: 24000,
            genTimeMs: 45,
            durationSec: 0.8,
            ipa: 'dong-si-hap-seong',
          },
        },
      } as MessageEvent);
    }

    const resolvedUrl = await synthPromise;
    expect(resolvedUrl).toContain('blob:');
  });

  it('reuses in-flight synthesis promise when speak() is called while preload is actively generating without duplicating synthesis request', async () => {
    // 1. Initialize model
    const loadPromise = controller.loadModel();
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'LOAD_SUCCESS',
        payload: { voices: [] },
      },
    } as MessageEvent);
    await loadPromise;

    // 2. Start preloading an item
    const preloadPromise = controller.preload('미리생성단어', 'jm_kumo', 1.0);

    const synthMessagesFirst = postedMessages.filter(
      (m) => m.type === 'SYNTHESIZE' && m.payload.text === '미리생성단어',
    );
    expect(synthMessagesFirst.length).toBe(1);
    const requestId = (synthMessagesFirst[0] as { payload: { id: string } }).payload.id;

    // 3. While synthesis is in-flight, simulate reaching exercise and calling speak()
    let mockPlayInvoked = false;
    class MockAudioElementForTest {
      public src: string = '';
      public onended: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      constructor() {
        activeAudioInstance = this; // eslint-disable-line @typescript-eslint/no-this-alias
      }
      public async play(): Promise<void> {
        mockPlayInvoked = true;
      }
      public pause(): void {}
    }
    let activeAudioInstance: MockAudioElementForTest | null = null;
    vi.stubGlobal('Audio', MockAudioElementForTest);

    const speakPromise = controller.speak('미리생성단어', 'jm_kumo', 1.0);

    // Verify NO duplicate SYNTHESIZE message was posted
    const synthMessagesSecond = postedMessages.filter(
      (m) => m.type === 'SYNTHESIZE' && m.payload.text === '미리생성단어',
    );
    expect(synthMessagesSecond.length).toBe(1);

    // 4. Respond with synthesis success from worker
    latestWorkerInstance?.onmessage?.({
      data: {
        type: 'SYNTHESIS_SUCCESS',
        payload: {
          id: requestId,
          audioBlobUrl: 'blob:http://localhost/preloaded-audio',
          genTimeMs: 30,
          durationSec: 0.5,
          ipa: 'mi-ri-saeng-seong',
        },
      },
    } as MessageEvent);

    const preloadResult = await preloadPromise;
    expect(preloadResult).toBe('blob:http://localhost/preloaded-audio');

    await new Promise((r) => setTimeout(r, 10));
    expect(mockPlayInvoked).toBe(true);

    (activeAudioInstance as MockAudioElementForTest | null)?.onended?.();
    await speakPromise;
  });
});
