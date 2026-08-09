import type { ErrorReport } from '../types/korean';

/**
 * Unicode Base Offset for Hangul Syllables.
 * Hangul Syllables in Unicode span from U+AC00 ('가') to U+D7A3 ('힣').
 */
const HANGUL_BASE = 0xAC00;

/**
 * QWERTY to Choseong (Initial Consonant) Index Mapping (0..18).
 * In standard Dubeolsik (2-set) Korean keyboard layout:
 * Left-hand keys correspond to consonants.
 */
const CHOSEONG_MAP: Record<string, number> = {
  'r': 0,  // ㄱ
  'R': 1,  // ㄲ
  's': 2,  // ㄴ
  'e': 3,  // ㄷ
  'E': 4,  // ㄸ
  'f': 5,  // ㄹ
  'a': 6,  // ㅁ
  'q': 7,  // ㅂ
  'Q': 8,  // ㅃ
  't': 9,  // ㅅ
  'T': 10, // ㅆ
  'd': 11, // ㅇ
  'w': 12, // ㅈ
  'W': 13, // ㅉ
  'c': 14, // ㅊ
  'z': 15, // ㅋ
  'x': 16, // ㅌ
  'v': 17, // ㅍ
  'g': 18  // ㅎ
};

/**
 * QWERTY to Jungseong (Medial Vowel) Index Mapping (0..20).
 * Right-hand keys correspond to vowels.
 */
const JUNGSEONG_MAP: Record<string, number> = {
  'k': 0,  // ㅏ
  'o': 1,  // ㅐ
  'i': 2,  // ㅑ
  'O': 3,  // ㅒ
  'j': 4,  // ㅓ
  'p': 5,  // ㅔ
  'u': 6,  // ㅕ
  'P': 7,  // ㅖ
  'h': 8,  // ㅗ
  'y': 12, // ㅛ
  'n': 13, // ㅜ
  'b': 17, // ㅠ
  'm': 18, // ㅡ
  'l': 20  // ㅣ
};

/**
 * QWERTY to Jongseong (Final Consonant) Index Mapping (1..27).
 * Note: Index 0 represents NO final consonant.
 * Double consonants ㄸ (E), ㅃ (Q), ㅉ (W) cannot be used as Jongseong.
 */
const JONGSEONG_MAP: Record<string, number> = {
  'r': 1,  // ㄱ
  'R': 2,  // ㄲ
  's': 4,  // ㄴ
  'e': 7,  // ㄷ
  'f': 8,  // ㄹ
  'a': 16, // ㅁ
  'q': 17, // ㅂ
  't': 19, // ㅅ
  'T': 20, // ㅆ
  'd': 21, // ㅇ
  'w': 22, // ㅈ
  'c': 23, // ㅊ
  'z': 24, // ㅋ
  'x': 25, // ㅌ
  'v': 26, // ㅍ
  'g': 27  // ㅎ
};

/**
 * Compound Vowel Combinations.
 * Maps pair of (first_vowel, second_vowel) to compound Jungseong index.
 * Example: ㅗ (8) + ㅏ (0) = ㅘ (9).
 */
const COMPOUND_JUNGSEONG: Record<string, number> = {
  '8,0': 9,   // ㅗ + ㅏ = ㅘ
  '8,1': 10,  // ㅗ + ㅐ = ㅙ
  '8,20': 11, // ㅗ + ㅣ = ㅚ
  '13,4': 14, // ㅜ + ㅓ = ㅝ
  '13,5': 15, // ㅜ + ㅔ = ㅞ
  '13,20': 16,// ㅜ + ㅣ = ㅟ
  '18,20': 19 // ㅡ + ㅣ = ㅢ
};

/**
 * Decomposition map for compound vowels (used when Backspace is pressed).
 */
const COMPOUND_JUNGSEONG_DECOMP: Record<number, [number, number]> = {
  9: [8, 0],   // ㅘ -> ㅗ, ㅏ
  10: [8, 1],  // ㅙ -> ㅗ, ㅐ
  11: [8, 20], // ㅚ -> ㅗ, ㅣ
  14: [13, 4], // ㅝ -> ㅜ, ㅓ
  15: [13, 5], // ㅞ -> ㅜ, ㅔ
  16: [13, 20],// ㅟ -> ㅜ, ㅣ
  19: [18, 20] // ㅢ -> ㅡ, ㅣ
};

/**
 * Compound Final Consonant Combinations.
 * Maps pair of (first_jongseong, second_jongseong) to compound Jongseong index.
 * Example: ㄹ (8) + ㄱ (1) = ㄺ (9).
 */
const COMPOUND_JONGSEONG: Record<string, number> = {
  '1,19': 3,  // ㄱ + ㅅ = ㄳ
  '4,22': 5,  // ㄴ + ㅈ = ㄵ
  '4,27': 6,  // ㄴ + ㅎ = ㄶ
  '8,1': 9,   // ㄹ + ㄱ = ㄺ
  '8,16': 10, // ㄹ + ㅁ = ㄻ
  '8,17': 11, // ㄹ + ㅂ = ㄼ
  '8,19': 12, // ㄹ + ㅅ = ㄽ
  '8,25': 13, // ㄹ + ㅌ = ㄾ
  '8,26': 14, // ㄹ + ㅍ = ㄿ
  '8,27': 15, // ㄹ + ㅎ = ㅀ
  '17,19': 18 // ㅂ + ㅅ = ㅄ
};

/**
 * Decomposition map for compound final consonants (used for Backspace and Liaison splitting).
 */
const COMPOUND_JONGSEONG_DECOMP: Record<number, [number, number]> = {
  3: [1, 19],  // ㄳ -> ㄱ, ㅅ
  5: [4, 22],  // ㄵ -> ㄴ, ㅈ
  6: [4, 27],  // ㄶ -> ㄴ, ㅎ
  9: [8, 1],   // ㄺ -> ㄹ, ㄱ
  10: [8, 16], // ㄻ -> ㄹ, ㅁ
  11: [8, 17], // ㄼ -> ㄹ, ㅂ
  12: [8, 19], // ㄽ -> ㄹ, ㅅ
  13: [8, 25], // ㄾ -> ㄹ, ㅌ
  14: [8, 26], // ㄿ -> ㄹ, ㅍ
  15: [8, 27], // ㅀ -> ㄹ, ㅎ
  18: [17, 19] // ㅄ -> ㅂ, ㅅ
};

/**
 * Map Jongseong index to Choseong index.
 * Used when a final consonant carries over to become the initial consonant of the next syllable.
 */
const JONGSEONG_TO_CHOSEONG: Record<number, number> = {
  1: 0,   // ㄱ -> ㄱ
  2: 1,   // ㄲ -> ㄲ
  4: 2,   // ㄴ -> ㄴ
  7: 3,   // ㄷ -> ㄷ
  8: 5,   // ㄹ -> ㄹ
  16: 6,  // ㅁ -> ㅁ
  17: 7,  // ㅂ -> ㅂ
  19: 9,  // ㅅ -> ㅅ
  20: 10, // ㅆ -> ㅆ
  21: 11, // ㅇ -> ㅇ
  22: 12, // ㅈ -> ㅈ
  23: 14, // ㅊ -> ㅊ
  24: 15, // ㅋ -> ㅋ
  25: 16, // ㅌ -> ㅌ
  26: 17, // ㅍ -> ㅍ
  27: 18  // ㅎ -> ㅎ
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
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

/** Standalone Compatibility Jungseong characters. */
const JUNGSEONG_STANDALONE = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

/**
 * Checks if inputChar is an exact match or a valid partial composition prefix of targetChar.
 * Prevents flagging valid in-progress Hangul syllables (e.g. typing 'ㅅ' while composing '사') as errors.
 */
export function isPartialOrExactMatch(targetChar: string | undefined, inputChar: string | undefined): boolean {
  if (!inputChar) return false;
  if (!targetChar) return false;
  if (targetChar === inputChar) return true;

  const targetCode = targetChar.charCodeAt(0);
  if (targetCode < HANGUL_BASE || targetCode > 0xD7A3) {
    return false;
  }

  const offset = targetCode - HANGUL_BASE;
  const targetJong = offset % 28;
  const targetJung = Math.floor(offset / 28) % 21;
  const targetCho = Math.floor(offset / (21 * 28));

  // Case 1: Input is standalone Choseong matching target's Choseong (e.g. 'ㅅ' for '사')
  if (CHOSEONG_STANDALONE[targetCho] === inputChar) {
    return true;
  }

  // Case 2: Input is base syllable without Jongseong (e.g. '사' for '산')
  const baseSyllable = String.fromCharCode((targetCho * 21 + targetJung) * 28 + HANGUL_BASE);
  if (baseSyllable === inputChar) {
    return true;
  }

  // Case 3: Target has compound Jungseong (e.g. ㅘ = [ㅗ, ㅏ]), input matches first vowel part (e.g. '고' for '과')
  if (COMPOUND_JUNGSEONG_DECOMP[targetJung]) {
    const [firstVowel] = COMPOUND_JUNGSEONG_DECOMP[targetJung];
    const partialVowelSyllable = String.fromCharCode((targetCho * 21 + firstVowel) * 28 + HANGUL_BASE);
    if (partialVowelSyllable === inputChar) {
      return true;
    }
  }

  // Case 4: Target has compound Jongseong (e.g. ㄺ = [ㄹ, ㄱ]), input matches first consonant part (e.g. '달' for '닭')
  if (COMPOUND_JONGSEONG_DECOMP[targetJong]) {
    const [firstJong] = COMPOUND_JONGSEONG_DECOMP[targetJong];
    const partialJongSyllable = String.fromCharCode((targetCho * 21 + targetJung) * 28 + firstJong + HANGUL_BASE);
    if (partialJongSyllable === inputChar) {
      return true;
    }
  }

  return false;
}

/**
 * Korean Hangul Composition Engine.
 * Implements a state machine that converts raw QWERTY keystrokes into composed Hangul syllables.
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
   * Main entry point: processes a single keystroke ('a'-'z', 'A'-'Z', spaces, or 'Backspace').
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

    // Lookup Jamo indices for input key
    let cho = CHOSEONG_MAP[key];
    let jung = JUNGSEONG_MAP[key];
    let jong = JONGSEONG_MAP[key];

    /**
     * Standard Dubeolsik (2-set) Shift Key Handling:
     * In standard Dubeolsik, only 7 Shift keys have double consonant / compound vowel mappings:
     *   R (ㄲ), E (ㄸ), Q (ㅃ), T (ㅆ), W (ㅉ), O (ㅒ), P (ㅖ).
     * For all other uppercase letters (such as 'X', 'Z', 'C', 'V', 'G', etc.), standard Dubeolsik
     * treats Shift + Key identically to its lower-case key (e.g. 'X' -> 'x' -> ㅌ).
     */
    if (cho === undefined && jung === undefined && jong === undefined && key.length === 1 && key >= 'A' && key <= 'Z') {
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
    if (this.currentChoseong !== null && this.currentJungseong !== null && (this.currentJongseong === null || this.currentJongseong === 0)) {
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
    if (this.currentChoseong !== null && this.currentJungseong !== null && this.currentJongseong !== null && this.currentJongseong > 0) {
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

    let isError = false;
    if (inp !== undefined) {
      isError = !isPartialOrExactMatch(t, inp);
    }

    errors.push({
      index: i,
      isError
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
