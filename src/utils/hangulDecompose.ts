import type { FinalConsonantIndex, InitialConsonantIndex, SyllableDecomposition, VowelIndex, HangulSyllable } from '../types/korean';
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
 * Returns the constituent Jamo indices (initialConsonant, vowel, finalConsonant)
 * for a Unicode Hangul Syllable character (U+AC00..U+D7A3), or null if the
 * character is outside that block.
 *
 * Unicode Hangul Syllable Math (single source of truth for the decomposition):
 *   offset        = code - 0xAC00
 *   initialIndex  = floor(offset / 588)        (588 = 21 vowels x 28 final consonants)
 *   vowelIndex    = floor((offset % 588) / 28)
 *   finalIndex    = offset % 28
 */
function getSyllableIndices(
  char: string,
): { initialConsonantIndex: InitialConsonantIndex; vowelIndex: VowelIndex; finalConsonantIndex: FinalConsonantIndex } | null {
  const offset = char.charCodeAt(0) - HANGUL_BASE;
  if (offset < 0 || offset > 11171) {
    return null;
  }
  return {
    initialConsonantIndex: Math.floor(offset / 588) as InitialConsonantIndex,
    vowelIndex: Math.floor((offset % 588) / 28) as VowelIndex,
    finalConsonantIndex: offset % 28 as FinalConsonantIndex,
  };
}

/**
 * Assembles initialConsonant, vowel, and finalConsonant indices into a single
 * Unicode Hangul Syllable character. The inverse of `getSyllableIndices`.
 *   code = (initialIndex * 21 + vowelIndex) * 28 + finalIndex + 0xAC00
 */
export function assembleSyllable(
  initialConsonantIndex: InitialConsonantIndex,
  vowelIndex: VowelIndex,
  finalConsonantIndex: FinalConsonantIndex,
): HangulSyllable {
  const code = (initialConsonantIndex * 21 + vowelIndex) * 28 + finalConsonantIndex + HANGUL_BASE;
  return String.fromCharCode(code) as HangulSyllable;
}

/**
 * Decomposes a single character (Hangul Syllable block or Jamo) into its constituent Jamo sequence string.
 * Example: '화' -> "ㅎㅗㅏ", '홧' -> "ㅎㅗㅏㅈ", '닭' -> "ㄷㅏㄹㄱ".
 */
export function decomposeCharToJamos(char: string | undefined): string {
  if (!char) {
    return '';
  }

  const indices = getSyllableIndices(char);
  if (indices) {
    const { initialConsonantIndex, vowelIndex, finalConsonantIndex } = indices;

    let result = INITIAL_CONSONANT_STANDALONE[initialConsonantIndex] ?? '';

    // Decompose vowel
    if (COMPOUND_VOWEL_DECOMP[vowelIndex]) {
      const [v1, v2] = COMPOUND_VOWEL_DECOMP[vowelIndex];
      result += (VOWEL_STANDALONE[v1] ?? '') + (VOWEL_STANDALONE[v2] ?? '');
    } else {
      result += VOWEL_STANDALONE[vowelIndex] ?? '';
    }

    // Decompose finalConsonant
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
 * Decomposes a single Hangul syllable character into its constituent Jamo
 * (initialConsonant, vowel, finalConsonant).
 * Returns null if the character is outside the Unicode Hangul Syllables block (U+AC00..U+D7A3).
 */
export function decomposeSyllable(char: string | undefined): SyllableDecomposition | null {
  if (!char) {
    return null;
  }
  const indices = getSyllableIndices(char);
  if (!indices) {
    return null;
  }
  const { initialConsonantIndex, vowelIndex, finalConsonantIndex } = indices;
  return {
    initialConsonant: INITIAL_CONSONANT_STANDALONE[initialConsonantIndex] ?? '',
    vowel: VOWEL_STANDALONE[vowelIndex] ?? '',
    finalConsonant: FINAL_CONSONANT_STANDALONE[finalConsonantIndex] || null,
  };
}

/**
 * Extracts the initialConsonant Jamo character from a given character.
 * Example: '장' -> 'ㅈ', 'ㅈ' -> 'ㅈ'.
 */
export function getInitialConsonantJamo(char: string | undefined): string | null {
  if (!char) {
    return null;
  }

  if (INITIAL_CONSONANT_STANDALONE.includes(char)) {
    return char;
  }

  return decomposeSyllable(char)?.initialConsonant ?? null;
}
