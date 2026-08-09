/**
 * User Settings Interface for the Korean Typing Tutor.
 */
export interface TutorSettings {
  showPronunciation: boolean;
  showTranslation: boolean;
}

/** LocalStorage key for persisting user settings across browser sessions. */
const SETTINGS_STORAGE_KEY = 'korean_tutor_settings';

/** Default application settings. */
export const DEFAULT_SETTINGS: TutorSettings = {
  showPronunciation: true,
  showTranslation: true
};

/**
 * Loads user settings from LocalStorage.
 * Falls back to default settings if no settings are saved or parsing fails.
 */
export function loadSettings(): TutorSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      showPronunciation: typeof parsed.showPronunciation === 'boolean' ? parsed.showPronunciation : true,
      showTranslation: typeof parsed.showTranslation === 'boolean' ? parsed.showTranslation : true
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Persists user settings to LocalStorage.
 */
export function saveSettings(settings: TutorSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Graceful fallback if LocalStorage is restricted or quota exceeded
  }
}
