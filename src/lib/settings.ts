import type { CursorColorMode } from '../utils/cursorColor';
import { DEFAULT_TTS_VOICE, DEFAULT_TTS_SPEED } from '../utils/ttsController.svelte';

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
  collapsedMasteryStageIds?: string[];
  minFontSizeRem?: number;
  maxFontSizeRem?: number;
  lockFontSize?: boolean;
  cursorColor?: CursorColorMode;
  enableTTS?: boolean;
  speakOnCompletion?: boolean;
  speakOnAppearance?: boolean;
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
  minFontSizeRem: 2.0,
  maxFontSizeRem: 6.0,
  lockFontSize: false,
  cursorColor: 'amber',
  enableTTS: false,
  speakOnCompletion: true,
  speakOnAppearance: false,
  ttsVoice: DEFAULT_TTS_VOICE,
  ttsSpeed: DEFAULT_TTS_SPEED,
};

function pickBool(val: unknown, fallback: boolean): boolean {
  return typeof val === 'boolean' ? val : fallback;
}

function pickNumberRange(
  val: unknown,
  min: number,
  max: number,
  fallback: number | undefined,
): number | undefined {
  return typeof val === 'number' && val >= min && val <= max ? val : fallback;
}

function pickEnum<T extends string>(val: unknown, valid: readonly T[], fallback: T): T {
  return typeof val === 'string' && (valid as readonly unknown[]).includes(val)
    ? (val as T)
    : fallback;
}

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
    const validThemes: readonly ThemeMode[] = ['light', 'dark', 'system'];
    const validCursorColors: readonly CursorColorMode[] = ['amber', 'sky', 'emerald', 'blue'];

    return {
      showPronunciation: pickBool(parsed.showPronunciation, DEFAULT_SETTINGS.showPronunciation),
      showTranslation: pickBool(parsed.showTranslation, DEFAULT_SETTINGS.showTranslation),
      showVirtualKeyboard: pickBool(
        parsed.showVirtualKeyboard,
        DEFAULT_SETTINGS.showVirtualKeyboard,
      ),
      showKeyboardHint: pickBool(parsed.showKeyboardHint, DEFAULT_SETTINGS.showKeyboardHint),
      theme: pickEnum(parsed.theme, validThemes, DEFAULT_SETTINGS.theme),
      enabledModuleIds: Array.isArray(parsed.enabledModuleIds)
        ? parsed.enabledModuleIds
        : undefined,
      collapsedCategoryIds: Array.isArray(parsed.collapsedCategoryIds)
        ? parsed.collapsedCategoryIds
        : undefined,
      collapsedMasteryStageIds: Array.isArray(parsed.collapsedMasteryStageIds)
        ? parsed.collapsedMasteryStageIds
        : undefined,
      minFontSizeRem: pickNumberRange(parsed.minFontSizeRem, 1.0, 7.0, DEFAULT_SETTINGS.minFontSizeRem),
      maxFontSizeRem: pickNumberRange(parsed.maxFontSizeRem, 1.0, 7.0, DEFAULT_SETTINGS.maxFontSizeRem),
      lockFontSize: pickBool(parsed.lockFontSize, DEFAULT_SETTINGS.lockFontSize ?? false),
      cursorColor: pickEnum(parsed.cursorColor, validCursorColors, DEFAULT_SETTINGS.cursorColor ?? 'amber'),
      enableTTS: pickBool(parsed.enableTTS, DEFAULT_SETTINGS.enableTTS ?? false),
      speakOnCompletion: pickBool(
        parsed.speakOnCompletion,
        DEFAULT_SETTINGS.speakOnCompletion ?? true,
      ),
      speakOnAppearance: pickBool(
        parsed.speakOnAppearance,
        DEFAULT_SETTINGS.speakOnAppearance ?? false,
      ),
      ttsVoice: typeof parsed.ttsVoice === 'string' ? parsed.ttsVoice : DEFAULT_SETTINGS.ttsVoice,
      ttsSpeed: pickNumberRange(parsed.ttsSpeed, 0.5, 2.0, DEFAULT_SETTINGS.ttsSpeed),
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
