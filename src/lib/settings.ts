/**
 * Supported theme modes: system (follows OS), light, or dark.
 */
export type ThemeMode = 'system' | 'light' | 'dark';

/**
 * User Settings Interface for the Korean Typing Tutor.
 */
export interface TutorSettings {
  showPronunciation: boolean;
  showTranslation: boolean;
  showVirtualKeyboard: boolean;
  theme: ThemeMode;
  enabledModuleIds?: string[];
  collapsedCategoryIds?: string[];
}

/** LocalStorage key for persisting user settings across browser sessions. */
const SETTINGS_STORAGE_KEY = 'korean_tutor_settings';

/** Default application settings. */
export const DEFAULT_SETTINGS: TutorSettings = {
  showPronunciation: true,
  showTranslation: true,
  showVirtualKeyboard: true,
  theme: 'system',
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
    const validThemes: ThemeMode[] = ['system', 'light', 'dark'];
    return {
      showPronunciation:
        typeof parsed.showPronunciation === 'boolean' ? parsed.showPronunciation : true,
      showTranslation: typeof parsed.showTranslation === 'boolean' ? parsed.showTranslation : true,
      showVirtualKeyboard:
        typeof parsed.showVirtualKeyboard === 'boolean' ? parsed.showVirtualKeyboard : true,
      theme: validThemes.includes(parsed.theme) ? parsed.theme : 'system',
      enabledModuleIds: Array.isArray(parsed.enabledModuleIds)
        ? parsed.enabledModuleIds
        : undefined,
      collapsedCategoryIds: Array.isArray(parsed.collapsedCategoryIds)
        ? parsed.collapsedCategoryIds
        : undefined,
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

let mediaQueryCleanup: (() => void) | null = null;

/**
 * Applies the selected theme mode ('system' | 'light' | 'dark') to document.documentElement.
 */
export function applyTheme(themeMode: ThemeMode): void {
  if (typeof document === 'undefined') return;

  if (mediaQueryCleanup) {
    mediaQueryCleanup();
    mediaQueryCleanup = null;
  }

  const root = document.documentElement;

  if (themeMode === 'dark') {
    root.classList.add('dark');
  } else if (themeMode === 'light') {
    root.classList.remove('dark');
  } else {
    // System preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const updateSystemTheme = () => {
        if (mediaQuery.matches) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };
      updateSystemTheme();

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', updateSystemTheme);
        mediaQueryCleanup = () => mediaQuery.removeEventListener('change', updateSystemTheme);
      }
    } else {
      root.classList.remove('dark');
    }
  }
}
