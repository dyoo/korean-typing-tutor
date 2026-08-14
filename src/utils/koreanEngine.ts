import type { ErrorReport, SyllableDecomposition } from '../types/korean';

/**
 * Unicode Base Offset for Hangul Syllables.
 * Hangul Syllables in Unicode span from U+AC00 ('가') to U+D7A3 ('힣').
 */
const HANGUL_BASE = 0xac00;

/**
 * QWERTY to Initial Consonant (Choseong) Index Mapping (0..18).
 * In standard Dubeolsik (2-set) Korean keyboard layout:
 * Left-hand keys correspond to consonants.
 */
const INITIAL_CONSONANT_MAP: Record<string, number> = {
  r: 0, // ㄱ
  R: 1, // ㄲ
  s: 2, // ㄴ
  e: 3, // ㄷ
  E: 4, // ㄸ
  f: 5, // ㄹ
  a: 6, // ㅁ
  q: 7, // ㅂ
  Q: 8, // ㅃ
  t: 9, // ㅅ
  T: 10, // ㅆ
  d: 11, // ㅇ
  w: 12, // ㅈ
  W: 13, // ㅉ
  c: 14, // ㅊ
  z: 15, // ㅋ
  x: 16, // ㅌ
  v: 17, // ㅍ
  g: 18, // ㅎ
};

/**
 * QWERTY to Vowel (Jungseong) Index Mapping (0..20).
 * Right-hand keys correspond to vowels.
 */
const VOWEL_MAP: Record<string, number> = {
  k: 0, // ㅏ
  o: 1, // ㅐ
  i: 2, // ㅑ
  O: 3, // ㅒ
  j: 4, // ㅓ
  p: 5, // ㅔ
  u: 6, // ㅕ
  P: 7, // ㅖ
  h: 8, // ㅗ
  y: 12, // ㅛ
  n: 13, // ㅜ
  b: 17, // ㅠ
  m: 18, // ㅡ
  l: 20, // ㅣ
};

/**
 * QWERTY to Final Consonant (Jongseong) Index Mapping (1..27).
 * Note: Index 0 represents NO final consonant.
 * Double consonants ㄸ (E), ㅃ (Q), ㅉ (W) cannot be used as Final Consonant (Jongseong).
 */
const FINAL_CONSONANT_MAP: Record<string, number> = {
  r: 1, // ㄱ
  R: 2, // ㄲ
  s: 4, // ㄴ
  e: 7, // ㄷ
  f: 8, // ㄹ
  a: 16, // ㅁ
  q: 17, // ㅂ
  t: 19, // ㅅ
  T: 20, // ㅆ
  d: 21, // ㅇ
  w: 22, // ㅈ
  c: 23, // ㅊ
  z: 24, // ㅋ
  x: 25, // ㅌ
  v: 26, // ㅍ
  g: 27, // ㅎ
};

/**
 * Compound Vowel (Jungseong) Combinations.
 * Maps pair of (first_vowel, second_vowel) to compound Vowel (Jungseong) index.
 * Example: ㅗ (8) + ㅏ (0) = ㅘ (9).
 */
const COMPOUND_VOWEL: Record<string, number> = {
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
const COMPOUND_VOWEL_DECOMP: Record<number, [number, number]> = {
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
const COMPOUND_FINAL_CONSONANT: Record<string, number> = {
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
const COMPOUND_FINAL_CONSONANT_DECOMP: Record<number, [number, number]> = {
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
const FINAL_CONSONANT_TO_INITIAL_CONSONANT: Record<number, number> = {
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
function makeCompoundKey(firstIndex: number, secondIndex: number): string {
  return `${firstIndex},${secondIndex}`;
}

/** Standalone Compatibility Initial Consonant (Choseong) characters (used when rendering partial syllables). */
const INITIAL_CONSONANT_STANDALONE = [
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
const VOWEL_STANDALONE = [
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
const FINAL_CONSONANT_STANDALONE = [
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

/** Direct Hangul Initial Consonant (Choseong) Jamo Mapping (derived from INITIAL_CONSONANT_STANDALONE). */
const DIRECT_INITIAL_CONSONANT_MAP: Record<string, number> = Object.fromEntries(
  INITIAL_CONSONANT_STANDALONE.map((jamo, index) => [jamo, index]),
);

/** Direct Hangul Vowel (Jungseong) Jamo Mapping (derived from VOWEL_STANDALONE). */
const DIRECT_VOWEL_MAP: Record<string, number> = Object.fromEntries(
  VOWEL_STANDALONE.map((jamo, index) => [jamo, index]),
);

/** Direct Hangul Final Consonant (Jongseong) Jamo Mapping (derived from FINAL_CONSONANT_STANDALONE). */
const DIRECT_FINAL_CONSONANT_MAP: Record<string, number> = Object.fromEntries(
  FINAL_CONSONANT_STANDALONE.map((jamo, index) => [jamo, index]).filter(([jamo]) => jamo !== ''),
);

/**
 * Map of single Final Consonant (Jongseong) index to standalone Initial Consonant (Choseong) / Jamo consonant.
 * Index 1..27 corresponding to Unicode Hangul Final Consonant (Jongseong) definitions.
 */
const FINAL_CONSONANT_SINGLE_JAMO: Record<number, string> = {
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
 * Map of standalone compound Jamo characters to their decomposed individual Jamo sequence.
 */
const STANDALONE_COMPOUND_MAP: Record<string, string> = {
  ㅘ: 'ㅗㅏ',
  ㅙ: 'ㅗㅐ',
  ㅚ: 'ㅗㅣ',
  ㅝ: 'ㅜㅓ',
  ㅞ: 'ㅜㅔ',
  ㅟ: 'ㅜㅣ',
  ㅢ: 'ㅡㅣ',
  ㄳ: 'ㄱㅅ',
  ㄵ: 'ㄴㅈ',
  ㄶ: 'ㄴㅎ',
  ㄺ: 'ㄹㄱ',
  ㄻ: 'ㄹㅁ',
  ㄼ: 'ㄹㅂ',
  ㄽ: 'ㄹㅅ',
  ㄾ: 'ㄹㅌ',
  ㄿ: 'ㄹㅍ',
  ㅀ: 'ㄹㅎ',
  ㅄ: 'ㅂㅅ',
};

/**
 * Decomposes a single character (Hangul Syllable block or Jamo) into its constituent Jamo sequence string.
 * Example: '화' -> "ㅎㅗㅏ", '홧' -> "ㅎㅗㅏㅈ", '닭' -> "ㄷㅏㄹㄱ".
 */
export function decomposeCharToJamos(char: string | undefined): string {
  if (!char) return '';

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
  if (!str) return [];
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
  if (!char) return null;
  const code = char.charCodeAt(0) - HANGUL_BASE;
  if (code < 0 || code > 11171) return null;
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
  if (!char) return null;

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

/**
 * Checks if inputChar is an exact match or a valid partial composition prefix of targetChar.
 * Takes into account an optional nextTargetChar (e.g. the initial consonant of the next syllable)
 * to avoid flagging temporary trailing consonants created during Hangul IME composition as errors.
 */
export function isPartialOrExactMatch(
  targetChar: string | undefined,
  inputChar: string | undefined,
  nextTargetChar?: string,
): boolean {
  if (!inputChar || !targetChar) return false;
  if (targetChar === inputChar) return true;

  let targetJamos = decomposeCharToJamos(targetChar);

  if (nextTargetChar) {
    const nextInitialConsonant = getInitialConsonantJamo(nextTargetChar);
    if (nextInitialConsonant) {
      targetJamos += nextInitialConsonant;
    }
  }

  const inputJamos = decomposeCharToJamos(inputChar);

  return targetJamos.startsWith(inputJamos);
}

/**
 * Checks if inputChar fully completes targetChar.
 * Returns true if inputChar is an exact match for targetChar, OR if inputChar contains
 * the complete targetChar Jamo sequence plus the initial consonant (Choseong) of nextTargetChar.
 *
 * Example:
 * - isSyllableComplete('화', '화', '장') -> true (exact match)
 * - isSyllableComplete('화', compose('ghkw'), '장') -> true ('화' + '장''s Initial Consonant (Choseong) 'ㅈ')
 * - isSyllableComplete('화', compose('ghkd'), '장') -> false ('화' + 'ㅇ' trailing consonant)
 * - isSyllableComplete('장', '자', '실') -> false ('자' is incomplete for '장')
 */
export function isSyllableComplete(
  targetChar: string | undefined,
  inputChar: string | undefined,
  nextTargetChar?: string,
): boolean {
  if (!targetChar || !inputChar) return false;
  if (targetChar === inputChar) return true;

  const targetJamos = decomposeCharToJamos(targetChar);
  const inputJamos = decomposeCharToJamos(inputChar);

  if (inputJamos.startsWith(targetJamos)) {
    const remaining = inputJamos.slice(targetJamos.length);
    if (remaining.length > 0 && nextTargetChar) {
      const nextInitialConsonant = getInitialConsonantJamo(nextTargetChar);
      if (nextInitialConsonant === remaining) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Korean Hangul Composition Engine.
 * Implements a state machine that converts raw QWERTY keystrokes OR native Korean 2-set Jamos into composed Hangul syllables.
 */
export class HangulEngine {
  private currentInitialConsonant: number | null = null;
  private currentVowel: number | null = null;
  private currentFinalConsonant: number | null = null;
  private composedString = '';

  /**
   * Assembles Initial Consonant (Choseong), Vowel (Jungseong), and Final Consonant (Jongseong) indices into a single Unicode Hangul Syllable character.
   * Unicode Hangul Syllable Math Formula:
   *   Code = (InitialConsonantIndex * 21 + VowelIndex) * 28 + FinalConsonantIndex + 0xAC00
   */
  private assemble(initialConsonant: number, vowel: number, finalConsonant: number): string {
    const code = (initialConsonant * 21 + vowel) * 28 + finalConsonant + HANGUL_BASE;
    return String.fromCharCode(code);
  }

  /**
   * Returns the string representation of the syllable block currently being composed.
   */
  private getCurrentChar(): string {
    if (this.currentInitialConsonant !== null && this.currentVowel !== null) {
      return this.assemble(
        this.currentInitialConsonant,
        this.currentVowel,
        this.currentFinalConsonant ?? 0,
      );
    }
    if (this.currentInitialConsonant !== null) {
      return INITIAL_CONSONANT_STANDALONE[this.currentInitialConsonant] ?? '';
    }
    if (this.currentVowel !== null) {
      return VOWEL_STANDALONE[this.currentVowel] ?? '';
    }
    return '';
  }

  /**
   * Flushes the current composing block into the finalized composedString and resets block state.
   */
  private flushCurrent(): void {
    const char = this.getCurrentChar();
    if (char) {
      this.composedString += char;
    }
    this.currentInitialConsonant = null;
    this.currentVowel = null;
    this.currentFinalConsonant = null;
  }

  /**
   * Main entry point: processes a single keystroke (QWERTY key, native Hangul Jamo, space, or Backspace).
   * Updates internal composition state and returns the complete composed text.
   */
  public handleKey(key: string): string {
    // --- 1. Handle Backspace key ---
    if (key === 'Backspace') {
      if (this.currentFinalConsonant !== null && this.currentFinalConsonant > 0) {
        // Decompose compound Final Consonant (Jongseong) back to single Final Consonant, or remove Final Consonant
        if (COMPOUND_FINAL_CONSONANT_DECOMP[this.currentFinalConsonant]) {
          this.currentFinalConsonant =
            COMPOUND_FINAL_CONSONANT_DECOMP[this.currentFinalConsonant][0];
        } else {
          this.currentFinalConsonant = null;
        }
      } else if (this.currentVowel !== null) {
        // Decompose compound Vowel (Jungseong) back to single Vowel, or remove Vowel
        if (COMPOUND_VOWEL_DECOMP[this.currentVowel]) {
          this.currentVowel = COMPOUND_VOWEL_DECOMP[this.currentVowel][0];
        } else {
          this.currentVowel = null;
        }
      } else if (this.currentInitialConsonant !== null) {
        // Remove Initial Consonant (Choseong)
        this.currentInitialConsonant = null;
      } else if (this.composedString.length > 0) {
        // Delete last finished character from composed string
        this.composedString = this.composedString.slice(0, -1);
      }
      return this.getComposedText();
    }

    // Direct composed Hangul Syllable (from native OS IME)
    if (key.length === 1 && key.charCodeAt(0) >= HANGUL_BASE && key.charCodeAt(0) <= 0xd7a3) {
      this.flushCurrent();
      this.composedString += key;
      return this.getComposedText();
    }

    // Lookup Jamo indices from QWERTY maps or direct Hangul Jamo maps
    let initialConsonant = INITIAL_CONSONANT_MAP[key] ?? DIRECT_INITIAL_CONSONANT_MAP[key];
    let vowel = VOWEL_MAP[key] ?? DIRECT_VOWEL_MAP[key];
    let finalConsonant = FINAL_CONSONANT_MAP[key] ?? DIRECT_FINAL_CONSONANT_MAP[key];

    /**
     * Standard Dubeolsik (2-set) Shift Key Handling:
     * In standard Dubeolsik, only 7 Shift keys have double consonant / compound vowel mappings:
     *   R (ㄲ), E (ㄸ), Q (ㅃ), T (ㅆ), W (ㅉ), O (ㅒ), P (ㅖ).
     * For all other uppercase letters (such as 'X', 'Z', 'C', 'V', 'G', etc.), standard Dubeolsik
     * treats Shift + Key identically to its lower-case key (e.g. 'X' -> 'x' -> ㅌ).
     */
    if (
      initialConsonant === undefined &&
      vowel === undefined &&
      finalConsonant === undefined &&
      key.length === 1 &&
      key >= 'A' &&
      key <= 'Z'
    ) {
      const lower = key.toLowerCase();
      initialConsonant = INITIAL_CONSONANT_MAP[lower];
      vowel = VOWEL_MAP[lower];
      finalConsonant = FINAL_CONSONANT_MAP[lower];
    }

    // --- 2. Handle non-Korean keys (spaces, numbers, punctuation) ---
    if (initialConsonant === undefined && vowel === undefined) {
      this.flushCurrent();
      this.composedString += key;
      return this.getComposedText();
    }

    // --- 3. State 1: Empty block (start new syllable) ---
    if (this.currentInitialConsonant === null && this.currentVowel === null) {
      if (initialConsonant !== undefined) {
        this.currentInitialConsonant = initialConsonant;
      } else if (vowel !== undefined) {
        this.currentVowel = vowel;
      }
      return this.getComposedText();
    }

    // --- 4. State 2: Block has Initial Consonant (Choseong) only (e.g. 'ㄱ') ---
    if (this.currentInitialConsonant !== null && this.currentVowel === null) {
      if (vowel !== undefined) {
        // Add vowel -> forms syllable (e.g. 'ㄱ' + 'ㅏ' -> '가')
        this.currentVowel = vowel;
      } else if (initialConsonant !== undefined) {
        // Double initial consonant typed without vowel -> flush prev, start new block
        this.flushCurrent();
        this.currentInitialConsonant = initialConsonant;
      }
      return this.getComposedText();
    }

    // --- 5. State 3: Block has standalone Vowel (Jungseong) only (e.g. 'ㅏ') ---
    if (this.currentInitialConsonant === null && this.currentVowel !== null) {
      if (vowel !== undefined) {
        const compoundKey = makeCompoundKey(this.currentVowel, vowel);
        if (COMPOUND_VOWEL[compoundKey] !== undefined) {
          this.currentVowel = COMPOUND_VOWEL[compoundKey];
        } else {
          this.flushCurrent();
          this.currentVowel = vowel;
        }
      } else if (initialConsonant !== undefined) {
        this.flushCurrent();
        this.currentInitialConsonant = initialConsonant;
      }
      return this.getComposedText();
    }

    // --- 6. State 4: Block has Initial Consonant (Choseong) + Vowel (Jungseong) (e.g. '가') ---
    if (
      this.currentInitialConsonant !== null &&
      this.currentVowel !== null &&
      (this.currentFinalConsonant === null || this.currentFinalConsonant === 0)
    ) {
      if (vowel !== undefined) {
        // Try combining into compound vowel (e.g. '고' + 'ㅏ' -> '과')
        const compoundKey = makeCompoundKey(this.currentVowel, vowel);
        if (COMPOUND_VOWEL[compoundKey] !== undefined) {
          this.currentVowel = COMPOUND_VOWEL[compoundKey];
        } else {
          this.flushCurrent();
          this.currentVowel = vowel;
        }
      } else if (finalConsonant !== undefined) {
        // Add final consonant (e.g. '하' + 'ㄴ' -> '한')
        this.currentFinalConsonant = finalConsonant;
      } else if (initialConsonant !== undefined) {
        this.flushCurrent();
        this.currentInitialConsonant = initialConsonant;
      }
      return this.getComposedText();
    }

    // --- 7. State 5: Block has Initial Consonant (Choseong) + Vowel (Jungseong) + Final Consonant (Jongseong) (e.g. '한' or '닭') ---
    if (
      this.currentInitialConsonant !== null &&
      this.currentVowel !== null &&
      this.currentFinalConsonant !== null &&
      this.currentFinalConsonant > 0
    ) {
      if (vowel !== undefined) {
        /**
         * Liaison Rule / Syllable Splitting:
         * A vowel is typed after a syllable that already has a final consonant (Jongseong).
         * 1) If Final Consonant (Jongseong) is compound (e.g. '닭' = '달' + 'ㄱ'):
         *    First part ('ㄹ') stays as final consonant of 1st syllable.
         *    Second part ('ㄱ') becomes initial consonant of 2nd syllable ('기') -> '달기'.
         * 2) If Final Consonant (Jongseong) is single (e.g. '한' + 'ㅏ'):
         *    The final consonant ('ㄴ') moves to become initial consonant of 2nd syllable ('나') -> '하나'.
         */
        if (COMPOUND_FINAL_CONSONANT_DECOMP[this.currentFinalConsonant]) {
          const [firstFinalConsonant, secondFinalConsonant] =
            COMPOUND_FINAL_CONSONANT_DECOMP[this.currentFinalConsonant];
          this.currentFinalConsonant = firstFinalConsonant;
          const firstChar = this.getCurrentChar();
          this.composedString += firstChar;

          this.currentInitialConsonant = FINAL_CONSONANT_TO_INITIAL_CONSONANT[secondFinalConsonant];
          this.currentVowel = vowel;
          this.currentFinalConsonant = null;
        } else {
          const prevFinalConsonant = this.currentFinalConsonant;
          this.currentFinalConsonant = null;
          const firstChar = this.getCurrentChar();
          this.composedString += firstChar;

          this.currentInitialConsonant = FINAL_CONSONANT_TO_INITIAL_CONSONANT[prevFinalConsonant];
          this.currentVowel = vowel;
          this.currentFinalConsonant = null;
        }
      } else if (finalConsonant !== undefined) {
        // Try combining into compound Final Consonant (Jongseong) (e.g. '달' + 'ㄱ' -> '닭')
        const compoundKey = makeCompoundKey(this.currentFinalConsonant, finalConsonant);
        if (COMPOUND_FINAL_CONSONANT[compoundKey] !== undefined) {
          this.currentFinalConsonant = COMPOUND_FINAL_CONSONANT[compoundKey];
        } else if (initialConsonant !== undefined) {
          this.flushCurrent();
          this.currentInitialConsonant = initialConsonant;
        }
      } else if (initialConsonant !== undefined) {
        this.flushCurrent();
        this.currentInitialConsonant = initialConsonant;
      }
      return this.getComposedText();
    }

    return this.getComposedText();
  }

  /**
   * Returns complete text: finalized string + currently active composing block.
   */
  public getComposedText(): string {
    return this.composedString + this.getCurrentChar();
  }

  /**
   * Resets engine state for a new typing lesson.
   */
  /**
   * Resets engine state for a new typing lesson.
   */
  public reset(): void {
    this.currentInitialConsonant = null;
    this.currentVowel = null;
    this.currentFinalConsonant = null;
    this.composedString = '';
  }

  /**
   * Resets engine state and re-hydrates composition state from prefix string.
   * Completed syllable blocks are stored directly in composedString without active Jamos,
   * while trailing standalone Jamos are restored into active initial/vowel composition state.
   */
  public resetTo(prefix: string): void {
    this.reset();
    if (!prefix) return;

    const lastChar = prefix[prefix.length - 1];
    const initIdx = INITIAL_CONSONANT_STANDALONE.indexOf(lastChar);
    const vowelIdx = VOWEL_STANDALONE.indexOf(lastChar);

    if (initIdx !== -1) {
      this.composedString = prefix.slice(0, -1);
      this.currentInitialConsonant = initIdx;
    } else if (vowelIdx !== -1) {
      this.composedString = prefix.slice(0, -1);
      this.currentVowel = vowelIdx;
    } else {
      this.composedString = prefix;
    }
  }

  /**
   * Compares target string vs user composed input and returns error flags per character position.
   * Utilizes isPartialOrExactMatch to ensure valid in-progress Hangul syllables are not marked as errors.
   */
  public checkErrors(target: string, input: string): ErrorReport[] {
    return checkErrors(target, input);
  }
}

/**
 * Utility function to compute error reports for target text vs user input.
 */
export function checkErrors(target: string, input: string): ErrorReport[] {
  const errors: ErrorReport[] = [];
  const maxLength = Math.max(target.length, input.length);

  for (let i = 0; i < maxLength; i++) {
    const t = target[i];
    const inp = input[i];
    const nextT = target[i + 1];

    let isError = false;
    if (inp !== undefined) {
      if (t === undefined) {
        isError = true;
      } else if (i < input.length - 1) {
        isError = inp !== t;
      } else {
        isError = !isPartialOrExactMatch(t, inp, nextT);
      }
    }

    errors.push({
      index: i,
      isError,
    });
  }
  return errors;
}

/**
 * Helper function to compose a string of raw QWERTY keystrokes into Hangul.
 */
export function compose(input: string): string {
  const engine = new HangulEngine();
  for (const char of input) {
    engine.handleKey(char);
  }
  return engine.getComposedText();
}

/**
 * Calculates the active target character index for cursor display on the main target text.
 * Determines the target character being actively composed based on the prefix of userInput up to inputCursorIndex.
 * Clamps result to target.length - 1 when not completed so the target cursor never disappears.
 */
export function calculateTargetCursorIndex(
  target: string,
  userInput: string,
  isCompleted: boolean,
  inputCursorIndex?: number,
): number {
  if (isCompleted || !target) {
    return -1;
  }
  const effectiveInput =
    typeof inputCursorIndex === 'number' && inputCursorIndex >= 0
      ? userInput.slice(0, inputCursorIndex)
      : userInput;

  if (effectiveInput.length === 0) {
    return 0;
  }
  const lastIndex = effectiveInput.length - 1;
  const isLastComplete = isSyllableComplete(
    target[lastIndex],
    effectiveInput[lastIndex],
    target[lastIndex + 1],
  );
  const rawIndex = isLastComplete ? effectiveInput.length : lastIndex;
  return Math.min(rawIndex, target.length - 1);
}

/**
 * Calculates the active input position index for cursor display on the user input display.
 * Returns -1 if completed, or an index from 0 to userInput.length.
 */
export function calculateInputCursorIndex(
  userInput: string,
  target: string,
  isCompleted: boolean,
  inputCursorIndex?: number,
): number {
  if (isCompleted) {
    return -1;
  }
  if (typeof inputCursorIndex === 'number' && inputCursorIndex >= 0) {
    return Math.min(inputCursorIndex, userInput.length);
  }
  if (userInput.length === 0) {
    return 0;
  }
  const lastIndex = userInput.length - 1;
  const isLastComplete = isSyllableComplete(
    target[lastIndex],
    userInput[lastIndex],
    target[lastIndex + 1],
  );
  return isLastComplete ? userInput.length : lastIndex;
}

export interface WordTokenGroup {
  type: 'word' | 'space';
  indices: number[];
}

/**
 * Groups character indices of a target string into word tokens and space tokens.
 * Ensures words and their trailing punctuation (e.g. "입니다.") remain bound together
 * inside single inline-flex containers to prevent lone punctuation line wrapping.
 */
export function getWordTokens(target: string): WordTokenGroup[] {
  const tokens: WordTokenGroup[] = [];
  let currentWordIndices: number[] = [];

  for (let i = 0; i < target.length; i++) {
    if (target[i] === ' ') {
      if (currentWordIndices.length > 0) {
        tokens.push({ type: 'word', indices: currentWordIndices });
        currentWordIndices = [];
      }
      tokens.push({ type: 'space', indices: [i] });
    } else {
      currentWordIndices.push(i);
    }
  }

  if (currentWordIndices.length > 0) {
    tokens.push({ type: 'word', indices: currentWordIndices });
  }

  return tokens;
}
