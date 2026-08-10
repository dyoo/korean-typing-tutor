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

  it('should save and load custom user settings including theme', () => {
    saveSettings({ showPronunciation: false, showTranslation: true, theme: 'dark' });
    const loaded = loadSettings();
    expect(loaded.showPronunciation).toBe(false);
    expect(loaded.showTranslation).toBe(true);
    expect(loaded.theme).toBe('dark');
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
