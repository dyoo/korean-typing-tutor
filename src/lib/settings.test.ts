import { describe, it, expect, beforeEach } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS, applyTheme } from './settings';

describe('Settings module persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });

  it('should return default settings when LocalStorage is empty', () => {
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
    expect(settings.theme).toBe('system');
  });

  it('should save and load custom user settings including theme and font size limits', () => {
    saveSettings({
      showPronunciation: false,
      showTranslation: true,
      showVirtualKeyboard: true,
      theme: 'dark',
      minFontSizeRem: 2.25,
      maxFontSizeRem: 4.5,
      lockFontSize: true,
    });
    const loaded = loadSettings();
    expect(loaded.showPronunciation).toBe(false);
    expect(loaded.showTranslation).toBe(true);
    expect(loaded.showVirtualKeyboard).toBe(true);
    expect(loaded.theme).toBe('dark');
    expect(loaded.minFontSizeRem).toBe(2.25);
    expect(loaded.maxFontSizeRem).toBe(4.5);
    expect(loaded.lockFontSize).toBe(true);
  });

  it('should save and load selected curriculum module preferences and collapsed categories', () => {
    saveSettings({
      showPronunciation: true,
      showTranslation: true,
      showVirtualKeyboard: true,
      theme: 'light',
      enabledModuleIds: ['b1_home_row_vowels', 'l3'],
      collapsedCategoryIds: ['topik2', 'practical'],
    });
    const loaded = loadSettings();
    expect(loaded.enabledModuleIds).toEqual(['b1_home_row_vowels', 'l3']);
    expect(loaded.collapsedCategoryIds).toEqual(['topik2', 'practical']);

    saveSettings({
      showPronunciation: true,
      showTranslation: true,
      showVirtualKeyboard: true,
      theme: 'light',
      enabledModuleIds: [],
      collapsedCategoryIds: [],
    });
    const loadedEmpty = loadSettings();
    expect(loadedEmpty.enabledModuleIds).toEqual([]);
    expect(loadedEmpty.collapsedCategoryIds).toEqual([]);
  });

  it('should handle invalid JSON or invalid theme string gracefully', () => {
    localStorage.setItem('korean_tutor_settings', 'invalid-json-{');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);

    localStorage.setItem('korean_tutor_settings', JSON.stringify({ theme: 'invalid-theme' }));
    expect(loadSettings().theme).toBe('system');
  });

  it('should apply dark and light themes to document element', () => {
    applyTheme('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    applyTheme('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
