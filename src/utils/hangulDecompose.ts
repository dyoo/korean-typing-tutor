import type { SyllableDecomposition } from '../types/korean';
import {
  HANGUL_BASE,
  COMPOUND_VOWEL_DECOMP,
  VOWEL_STANDALONE,
  COMPOUND_FINAL_CONSONANT_DECOMP,
  FINAL_CONSONANT_SINGLE_JAMO,
  FINAL_CONSONANT_STANDALONE,
  INITIAL_CONSONANT_STANDALONE,
  STANDALONE_COMPOUND_MAP,
} from './hangulTables';

/**
 * Decomposes a single character (Hangul Syllable block or Jamo) into its constituent Jamo sequence string.
 * Example: '화' -> "ㅎㅗㅏ", '홧' -> "ㅎㅗㅏㅈ", '닭' -> "ㄷㅏㄹㄱ".
 */
export function decomposeCharToJamos(char: string | undefined): string {
  if (!char) {
    return '';
  }

  const code = char.charCodeAt(0);
  if (code >= HANGUL_BASE && code <= 0xd7a3) {
    const offset = code - HANGUL_BASE;
    const finalConsonantIndex = offset % 28;
    const vowelIndex = Math.floor(offset / 28) % 21;
    const initialConsonantIndex = Math.floor(offset / (21 * 28));

    let result = INITIAL_CONSONANT_STANDALONE[initialConsonantIndex] ?? '';

    // Decompose Vowel (Jungseong)
    if (COMPOUND_VOWEL_DECOMP[vowelIndex]) {
      const [v1, v2] = COMPOUND_VOWEL_DECOMP[vowelIndex];
      result += (VOWEL_STANDALONE[v1] ?? '') + (VOWEL_STANDALONE[v2] ?? '');
    } else {
      result += VOWEL_STANDALONE[vowelIndex] ?? '';
    }

    // Decompose Final Consonant (Jongseong)
    if (finalConsonantIndex > 0) {
      if (COMPOUND_FINAL_CONSONANT_DECOMP[finalConsonantIndex]) {
        const [f1, f2] = COMPOUND_FINAL_CONSONANT_DECOMP[finalConsonantIndex];
        result += (FINAL_CONSONANT_SINGLE_JAMO[f1] ?? '') + (FINAL_CONSONANT_SINGLE_JAMO[f2] ?? '');
      } else {
        result += FINAL_CONSONANT_SINGLE_JAMO[finalConsonantIndex] ?? '';
      }
    }

    return result;
  }

  // Handle standalone compound Jamos
  if (STANDALONE_COMPOUND_MAP[char]) {
    return STANDALONE_COMPOUND_MAP[char];
  }

  return char;
}

/**
 * Decomposes an entire string (syllables, standalone Jamos, and spaces) into an array of individual Jamos and spaces.
 * Example: '하나와' -> ['ㅎ', 'ㅏ', 'ㄴ', 'ㅏ', 'ㅇ', 'ㅗ', 'ㅏ']
 * Example: '사 과' -> ['ㅅ', 'ㅏ', ' ', 'ㄱ', 'ㅗ', 'ㅏ']
 */
export function decomposeStringToJamos(str: string | undefined): string[] {
  if (!str) {
    return [];
  }
  const result: string[] = [];
  for (const char of str) {
    if (char === ' ') {
      result.push(' ');
    } else {
      const jamos = decomposeCharToJamos(char);
      for (const jamo of jamos) {
        result.push(jamo);
      }
    }
  }
  return result;
}

/**
 * Decomposes a single Hangul syllable character into its constituent Jamo (Choseong, Jungseong, Jongseong).
 * Returns null if the character is outside the Unicode Hangul Syllables block (U+AC00..U+D7A3).
 */
export function decomposeSyllable(char: string | undefined): SyllableDecomposition | null {
  if (!char) {
    return null;
  }
  const code = char.charCodeAt(0) - HANGUL_BASE;
  if (code < 0 || code > 11171) {
    return null;
  }
  const initialConsonantIndex = Math.floor(code / 588);
  const vowelIndex = Math.floor((code % 588) / 28);
  const finalConsonantIndex = code % 28;
  return {
    initialConsonant: INITIAL_CONSONANT_STANDALONE[initialConsonantIndex] ?? '',
    vowel: VOWEL_STANDALONE[vowelIndex] ?? '',
    finalConsonant: FINAL_CONSONANT_STANDALONE[finalConsonantIndex] || null,
  };
}

/**
 * Extracts the Initial Consonant (Choseong) Jamo character from a given character.
 * Example: '장' -> 'ㅈ', 'ㅈ' -> 'ㅈ'.
 */
export function getInitialConsonantJamo(char: string | undefined): string | null {
  if (!char) {
    return null;
  }

  const code = char.charCodeAt(0);
  if (code >= HANGUL_BASE && code <= 0xd7a3) {
    const offset = code - HANGUL_BASE;
    const initialConsonantIndex = Math.floor(offset / (21 * 28));
    return INITIAL_CONSONANT_STANDALONE[initialConsonantIndex] ?? null;
  }

  if (INITIAL_CONSONANT_STANDALONE.includes(char)) {
    return char;
  }

  return null;
}
