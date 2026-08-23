import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS, applyTheme } from './settings';

describe('Settings module persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    vi.restoreAllMocks();
  });

  it('should return default settings when LocalStorage is empty', () => {
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(settings.theme).toBe('system');
  });

  it('should save and load custom user settings including theme, font size limits, and cursor color', () => {
    saveSettings({
      showPronunciation: false,
      showTranslation: true,
      showVirtualKeyboard: true,
      showKeyboardHint: true,
      theme: 'dark',
      minFontSizeRem: 2.25,
      maxFontSizeRem: 4.5,
      lockFontSize: true,
      cursorColor: 'sky',
    });
    const loaded = loadSettings();
    expect(loaded.showPronunciation).toBe(false);
    expect(loaded.showTranslation).toBe(true);
    expect(loaded.showVirtualKeyboard).toBe(true);
    expect(loaded.theme).toBe('dark');
    expect(loaded.minFontSizeRem).toBe(2.25);
    expect(loaded.maxFontSizeRem).toBe(4.5);
    expect(loaded.lockFontSize).toBe(true);
    expect(loaded.cursorColor).toBe('sky');
  });

  it('should clamp font size bounds outside the [1.0, 7.0] range to defaults', () => {
    localStorage.setItem(
      'korean_tutor_settings',
      JSON.stringify({
        minFontSizeRem: 0.2, // Below 1.0 -> should fallback to 2.0
        maxFontSizeRem: 12.0, // Above 7.0 -> should fallback to 6.0
      }),
    );
    const loaded = loadSettings();
    expect(loaded.minFontSizeRem).toBe(2.0);
    expect(loaded.maxFontSizeRem).toBe(6.0);
  });

  it('should save and load selected curriculum module preferences and collapsed categories/stages', () => {
    saveSettings({
      showPronunciation: true,
      showTranslation: true,
      showVirtualKeyboard: true,
      showKeyboardHint: true,
      theme: 'light',
      enabledModuleIds: ['b1_home_row_vowels', 'l3'],
      collapsedCategoryIds: ['topik2', 'practical'],
      collapsedMasteryStageIds: ['Stage 1: Home Row', 'Batchim Workshop'],
    });
    const loaded = loadSettings();
    expect(loaded.enabledModuleIds).toEqual(['b1_home_row_vowels', 'l3']);
    expect(loaded.collapsedCategoryIds).toEqual(['topik2', 'practical']);
    expect(loaded.collapsedMasteryStageIds).toEqual(['Stage 1: Home Row', 'Batchim Workshop']);

    saveSettings({
      showPronunciation: true,
      showTranslation: true,
      showVirtualKeyboard: true,
      showKeyboardHint: true,
      theme: 'light',
      enabledModuleIds: [],
      collapsedCategoryIds: [],
      collapsedMasteryStageIds: [],
    });
    const loadedEmpty = loadSettings();
    expect(loadedEmpty.enabledModuleIds).toEqual([]);
    expect(loadedEmpty.collapsedCategoryIds).toEqual([]);
    expect(loadedEmpty.collapsedMasteryStageIds).toEqual([]);
  });

  it('should handle invalid JSON, invalid theme, or invalid cursor color string gracefully', () => {
    localStorage.setItem('korean_tutor_settings', 'invalid-json-{');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);

    localStorage.setItem(
      'korean_tutor_settings',
      JSON.stringify({ theme: 'invalid-theme', cursorColor: 'neon-purple' }),
    );
    const loaded = loadSettings();
    expect(loaded.theme).toBe('system');
    expect(loaded.cursorColor).toBe('amber');
  });

  it('should not throw if localStorage throws an error during saveSettings or loadSettings', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => saveSettings(DEFAULT_SETTINGS)).not.toThrow();

    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);

    setItemSpy.mockRestore();
    getItemSpy.mockRestore();
  });

  it('should apply dark and light themes to document element', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should follow OS system preference dynamically when theme is system', () => {
    // Non-null default keeps the handler callable even before the mock
    // captures a listener; addEventListener overwrites it with the real one.
    let changeHandler: (e: { matches: boolean }) => void = () => {
      /* no-op until matchMedia captures the real change handler */
    };
    const mediaQueryObj = {
      matches: true,
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event: string, handler: (e: { matches: boolean }) => void) => {
        if (event === 'change') {
          changeHandler = handler;
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };

    window.matchMedia = vi.fn().mockReturnValue(mediaQueryObj);

    applyTheme('system');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Simulate OS switching to light mode
    mediaQueryObj.matches = false;
    changeHandler({ matches: false });
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should save and load voice synthesis (TTS) settings including speakOnAppearance', () => {
    saveSettings({
      ...DEFAULT_SETTINGS,
      enableTTS: true,
      speakOnCompletion: false,
      speakOnAppearance: true,
      ttsVoice: 'jf_nezumi',
      ttsSpeed: 0.8,
    });
    const loaded = loadSettings();
    expect(loaded.enableTTS).toBe(true);
    expect(loaded.speakOnCompletion).toBe(false);
    expect(loaded.speakOnAppearance).toBe(true);
    expect(loaded.ttsVoice).toBe('jf_nezumi');
    expect(loaded.ttsSpeed).toBe(0.8);
  });
});
