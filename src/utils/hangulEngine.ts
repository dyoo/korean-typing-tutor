import type { InitialConsonantIndex, VowelIndex, FinalConsonantIndex } from '../types/korean';
import {
  isHangulSyllable,
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
import { assembleSyllable } from './hangulDecompose';

/**
 * Internal composition state representing valid phonotactic Hangul composition stages.
 * Prevents impossible states (such as final consonants without vowels or initial consonants)
 * at the type level.
 */
type CompositionState =
  | { readonly stage: 'empty' }
  | { readonly stage: 'initial'; readonly initialConsonant: InitialConsonantIndex }
  | { readonly stage: 'vowel'; readonly vowel: VowelIndex }
  | {
      readonly stage: 'syllable';
      readonly initialConsonant: InitialConsonantIndex;
      readonly vowel: VowelIndex;
      readonly finalConsonant: FinalConsonantIndex | null;
    };

/**
 * Korean Hangul Composition Engine.
 * Implements a state machine that converts raw QWERTY keystrokes OR native Korean 2-set Jamos into composed Hangul syllables.
 */
export class HangulEngine {
  private compositionState: CompositionState = { stage: 'empty' };
  private composedString = '';

  /**
   * Returns the string representation of the syllable block currently being composed.
   */
  private getCurrentChar(): string {
    switch (this.compositionState.stage) {
      case 'empty':
        return '';
      case 'initial':
        return INITIAL_CONSONANT_STANDALONE[this.compositionState.initialConsonant] ?? '';
      case 'vowel':
        return VOWEL_STANDALONE[this.compositionState.vowel] ?? '';
      case 'syllable':
        return assembleSyllable(
          this.compositionState.initialConsonant,
          this.compositionState.vowel,
          this.compositionState.finalConsonant ?? (0 as FinalConsonantIndex),
        );
    }
  }

  /**
   * Flushes the current composing block into the finalized composedString and resets block state.
   */
  private flushCurrent(): void {
    const char = this.getCurrentChar();
    if (char) {
      this.composedString += char;
    }
    this.compositionState = { stage: 'empty' };
  }

  /**
   * Main entry point: processes a single keystroke (QWERTY key, native Hangul Jamo, space, or Backspace).
   * Updates internal composition state and returns the complete composed text.
   */
  public handleKey(key: string): string {
    // --- 1. Handle Backspace key ---
    if (key === 'Backspace') {
      switch (this.compositionState.stage) {
        case 'syllable': {
          const { initialConsonant, vowel, finalConsonant } = this.compositionState;
          if (finalConsonant !== null && finalConsonant > 0) {
            // Decompose compound Final Consonant (Jongseong) back to single Final Consonant, or remove Final Consonant
            if (COMPOUND_FINAL_CONSONANT_DECOMP[finalConsonant]) {
              this.compositionState = {
                stage: 'syllable',
                initialConsonant,
                vowel,
                finalConsonant: COMPOUND_FINAL_CONSONANT_DECOMP[finalConsonant][0],
              };
            } else {
              this.compositionState = {
                stage: 'syllable',
                initialConsonant,
                vowel,
                finalConsonant: null,
              };
            }
          } else {
            // Decompose compound Vowel (Jungseong) back to single Vowel, or remove Vowel leaving only Initial Consonant
            if (COMPOUND_VOWEL_DECOMP[vowel]) {
              this.compositionState = {
                stage: 'syllable',
                initialConsonant,
                vowel: COMPOUND_VOWEL_DECOMP[vowel][0],
                finalConsonant: null,
              };
            } else {
              this.compositionState = {
                stage: 'initial',
                initialConsonant,
              };
            }
          }
          break;
        }
        case 'vowel': {
          const { vowel } = this.compositionState;
          if (COMPOUND_VOWEL_DECOMP[vowel]) {
            this.compositionState = {
              stage: 'vowel',
              vowel: COMPOUND_VOWEL_DECOMP[vowel][0],
            };
          } else {
            this.compositionState = { stage: 'empty' };
          }
          break;
        }
        case 'initial': {
          this.compositionState = { stage: 'empty' };
          break;
        }
        case 'empty': {
          if (this.composedString.length > 0) {
            this.composedString = this.composedString.slice(0, -1);
          }
          break;
        }
      }
      return this.getComposedText();
    }

    // Direct composed Hangul Syllable (from native OS IME)
    if (key.length === 1 && isHangulSyllable(key)) {
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

    // --- 3. Process key according to current composition stage ---
    switch (this.compositionState.stage) {
      case 'empty': {
        if (initialConsonant !== undefined) {
          this.compositionState = { stage: 'initial', initialConsonant };
        } else if (vowel !== undefined) {
          this.compositionState = { stage: 'vowel', vowel };
        }
        return this.getComposedText();
      }

      case 'initial': {
        if (vowel !== undefined) {
          // Add vowel -> forms syllable (e.g. 'ㄱ' + 'ㅏ' -> '가')
          this.compositionState = {
            stage: 'syllable',
            initialConsonant: this.compositionState.initialConsonant,
            vowel,
            finalConsonant: null,
          };
        } else if (initialConsonant !== undefined) {
          // Double initial consonant typed without vowel -> flush prev, start new block
          this.flushCurrent();
          this.compositionState = { stage: 'initial', initialConsonant };
        }
        return this.getComposedText();
      }

      case 'vowel': {
        if (vowel !== undefined) {
          const compoundKey = makeCompoundKey(this.compositionState.vowel, vowel);
          if (COMPOUND_VOWEL[compoundKey] !== undefined) {
            this.compositionState = {
              stage: 'vowel',
              vowel: COMPOUND_VOWEL[compoundKey],
            };
          } else {
            this.flushCurrent();
            this.compositionState = { stage: 'vowel', vowel };
          }
        } else if (initialConsonant !== undefined) {
          this.flushCurrent();
          this.compositionState = { stage: 'initial', initialConsonant };
        }
        return this.getComposedText();
      }

      case 'syllable': {
        const {
          initialConsonant: currInitial,
          vowel: currVowel,
          finalConsonant: currFinal,
        } = this.compositionState;

        // Subcase A: Syllable has NO final consonant (e.g. '가')
        if (currFinal === null || currFinal === 0) {
          if (vowel !== undefined) {
            // Try combining into compound vowel (e.g. '고' + 'ㅏ' -> '과')
            const compoundKey = makeCompoundKey(currVowel, vowel);
            if (COMPOUND_VOWEL[compoundKey] !== undefined) {
              this.compositionState = {
                stage: 'syllable',
                initialConsonant: currInitial,
                vowel: COMPOUND_VOWEL[compoundKey],
                finalConsonant: null,
              };
            } else {
              this.flushCurrent();
              this.compositionState = { stage: 'vowel', vowel };
            }
          } else if (finalConsonant !== undefined) {
            // Add final consonant (e.g. '하' + 'ㄴ' -> '한')
            this.compositionState = {
              stage: 'syllable',
              initialConsonant: currInitial,
              vowel: currVowel,
              finalConsonant,
            };
          } else if (initialConsonant !== undefined) {
            this.flushCurrent();
            this.compositionState = { stage: 'initial', initialConsonant };
          }
          return this.getComposedText();
        }

        // Subcase B: Syllable already has final consonant (e.g. '한' or '닭')
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
          if (COMPOUND_FINAL_CONSONANT_DECOMP[currFinal]) {
            const [firstFinalConsonant, secondFinalConsonant] =
              COMPOUND_FINAL_CONSONANT_DECOMP[currFinal];
            const firstChar = assembleSyllable(currInitial, currVowel, firstFinalConsonant);
            this.composedString += firstChar;

            this.compositionState = {
              stage: 'syllable',
              initialConsonant: FINAL_CONSONANT_TO_INITIAL_CONSONANT[secondFinalConsonant],
              vowel,
              finalConsonant: null,
            };
          } else {
            const firstChar = assembleSyllable(currInitial, currVowel, 0 as FinalConsonantIndex);
            this.composedString += firstChar;

            this.compositionState = {
              stage: 'syllable',
              initialConsonant: FINAL_CONSONANT_TO_INITIAL_CONSONANT[currFinal],
              vowel,
              finalConsonant: null,
            };
          }
        } else if (finalConsonant !== undefined) {
          // Try combining into compound Final Consonant (Jongseong) (e.g. '달' + 'ㄱ' -> '닭')
          const compoundKey = makeCompoundKey(currFinal, finalConsonant);
          if (COMPOUND_FINAL_CONSONANT[compoundKey] !== undefined) {
            this.compositionState = {
              stage: 'syllable',
              initialConsonant: currInitial,
              vowel: currVowel,
              finalConsonant: COMPOUND_FINAL_CONSONANT[compoundKey],
            };
          } else if (initialConsonant !== undefined) {
            this.flushCurrent();
            this.compositionState = { stage: 'initial', initialConsonant };
          }
        } else if (initialConsonant !== undefined) {
          this.flushCurrent();
          this.compositionState = { stage: 'initial', initialConsonant };
        }
        return this.getComposedText();
      }
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
    this.compositionState = { stage: 'empty' };
    this.composedString = '';
  }

  /**
   * Resets engine state and re-hydrates composition state from prefix string.
   * Completed syllable blocks are stored directly in composedString without active Jamos,
   * while trailing standalone Jamos are restored into active initial/vowel composition state.
   */
  public resetTo(prefix: string): void {
    this.reset();
    if (!prefix) {
      return;
    }

    const lastChar = prefix[prefix.length - 1];
    const initIdx = DIRECT_INITIAL_CONSONANT_MAP[lastChar];
    const vowelIdx = DIRECT_VOWEL_MAP[lastChar];

    if (initIdx !== undefined) {
      this.composedString = prefix.slice(0, -1);
      this.compositionState = { stage: 'initial', initialConsonant: initIdx };
    } else if (vowelIdx !== undefined) {
      this.composedString = prefix.slice(0, -1);
      this.compositionState = { stage: 'vowel', vowel: vowelIdx };
    } else {
      this.composedString = prefix;
    }
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
