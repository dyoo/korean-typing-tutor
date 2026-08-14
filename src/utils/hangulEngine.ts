import type { ErrorReport } from '../types/korean';
import {
  HANGUL_BASE,
  INITIAL_CONSONANT_MAP,
  VOWEL_MAP,
  FINAL_CONSONANT_MAP,
  COMPOUND_VOWEL,
  COMPOUND_VOWEL_DECOMP,
  COMPOUND_FINAL_CONSONANT,
  COMPOUND_FINAL_CONSONANT_DECOMP,
  FINAL_CONSONANT_TO_INITIAL_CONSONANT,
  makeCompoundKey,
  INITIAL_CONSONANT_STANDALONE,
  VOWEL_STANDALONE,
  DIRECT_INITIAL_CONSONANT_MAP,
  DIRECT_VOWEL_MAP,
  DIRECT_FINAL_CONSONANT_MAP,
} from './hangulTables';
import { checkErrors } from './hangulMatch';

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
 * Helper function to compose a string of raw QWERTY keystrokes into Hangul.
 */
export function compose(input: string): string {
  const engine = new HangulEngine();
  for (const char of input) {
    engine.handleKey(char);
  }
  return engine.getComposedText();
}
