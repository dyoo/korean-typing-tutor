import type { CursorColorMode } from '../utils/cursorColor';

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
  showKeyboardHint: boolean;
  theme: ThemeMode;
  enabledModuleIds?: string[];
  collapsedCategoryIds?: string[];
  minFontSizeRem?: number;
  maxFontSizeRem?: number;
  lockFontSize?: boolean;
  cursorColor?: CursorColorMode;
  enableTTS?: boolean;
  speakOnCompletion?: boolean;
  ttsVoice?: string;
  ttsSpeed?: number;
}

/** LocalStorage key for persisting user settings across browser sessions. */
const SETTINGS_STORAGE_KEY = 'korean_tutor_settings';

/** Default application settings. */
export const DEFAULT_SETTINGS: TutorSettings = {
  showPronunciation: true,
  showTranslation: true,
  showVirtualKeyboard: true,
  showKeyboardHint: true,
  theme: 'system',
  minFontSizeRem: 1.25,
  maxFontSizeRem: 5.5,
  lockFontSize: false,
  cursorColor: 'amber',
  enableTTS: false,
  speakOnCompletion: true,
  ttsVoice: 'jf_nezumi',
  ttsSpeed: 1.0,
};

/**
 * Loads user settings from LocalStorage.
 * Falls back to default settings if no settings are saved or parsing fails.
 */
export function loadSettings(): TutorSettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    const validThemes: ThemeMode[] = ['light', 'dark', 'system'];
    const validCursorColors: CursorColorMode[] = ['amber', 'sky', 'emerald', 'blue'];
    return {
      showPronunciation:
        typeof parsed.showPronunciation === 'boolean' ? parsed.showPronunciation : true,
      showTranslation: typeof parsed.showTranslation === 'boolean' ? parsed.showTranslation : true,
      showVirtualKeyboard:
        typeof parsed.showVirtualKeyboard === 'boolean' ? parsed.showVirtualKeyboard : true,
      showKeyboardHint:
        typeof parsed.showKeyboardHint === 'boolean' ? parsed.showKeyboardHint : true,
      theme: validThemes.includes(parsed.theme) ? parsed.theme : 'system',
      enabledModuleIds: Array.isArray(parsed.enabledModuleIds)
        ? parsed.enabledModuleIds
        : undefined,
      collapsedCategoryIds: Array.isArray(parsed.collapsedCategoryIds)
        ? parsed.collapsedCategoryIds
        : undefined,
      minFontSizeRem:
        typeof parsed.minFontSizeRem === 'number' &&
        parsed.minFontSizeRem >= 1.0 &&
        parsed.minFontSizeRem <= 7.0
          ? parsed.minFontSizeRem
          : 1.25,
      maxFontSizeRem:
        typeof parsed.maxFontSizeRem === 'number' &&
        parsed.maxFontSizeRem >= 1.0 &&
        parsed.maxFontSizeRem <= 7.0
          ? parsed.maxFontSizeRem
          : 5.5,
      lockFontSize: typeof parsed.lockFontSize === 'boolean' ? parsed.lockFontSize : false,
      cursorColor: validCursorColors.includes(parsed.cursorColor) ? parsed.cursorColor : 'amber',
      enableTTS: typeof parsed.enableTTS === 'boolean' ? parsed.enableTTS : false,
      speakOnCompletion:
        typeof parsed.speakOnCompletion === 'boolean' ? parsed.speakOnCompletion : true,
      ttsVoice: typeof parsed.ttsVoice === 'string' ? parsed.ttsVoice : 'jf_nezumi',
      ttsSpeed:
        typeof parsed.ttsSpeed === 'number' && parsed.ttsSpeed >= 0.5 && parsed.ttsSpeed <= 2.0
          ? parsed.ttsSpeed
          : 1.0,
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
  if (typeof document === 'undefined') {
    return;
  }

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
