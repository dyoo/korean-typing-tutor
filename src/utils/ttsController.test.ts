import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TTSController, DEFAULT_TTS_SPEED } from './ttsController.svelte';

describe('TTSController Unit Tests (Native Speech)', () => {
  let controller: TTSController;
  let mockVoices: Array<{
    voiceURI: string;
    name: string;
    lang: string;
    default: boolean;
    localService: boolean;
  }> = [];
  let spokenUtterances: SpeechSynthesisUtterance[] = [];
  let mockCancel: ReturnType<typeof vi.fn>;
  let mockSpeak: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockVoices = [
      {
        voiceURI: 'com.apple.speech.synthesis.voice.yuna',
        name: 'Yuna',
        lang: 'ko-KR',
        default: true,
        localService: true,
      },
      {
        voiceURI: 'com.apple.speech.synthesis.voice.alex',
        name: 'Alex',
        lang: 'en-US',
        default: false,
        localService: true,
      },
      {
        voiceURI: 'Google 한국어',
        name: 'Google 한국어',
        lang: 'ko-KR',
        default: false,
        localService: false,
      },
      {
        voiceURI: 'Microsoft SunHi Online (Natural) - Korean',
        name: 'Microsoft SunHi',
        lang: 'ko-KR',
        default: false,
        localService: true,
      },
    ];
    spokenUtterances = [];
    mockCancel = vi.fn();
    mockSpeak = vi.fn((utterance: SpeechSynthesisUtterance) => {
      spokenUtterances.push(utterance);
      setTimeout(() => {
        utterance.onend?.(new Event('end') as SpeechSynthesisEvent);
      }, 5);
    });

    vi.stubGlobal('speechSynthesis', {
      getVoices: () => mockVoices,
      speak: mockSpeak,
      cancel: mockCancel,
      onvoiceschanged: null,
    });

    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class MockUtterance {
        public text: string;
        public lang = '';
        public rate = 1.0;
        public voice: unknown = null;
        public onend: ((e: Event) => void) | null = null;
        public onerror: ((e: Event) => void) | null = null;
        constructor(text: string) {
          this.text = text;
        }
      },
    );

    controller = new TTSController();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('initializes with default state', () => {
    expect(controller.isSpeaking).toBe(false);
    expect(controller.isAudioLoading()).toBe(false);
  });

  it('discovers and filters native Korean system voices with offline metadata', () => {
    expect(controller.hasNativeVoices()).toBe(true);
    expect(controller.hasOfflineVoice()).toBe(true);
    expect(controller.nativeVoices.length).toBe(3);
    expect(controller.nativeVoices[0].id).toBe('com.apple.speech.synthesis.voice.yuna');
    expect(controller.nativeVoices[0].localService).toBe(true);
    expect(controller.isVoiceOffline('com.apple.speech.synthesis.voice.yuna')).toBe(true);
    expect(controller.isVoiceOffline('Google 한국어')).toBe(false);
  });

  it('speaks using native Web Speech API with default voice and rate', async () => {
    const speakPromise = controller.speak('안녕하세요');
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
    expect(controller.isSpeaking).toBe(true);

    await speakPromise;

    expect(spokenUtterances.length).toBe(1);
    expect(spokenUtterances[0].text).toBe('안녕하세요');
    expect(spokenUtterances[0].lang).toBe('ko-KR');
    expect(spokenUtterances[0].rate).toBe(DEFAULT_TTS_SPEED);
    expect(controller.isSpeaking).toBe(false);
  });

  it('speaks with customized rate and specific voice URI', async () => {
    const speakPromise = controller.speak(
      '감사합니다',
      'Microsoft SunHi Online (Natural) - Korean',
      1.3,
    );
    await speakPromise;

    expect(spokenUtterances.length).toBe(1);
    expect(spokenUtterances[0].text).toBe('감사합니다');
    expect(spokenUtterances[0].rate).toBe(1.3);
    expect(spokenUtterances[0].voice).toEqual(mockVoices[3]);
  });

  it('ignores empty or whitespace-only text', async () => {
    await controller.speak('');
    await controller.speak('   ');
    expect(mockSpeak).not.toHaveBeenCalled();
  });

  it('cancels active speech when stopAudio or stop is invoked', () => {
    controller.stopAudio();
    expect(mockCancel).toHaveBeenCalled();
    expect(controller.isSpeaking).toBe(false);

    controller.stop();
    expect(mockCancel).toHaveBeenCalledTimes(2);
  });

  it('handles speech error gracefully without getting stuck in speaking state', async () => {
    mockSpeak = vi.fn((utterance: SpeechSynthesisUtterance) => {
      setTimeout(() => {
        utterance.onerror?.(new Event('error') as SpeechSynthesisErrorEvent);
      }, 5);
    });

    vi.stubGlobal('speechSynthesis', {
      getVoices: () => mockVoices,
      speak: mockSpeak,
      cancel: mockCancel,
      onvoiceschanged: null,
    });

    await controller.speak('테스트');
    expect(controller.isSpeaking).toBe(false);
  });
});
