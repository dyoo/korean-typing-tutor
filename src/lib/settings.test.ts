import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './settings';

describe('Settings module persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default settings when LocalStorage is empty', () => {
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it('should save and load custom user settings', () => {
    saveSettings({ showPronunciation: false, showTranslation: true });
    const loaded = loadSettings();
    expect(loaded.showPronunciation).toBe(false);
    expect(loaded.showTranslation).toBe(true);
  });

  it('should handle invalid JSON in LocalStorage gracefully', () => {
    localStorage.setItem('korean_tutor_settings', 'invalid-json-{');
    const settings = loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });
});
