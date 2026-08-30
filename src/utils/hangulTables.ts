/**
 * Unicode Base Offset for Hangul Syllables.
 * Hangul Syllables in Unicode span from U+AC00 ('가') to U+D7A3 ('힣').
 */
export const HANGUL_BASE = 0xac00;

import { DUBEOLSIK_KEY_DEFINITIONS } from './keyboardData';

/** Standalone Compatibility Initial Consonant (Choseong) characters (used when rendering partial syllables). */
export const INITIAL_CONSONANT_STANDALONE = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

/** Standalone Compatibility Vowel (Jungseong) characters. */
export const VOWEL_STANDALONE = [
  'ㅏ',
  'ㅐ',
  'ㅑ',
  'ㅒ',
  'ㅓ',
  'ㅔ',
  'ㅕ',
  'ㅖ',
  'ㅗ',
  'ㅘ',
  'ㅙ',
  'ㅚ',
  'ㅛ',
  'ㅜ',
  'ㅝ',
  'ㅞ',
  'ㅟ',
  'ㅠ',
  'ㅡ',
  'ㅢ',
  'ㅣ',
];

/** Standalone Compatibility Final Consonant (Jongseong) characters (0..27). */
export const FINAL_CONSONANT_STANDALONE = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ',
];

/**
 * Direct Hangul Initial Consonant (Choseong) Jamo Mapping (derived from INITIAL_CONSONANT_STANDALONE).
 */
export const DIRECT_INITIAL_CONSONANT_MAP: Record<string, number> = Object.fromEntries(
  INITIAL_CONSONANT_STANDALONE.map((jamo, index) => [jamo, index]),
);

/** Direct Hangul Vowel (Jungseong) Jamo Mapping (derived from VOWEL_STANDALONE). */
export const DIRECT_VOWEL_MAP: Record<string, number> = Object.fromEntries(
  VOWEL_STANDALONE.map((jamo, index) => [jamo, index]),
);

/** Direct Hangul Final Consonant (Jongseong) Jamo Mapping (derived from FINAL_CONSONANT_STANDALONE). */
export const DIRECT_FINAL_CONSONANT_MAP: Record<string, number> = Object.fromEntries(
  FINAL_CONSONANT_STANDALONE.map((jamo, index) => [jamo, index]).filter(([jamo]) => jamo !== ''),
);

function buildQwertyInitialMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const entry of DUBEOLSIK_KEY_DEFINITIONS) {
    if (entry.type === 'consonant') {
      const idx = DIRECT_INITIAL_CONSONANT_MAP[entry.jamo];
      if (idx !== undefined) {
        map[entry.key] = idx;
      }
      if (entry.shiftJamo) {
        const shiftIdx = DIRECT_INITIAL_CONSONANT_MAP[entry.shiftJamo];
        if (shiftIdx !== undefined) {
          map[entry.key.toUpperCase()] = shiftIdx;
        }
      }
    }
  }
  return map;
}

function buildQwertyVowelMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const entry of DUBEOLSIK_KEY_DEFINITIONS) {
    if (entry.type === 'vowel') {
      const idx = DIRECT_VOWEL_MAP[entry.jamo];
      if (idx !== undefined) {
        map[entry.key] = idx;
      }
      if (entry.shiftJamo) {
        const shiftIdx = DIRECT_VOWEL_MAP[entry.shiftJamo];
        if (shiftIdx !== undefined) {
          map[entry.key.toUpperCase()] = shiftIdx;
        }
      }
    }
  }
  return map;
}

function buildQwertyFinalMap(): Record<string, number> {
  const map: Record<string, number> = {};
  for (const entry of DUBEOLSIK_KEY_DEFINITIONS) {
    if (entry.type === 'consonant') {
      const idx = DIRECT_FINAL_CONSONANT_MAP[entry.jamo];
      if (idx !== undefined) {
        map[entry.key] = idx;
      }
      if (entry.shiftJamo) {
        const shiftIdx = DIRECT_FINAL_CONSONANT_MAP[entry.shiftJamo];
        if (shiftIdx !== undefined) {
          map[entry.key.toUpperCase()] = shiftIdx;
        }
      }
    }
  }
  return map;
}

/**
 * QWERTY to Initial Consonant (Choseong) Index Mapping (0..18).
 * Derived from DUBEOLSIK_KEY_DEFINITIONS and DIRECT_INITIAL_CONSONANT_MAP.
 */
export const INITIAL_CONSONANT_MAP: Record<string, number> = buildQwertyInitialMap();

/**
 * QWERTY to Vowel (Jungseong) Index Mapping (0..20).
 * Derived from DUBEOLSIK_KEY_DEFINITIONS and DIRECT_VOWEL_MAP.
 */
export const VOWEL_MAP: Record<string, number> = buildQwertyVowelMap();

/**
 * QWERTY to Final Consonant (Jongseong) Index Mapping (1..27).
 * Note: Index 0 represents NO final consonant.
 * Derived from DUBEOLSIK_KEY_DEFINITIONS and DIRECT_FINAL_CONSONANT_MAP.
 */
export const FINAL_CONSONANT_MAP: Record<string, number> = buildQwertyFinalMap();

/**
 * Compound Vowel (Jungseong) Combinations.
 * Maps pair of (first_vowel, second_vowel) to compound Vowel (Jungseong) index.
 * Example: ㅗ (8) + ㅏ (0) = ㅘ (9).
 */
export const COMPOUND_VOWEL: Record<string, number> = {
  '8,0': 9, // ㅗ + ㅏ = ㅘ
  '8,1': 10, // ㅗ + ㅐ = ㅙ
  '8,20': 11, // ㅗ + ㅣ = ㅚ
  '13,4': 14, // ㅜ + ㅓ = ㅝ
  '13,5': 15, // ㅜ + ㅔ = ㅞ
  '13,20': 16, // ㅜ + ㅣ = ㅟ
  '18,20': 19, // ㅡ + ㅣ = ㅢ
};

/**
 * Decomposition map for compound vowels (Jungseong) (used when Backspace is pressed).
 */
export const COMPOUND_VOWEL_DECOMP: Record<number, [number, number]> = {
  9: [8, 0], // ㅘ -> ㅗ, ㅏ
  10: [8, 1], // ㅙ -> ㅗ, ㅐ
  11: [8, 20], // ㅚ -> ㅗ, ㅣ
  14: [13, 4], // ㅝ -> ㅜ, ㅓ
  15: [13, 5], // ㅞ -> ㅜ, ㅔ
  16: [13, 20], // ㅟ -> ㅜ, ㅣ
  19: [18, 20], // ㅢ -> ㅡ, ㅣ
};

/**
 * Compound Final Consonant (Jongseong) Combinations.
 * Maps pair of (first_final_consonant, second_final_consonant) to compound Final Consonant (Jongseong) index.
 * Example: ㄹ (8) + ㄱ (1) = ㄺ (9).
 */
export const COMPOUND_FINAL_CONSONANT: Record<string, number> = {
  '1,19': 3, // ㄱ + ㅅ = ㄳ
  '4,22': 5, // ㄴ + ㅈ = ㄵ
  '4,27': 6, // ㄴ + ㅎ = ㄶ
  '8,1': 9, // ㄹ + ㄱ = ㄺ
  '8,16': 10, // ㄹ + ㅁ = ㄻ
  '8,17': 11, // ㄹ + ㅂ = ㄼ
  '8,19': 12, // ㄹ + ㅅ = ㄽ
  '8,25': 13, // ㄹ + ㅌ = ㄾ
  '8,26': 14, // ㄹ + ㅍ = ㄿ
  '8,27': 15, // ㄹ + ㅎ = ㅀ
  '17,19': 18, // ㅂ + ㅅ = ㅄ
};

/**
 * Decomposition map for compound final consonants (Jongseong) (used for Backspace and Liaison splitting).
 */
export const COMPOUND_FINAL_CONSONANT_DECOMP: Record<number, [number, number]> = {
  3: [1, 19], // ㄳ -> ㄱ, ㅅ
  5: [4, 22], // ㄵ -> ㄴ, ㅈ
  6: [4, 27], // ㄶ -> ㄴ, ㅎ
  9: [8, 1], // ㄺ -> ㄹ, ㄱ
  10: [8, 16], // ㄻ -> ㄹ, ㅁ
  11: [8, 17], // ㄼ -> ㄹ, ㅂ
  12: [8, 19], // ㄽ -> ㄹ, ㅅ
  13: [8, 25], // ㄾ -> ㄹ, ㅌ
  14: [8, 26], // ㄿ -> ㄹ, ㅍ
  15: [8, 27], // ㅀ -> ㄹ, ㅎ
  18: [17, 19], // ㅄ -> ㅂ, ㅅ
};

/**
 * Map Final Consonant (Jongseong) index to Initial Consonant (Choseong) index.
 * Used when a final consonant carries over to become the initial consonant of the next syllable.
 */
export const FINAL_CONSONANT_TO_INITIAL_CONSONANT: Record<number, number> = {
  1: 0, // ㄱ -> ㄱ
  2: 1, // ㄲ -> ㄲ
  4: 2, // ㄴ -> ㄴ
  7: 3, // ㄷ -> ㄷ
  8: 5, // ㄹ -> ㄹ
  16: 6, // ㅁ -> ㅁ
  17: 7, // ㅂ -> ㅂ
  19: 9, // ㅅ -> ㅅ
  20: 10, // ㅆ -> ㅆ
  21: 11, // ㅇ -> ㅇ
  22: 12, // ㅈ -> ㅈ
  23: 14, // ㅊ -> ㅊ
  24: 15, // ㅋ -> ㅋ
  25: 16, // ㅌ -> ㅌ
  26: 17, // ㅍ -> ㅍ
  27: 18, // ㅎ -> ㅎ
};

/**
 * Explicit helper to construct compound map keys from two numeric Jamo indices.
 * Prevents reliance on implicit toString coercions and makes key generation explicit.
 * Example: makeCompoundKey(8, 0) -> '8,0'
 */
export function makeCompoundKey(firstIndex: number, secondIndex: number): string {
  return `${firstIndex},${secondIndex}`;
}

/**
 * Map of single Final Consonant (Jongseong) index to standalone Initial Consonant (Choseong) / Jamo consonant.
 * Index 1..27 corresponding to Unicode Hangul Final Consonant (Jongseong) definitions.
 */
export const FINAL_CONSONANT_SINGLE_JAMO: Record<number, string> = {
  1: 'ㄱ',
  2: 'ㄲ',
  4: 'ㄴ',
  7: 'ㄷ',
  8: 'ㄹ',
  16: 'ㅁ',
  17: 'ㅂ',
  19: 'ㅅ',
  20: 'ㅆ',
  21: 'ㅇ',
  22: 'ㅈ',
  23: 'ㅊ',
  24: 'ㅋ',
  25: 'ㅌ',
  26: 'ㅍ',
  27: 'ㅎ',
};

/**
 * Checks whether a given character or character code is within the Unicode Hangul Syllables block (U+AC00..U+D7A3).
 */
export function isHangulSyllable(charOrCode: string | number): boolean {
  const code = typeof charOrCode === 'string' ? charOrCode.charCodeAt(0) : charOrCode;
  return code >= HANGUL_BASE && code <= 0xd7a3;
}

function buildStandaloneCompoundMap(): Record<string, string> {
  const map: Record<string, string> = {};

  for (const [compoundIdx, [firstIdx, secondIdx]] of Object.entries(COMPOUND_VOWEL_DECOMP)) {
    const compoundChar = VOWEL_STANDALONE[Number(compoundIdx)];
    const firstChar = VOWEL_STANDALONE[firstIdx];
    const secondChar = VOWEL_STANDALONE[secondIdx];
    if (compoundChar && firstChar && secondChar) {
      map[compoundChar] = `${firstChar}${secondChar}`;
    }
  }

  for (const [compoundIdx, [firstIdx, secondIdx]] of Object.entries(
    COMPOUND_FINAL_CONSONANT_DECOMP,
  )) {
    const compoundChar = FINAL_CONSONANT_STANDALONE[Number(compoundIdx)];
    const firstChar = FINAL_CONSONANT_SINGLE_JAMO[firstIdx];
    const secondChar = FINAL_CONSONANT_SINGLE_JAMO[secondIdx];
    if (compoundChar && firstChar && secondChar) {
      map[compoundChar] = `${firstChar}${secondChar}`;
    }
  }

  return map;
}

/**
 * Map of standalone compound Jamo characters to their decomposed individual Jamo sequence.
 * Derived dynamically from COMPOUND_VOWEL_DECOMP and COMPOUND_FINAL_CONSONANT_DECOMP.
 */
export const STANDALONE_COMPOUND_MAP: Record<string, string> = buildStandaloneCompoundMap();
