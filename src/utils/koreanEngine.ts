import type { ErrorReport } from '../types/korean';

/**
 * Unicode Base Offset for Hangul Syllables.
 * Hangul Syllables in Unicode span from U+AC00 ('가') to U+D7A3 ('힣').
 */
const HANGUL_BASE = 0xac00;

/**
 * QWERTY to Choseong (Initial Consonant) Index Mapping (0..18).
 * In standard Dubeolsik (2-set) Korean keyboard layout:
 * Left-hand keys correspond to consonants.
 */
const CHOSEONG_MAP: Record<string, number> = {
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
 * QWERTY to Jungseong (Medial Vowel) Index Mapping (0..20).
 * Right-hand keys correspond to vowels.
 */
const JUNGSEONG_MAP: Record<string, number> = {
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
 * QWERTY to Jongseong (Final Consonant) Index Mapping (1..27).
 * Note: Index 0 represents NO final consonant.
 * Double consonants ㄸ (E), ㅃ (Q), ㅉ (W) cannot be used as Jongseong.
 */
const JONGSEONG_MAP: Record<string, number> = {
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

/** Direct Hangul Choseong Jamo Mapping (for native 2-set Korean OS input mode). */
const DIRECT_CHOSEONG_MAP: Record<string, number> = {
  ㄱ: 0,
  ㄲ: 1,
  ㄴ: 2,
  ㄷ: 3,
  ㄸ: 4,
  ㄹ: 5,
  ㅁ: 6,
  ㅂ: 7,
  ㅃ: 8,
  ㅅ: 9,
  ㅆ: 10,
  ㅇ: 11,
  ㅈ: 12,
  ㅉ: 13,
  ㅊ: 14,
  ㅋ: 15,
  ㅌ: 16,
  ㅍ: 17,
  ㅎ: 18,
};

/** Direct Hangul Jungseong Jamo Mapping (for native 2-set Korean OS input mode). */
const DIRECT_JUNGSEONG_MAP: Record<string, number> = {
  ㅏ: 0,
  ㅐ: 1,
  ㅑ: 2,
  ㅒ: 3,
  ㅓ: 4,
  ㅔ: 5,
  ㅕ: 6,
  ㅖ: 7,
  ㅗ: 8,
  ㅘ: 9,
  ㅙ: 10,
  ㅚ: 11,
  ㅛ: 12,
  ㅜ: 13,
  ㅝ: 14,
  ㅞ: 15,
  ㅟ: 16,
  ㅠ: 17,
  ㅡ: 18,
  ㅢ: 19,
  ㅣ: 20,
};

/** Direct Hangul Jongseong Jamo Mapping (for native 2-set Korean OS input mode). */
const DIRECT_JONGSEONG_MAP: Record<string, number> = {
  ㄱ: 1,
  ㄲ: 2,
  ㄳ: 3,
  ㄴ: 4,
  ㄵ: 5,
  ㄶ: 6,
  ㄷ: 7,
  ㄹ: 8,
  ㄺ: 9,
  ㄻ: 10,
  ㄼ: 11,
  ㄽ: 12,
  ㄾ: 13,
  ㄿ: 14,
  ㅀ: 15,
  ㅁ: 16,
  ㅂ: 17,
  ㅄ: 18,
  ㅅ: 19,
  ㅆ: 20,
  ㅇ: 21,
  ㅈ: 22,
  ㅊ: 23,
  ㅋ: 24,
  ㅌ: 25,
  ㅍ: 26,
  ㅎ: 27,
};

/**
 * Compound Vowel Combinations.
 * Maps pair of (first_vowel, second_vowel) to compound Jungseong index.
 * Example: ㅗ (8) + ㅏ (0) = ㅘ (9).
 */
const COMPOUND_JUNGSEONG: Record<string, number> = {
  '8,0': 9, // ㅗ + ㅏ = ㅘ
  '8,1': 10, // ㅗ + ㅐ = ㅙ
  '8,20': 11, // ㅗ + ㅣ = ㅚ
  '13,4': 14, // ㅜ + ㅓ = ㅝ
  '13,5': 15, // ㅜ + ㅔ = ㅞ
  '13,20': 16, // ㅜ + ㅣ = ㅟ
  '18,20': 19, // ㅡ + ㅣ = ㅢ
};

/**
 * Decomposition map for compound vowels (used when Backspace is pressed).
 */
const COMPOUND_JUNGSEONG_DECOMP: Record<number, [number, number]> = {
  9: [8, 0], // ㅘ -> ㅗ, ㅏ
  10: [8, 1], // ㅙ -> ㅗ, ㅐ
  11: [8, 20], // ㅚ -> ㅗ, ㅣ
  14: [13, 4], // ㅝ -> ㅜ, ㅓ
  15: [13, 5], // ㅞ -> ㅜ, ㅔ
  16: [13, 20], // ㅟ -> ㅜ, ㅣ
  19: [18, 20], // ㅢ -> ㅡ, ㅣ
};

/**
 * Compound Final Consonant Combinations.
 * Maps pair of (first_jongseong, second_jongseong) to compound Jongseong index.
 * Example: ㄹ (8) + ㄱ (1) = ㄺ (9).
 */
const COMPOUND_JONGSEONG: Record<string, number> = {
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
 * Decomposition map for compound final consonants (used for Backspace and Liaison splitting).
 */
const COMPOUND_JONGSEONG_DECOMP: Record<number, [number, number]> = {
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
 * Map Jongseong index to Choseong index.
 * Used when a final consonant carries over to become the initial consonant of the next syllable.
 */
const JONGSEONG_TO_CHOSEONG: Record<number, number> = {
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

/** Standalone Compatibility Choseong characters (used when rendering partial syllables). */
const CHOSEONG_STANDALONE = [
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

/** Standalone Compatibility Jungseong characters. */
const JUNGSEONG_STANDALONE = [
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

/**
 * Map of single Jongseong index to standalone Choseong/Jamo consonant.
 * Index 1..27 corresponding to Unicode Hangul Jongseong definitions.
 */
const JONGSEONG_SINGLE_JAMO: Record<number, string> = {
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
    const jongIndex = offset % 28;
    const jungIndex = Math.floor(offset / 28) % 21;
    const choIndex = Math.floor(offset / (21 * 28));

    let result = CHOSEONG_STANDALONE[choIndex] ?? '';

    // Decompose Jungseong (vowel)
    if (COMPOUND_JUNGSEONG_DECOMP[jungIndex]) {
      const [v1, v2] = COMPOUND_JUNGSEONG_DECOMP[jungIndex];
      result += (JUNGSEONG_STANDALONE[v1] ?? '') + (JUNGSEONG_STANDALONE[v2] ?? '');
    } else {
      result += JUNGSEONG_STANDALONE[jungIndex] ?? '';
    }

    // Decompose Jongseong (final consonant)
    if (jongIndex > 0) {
      if (COMPOUND_JONGSEONG_DECOMP[jongIndex]) {
        const [j1, j2] = COMPOUND_JONGSEONG_DECOMP[jongIndex];
        result += (JONGSEONG_SINGLE_JAMO[j1] ?? '') + (JONGSEONG_SINGLE_JAMO[j2] ?? '');
      } else {
        result += JONGSEONG_SINGLE_JAMO[jongIndex] ?? '';
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
 * Extracts the Choseong (initial consonant) Jamo character from a given character.
 * Example: '장' -> 'ㅈ', 'ㅈ' -> 'ㅈ'.
 */
export function getChoseongJamo(char: string | undefined): string | null {
  if (!char) return null;

  const code = char.charCodeAt(0);
  if (code >= HANGUL_BASE && code <= 0xd7a3) {
    const offset = code - HANGUL_BASE;
    const choIndex = Math.floor(offset / (21 * 28));
    return CHOSEONG_STANDALONE[choIndex] ?? null;
  }

  if (CHOSEONG_STANDALONE.includes(char)) {
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
    const nextCho = getChoseongJamo(nextTargetChar);
    if (nextCho) {
      targetJamos += nextCho;
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
 * - isSyllableComplete('화', compose('ghkw'), '장') -> true ('화' + '장''s Choseong 'ㅈ')
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
      const nextCho = getChoseongJamo(nextTargetChar);
      if (nextCho === remaining) {
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
  private currentChoseong: number | null = null;
  private currentJungseong: number | null = null;
  private currentJongseong: number | null = null;
  private composedString = '';

  /**
   * Assembles Choseong, Jungseong, and Jongseong indices into a single Unicode Hangul Syllable character.
   * Unicode Hangul Syllable Math Formula:
   *   Code = (ChoseongIndex * 21 + JungseongIndex) * 28 + JongseongIndex + 0xAC00
   */
  private assemble(c: number, v: number, f: number): string {
    const code = (c * 21 + v) * 28 + f + HANGUL_BASE;
    return String.fromCharCode(code);
  }

  /**
   * Returns the string representation of the syllable block currently being composed.
   */
  private getCurrentChar(): string {
    if (this.currentChoseong !== null && this.currentJungseong !== null) {
      return this.assemble(this.currentChoseong, this.currentJungseong, this.currentJongseong ?? 0);
    }
    if (this.currentChoseong !== null) {
      return CHOSEONG_STANDALONE[this.currentChoseong] ?? '';
    }
    if (this.currentJungseong !== null) {
      return JUNGSEONG_STANDALONE[this.currentJungseong] ?? '';
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
    this.currentChoseong = null;
    this.currentJungseong = null;
    this.currentJongseong = null;
  }

  /**
   * Main entry point: processes a single keystroke (QWERTY key, native Hangul Jamo, space, or Backspace).
   * Updates internal composition state and returns the complete composed text.
   */
  public handleKey(key: string): string {
    // --- 1. Handle Backspace key ---
    if (key === 'Backspace') {
      if (this.currentJongseong !== null && this.currentJongseong > 0) {
        // Decompose compound Jongseong back to single Jongseong, or remove Jongseong
        if (COMPOUND_JONGSEONG_DECOMP[this.currentJongseong]) {
          this.currentJongseong = COMPOUND_JONGSEONG_DECOMP[this.currentJongseong][0];
        } else {
          this.currentJongseong = null;
        }
      } else if (this.currentJungseong !== null) {
        // Decompose compound Jungseong back to single Jungseong, or remove Jungseong
        if (COMPOUND_JUNGSEONG_DECOMP[this.currentJungseong]) {
          this.currentJungseong = COMPOUND_JUNGSEONG_DECOMP[this.currentJungseong][0];
        } else {
          this.currentJungseong = null;
        }
      } else if (this.currentChoseong !== null) {
        // Remove Choseong
        this.currentChoseong = null;
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
    let cho = CHOSEONG_MAP[key] ?? DIRECT_CHOSEONG_MAP[key];
    let jung = JUNGSEONG_MAP[key] ?? DIRECT_JUNGSEONG_MAP[key];
    let jong = JONGSEONG_MAP[key] ?? DIRECT_JONGSEONG_MAP[key];

    /**
     * Standard Dubeolsik (2-set) Shift Key Handling:
     * In standard Dubeolsik, only 7 Shift keys have double consonant / compound vowel mappings:
     *   R (ㄲ), E (ㄸ), Q (ㅃ), T (ㅆ), W (ㅉ), O (ㅒ), P (ㅖ).
     * For all other uppercase letters (such as 'X', 'Z', 'C', 'V', 'G', etc.), standard Dubeolsik
     * treats Shift + Key identically to its lower-case key (e.g. 'X' -> 'x' -> ㅌ).
     */
    if (
      cho === undefined &&
      jung === undefined &&
      jong === undefined &&
      key.length === 1 &&
      key >= 'A' &&
      key <= 'Z'
    ) {
      const lower = key.toLowerCase();
      cho = CHOSEONG_MAP[lower];
      jung = JUNGSEONG_MAP[lower];
      jong = JONGSEONG_MAP[lower];
    }

    // --- 2. Handle non-Korean keys (spaces, numbers, punctuation) ---
    if (cho === undefined && jung === undefined) {
      this.flushCurrent();
      this.composedString += key;
      return this.getComposedText();
    }

    // --- 3. State 1: Empty block (start new syllable) ---
    if (this.currentChoseong === null && this.currentJungseong === null) {
      if (cho !== undefined) {
        this.currentChoseong = cho;
      } else if (jung !== undefined) {
        this.currentJungseong = jung;
      }
      return this.getComposedText();
    }

    // --- 4. State 2: Block has Choseong only (e.g. 'ㄱ') ---
    if (this.currentChoseong !== null && this.currentJungseong === null) {
      if (jung !== undefined) {
        // Add vowel -> forms syllable (e.g. 'ㄱ' + 'ㅏ' -> '가')
        this.currentJungseong = jung;
      } else if (cho !== undefined) {
        // Double initial consonant typed without vowel -> flush prev, start new block
        this.flushCurrent();
        this.currentChoseong = cho;
      }
      return this.getComposedText();
    }

    // --- 5. State 3: Block has standalone Jungseong only (e.g. 'ㅏ') ---
    if (this.currentChoseong === null && this.currentJungseong !== null) {
      if (jung !== undefined) {
        const compoundKey = makeCompoundKey(this.currentJungseong, jung);
        if (COMPOUND_JUNGSEONG[compoundKey] !== undefined) {
          this.currentJungseong = COMPOUND_JUNGSEONG[compoundKey];
        } else {
          this.flushCurrent();
          this.currentJungseong = jung;
        }
      } else if (cho !== undefined) {
        this.flushCurrent();
        this.currentChoseong = cho;
      }
      return this.getComposedText();
    }

    // --- 6. State 4: Block has Choseong + Jungseong (e.g. '가') ---
    if (
      this.currentChoseong !== null &&
      this.currentJungseong !== null &&
      (this.currentJongseong === null || this.currentJongseong === 0)
    ) {
      if (jung !== undefined) {
        // Try combining into compound vowel (e.g. '고' + 'ㅏ' -> '과')
        const compoundKey = makeCompoundKey(this.currentJungseong, jung);
        if (COMPOUND_JUNGSEONG[compoundKey] !== undefined) {
          this.currentJungseong = COMPOUND_JUNGSEONG[compoundKey];
        } else {
          this.flushCurrent();
          this.currentJungseong = jung;
        }
      } else if (jong !== undefined) {
        // Add final consonant (e.g. '하' + 'ㄴ' -> '한')
        this.currentJongseong = jong;
      } else if (cho !== undefined) {
        this.flushCurrent();
        this.currentChoseong = cho;
      }
      return this.getComposedText();
    }

    // --- 7. State 5: Block has Choseong + Jungseong + Jongseong (e.g. '한' or '닭') ---
    if (
      this.currentChoseong !== null &&
      this.currentJungseong !== null &&
      this.currentJongseong !== null &&
      this.currentJongseong > 0
    ) {
      if (jung !== undefined) {
        /**
         * Liaison Rule / Syllable Splitting:
         * A vowel is typed after a syllable that already has a final consonant (Jongseong).
         * 1) If Jongseong is compound (e.g. '닭' = '달' + 'ㄱ'):
         *    First part ('ㄹ') stays as final consonant of 1st syllable.
         *    Second part ('ㄱ') becomes initial consonant of 2nd syllable ('기') -> '달기'.
         * 2) If Jongseong is single (e.g. '한' + 'ㅏ'):
         *    The final consonant ('ㄴ') moves to become initial consonant of 2nd syllable ('나') -> '하나'.
         */
        if (COMPOUND_JONGSEONG_DECOMP[this.currentJongseong]) {
          const [firstJong, secondJong] = COMPOUND_JONGSEONG_DECOMP[this.currentJongseong];
          this.currentJongseong = firstJong;
          const firstChar = this.getCurrentChar();
          this.composedString += firstChar;

          this.currentChoseong = JONGSEONG_TO_CHOSEONG[secondJong];
          this.currentJungseong = jung;
          this.currentJongseong = null;
        } else {
          const prevJong = this.currentJongseong;
          this.currentJongseong = null;
          const firstChar = this.getCurrentChar();
          this.composedString += firstChar;

          this.currentChoseong = JONGSEONG_TO_CHOSEONG[prevJong];
          this.currentJungseong = jung;
          this.currentJongseong = null;
        }
      } else if (jong !== undefined) {
        // Try combining into compound Jongseong (e.g. '달' + 'ㄱ' -> '닭')
        const compoundKey = makeCompoundKey(this.currentJongseong, jong);
        if (COMPOUND_JONGSEONG[compoundKey] !== undefined) {
          this.currentJongseong = COMPOUND_JONGSEONG[compoundKey];
        } else if (cho !== undefined) {
          this.flushCurrent();
          this.currentChoseong = cho;
        }
      } else if (cho !== undefined) {
        this.flushCurrent();
        this.currentChoseong = cho;
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
  public reset(): void {
    this.currentChoseong = null;
    this.currentJungseong = null;
    this.currentJongseong = null;
    this.composedString = '';
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
        isError = !isSyllableComplete(t, inp, nextT);
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
 * Clamps result to target.length - 1 when not completed so the target cursor never disappears.
 */
export function calculateTargetCursorIndex(
  target: string,
  userInput: string,
  isCompleted: boolean,
): number {
  if (isCompleted || !target) {
    return -1;
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
  const rawIndex = isLastComplete ? userInput.length : lastIndex;
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
): number {
  if (isCompleted) {
    return -1;
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
