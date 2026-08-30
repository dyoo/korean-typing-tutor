/** Default voice profile identifier (empty string defaults to system Korean voice). */
export const DEFAULT_TTS_VOICE = '';

/** Default speech synthesis rate multiplier. */
export const DEFAULT_TTS_SPEED = 1.0;

/** Information about a discovered native browser speech synthesis voice. */
interface NativeVoiceInfo {
  id: string;
  name: string;
  lang: string;
  isDefault: boolean;
  localService: boolean;
}

export class TTSController {
  private _isSpeaking = $state(false);
  private _nativeVoices = $state<NativeVoiceInfo[]>([]);
  private currentPlaybackToken = 0;

  constructor() {
    this.refreshNativeVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        this.refreshNativeVoices();
      };
    }
  }

  /**
   * Refreshes the list of available Korean voices from the browser's speech synthesis engine.
   */
  public refreshNativeVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this._nativeVoices = [];
      return;
    }

    const voices = window.speechSynthesis.getVoices();
    const koreanVoices = voices.filter(
      (v) =>
        v.lang.toLowerCase().startsWith('ko') ||
        v.lang.toLowerCase().includes('kore') ||
        v.name.toLowerCase().includes('korean') ||
        v.name.includes('한국어') ||
        v.name.includes('Yuna') ||
        v.name.includes('SunHi') ||
        v.name.includes('Heami') ||
        v.name.includes('InJoon'),
    );

    this._nativeVoices = koreanVoices.map((v) => ({
      id: v.voiceURI || v.name,
      name: `${v.name} (${v.lang})`,
      lang: v.lang,
      isDefault: v.default,
      localService: v.localService ?? true,
    }));
  }

  /** Returns all discovered Korean system voices. */
  public get nativeVoices(): NativeVoiceInfo[] {
    if (this._nativeVoices.length === 0) {
      this.refreshNativeVoices();
    }
    return this._nativeVoices;
  }

  /** Returns true if at least one native Korean voice is available. */
  public hasNativeVoices(): boolean {
    return this.nativeVoices.length > 0;
  }

  /** Returns true if at least one on-device offline Korean voice is available. */
  public hasOfflineVoice(): boolean {
    return this.nativeVoices.some((v) => v.localService);
  }

  /** Checks whether a specific voice URI runs locally on-device without internet. */
  public isVoiceOffline(voiceURI?: string): boolean {
    if (!voiceURI) {
      return this.nativeVoices[0]?.localService ?? false;
    }
    const match = this.nativeVoices.find((v) => v.id === voiceURI);
    return match?.localService ?? false;
  }

  /** Cancels any active speech utterance immediately. */
  public stopAudio(): void {
    this.currentPlaybackToken++;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancellation errors
      }
    }
    this._isSpeaking = false;
  }

  public stop(): void {
    this.stopAudio();
  }

  /**
   * Speaks the provided Korean text using the browser's native speech synthesis engine.
   */
  public speak(
    text: string,
    voiceURI: string = DEFAULT_TTS_VOICE,
    speed: number = DEFAULT_TTS_SPEED,
  ): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve();
    }
    if (!text || text.trim().length === 0) {
      return Promise.resolve();
    }

    this.stopAudio();
    const playbackToken = this.currentPlaybackToken;

    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = Math.max(0.5, Math.min(2.0, speed));

        const allVoices = window.speechSynthesis.getVoices();
        if (voiceURI) {
          const selected = allVoices.find((v) => v.voiceURI === voiceURI || v.name === voiceURI);
          if (selected) {
            utterance.voice = selected;
          }
        }
        if (!utterance.voice) {
          const defaultKo = allVoices.find((v) => v.lang.toLowerCase().startsWith('ko'));
          if (defaultKo) {
            utterance.voice = defaultKo;
          }
        }

        this._isSpeaking = true;

        const cleanup = () => {
          utterance.onend = null;
          utterance.onerror = null;
          if (playbackToken === this.currentPlaybackToken) {
            this._isSpeaking = false;
          }
          resolve();
        };

        utterance.onend = cleanup;
        utterance.onerror = cleanup;

        window.speechSynthesis.speak(utterance);
      } catch {
        if (playbackToken === this.currentPlaybackToken) {
          this._isSpeaking = false;
        }
        resolve();
      }
    });
  }

  /** Native speech synthesis does not require async model/buffer loading. */
  public isAudioLoading(): boolean {
    return false;
  }

  public get isSpeaking(): boolean {
    return this._isSpeaking;
  }
}

/** Global singleton instance of the TTS Controller */
export const ttsController = new TTSController();
