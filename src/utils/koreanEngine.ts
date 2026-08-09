import type { ErrorReport } from '../types/korean';

const HANGUL_BASE = 0xAC00;

export class HangulEngine {
  private currentChoseong: number | null = null;
  private currentJungseong: number | null = null;
  private currentJongseong: number | null = null;
  private composedString = "";

  /**
   * Assembles the current composition into a Unicode character.
   * Formula: (ChoseongIndex * 21 + JungseongIndex) * 28 + JongseongIndex + 0xAC00
   */
  private assemble(c: number, v: number, f: number): string {
    const code = (c * 21 + v) * 28 + f + HANGUL_BASE;
    return String.fromCharCode(code);
  }

  /**
   * Processes a new key press and updates the internal composition state.
   * Returns the full composed string up to the current character.
   */
  public handleKey(key: string): string {
    // This is the skeleton for the state machine.
    // In the next step, we will fill this with the full logic.
    this.composedString += key;
    return this.composedString;
  }

  public getComposedText(): string {
    return this.composedString;
  }

  public checkErrors(target: string, input: string): ErrorReport[] {
    const errors: ErrorReport[] = [];
    const maxLength = Math.max(target.length, input.length);

    for (let i = 0; i < maxLength; i++) {
      errors.push({
        index: i,
        isError: target[i] !== input[i]
      });
    }
    return errors;
  }
}

// Compatibility functions for the current prototype
export function checkErrors(target: string, input: string): ErrorReport[] {
  const errors: ErrorReport[] = [];
  for (let i = 0; i < input.length; i++) {
    errors.push({ index: i, isError: target[i] !== input[i] });
  }
  return errors;
}

export function compose(input: string): string {
  return input;
}
