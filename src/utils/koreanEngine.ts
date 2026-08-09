import type { ErrorReport } from '../types/korean';

const HANGUL_BASE = 0xAC00;

const CHOSEONG_MAP: Record<string, number> = {
  r: 0, R: 1, s: 2, e: 3, E: 4, f: 5, a: 6, q: 7, Q: 8,
  t: 9, T: 10, d: 11, w: 12, W: 13, c: 14, z: 15, x: 16, v: 17, g: 18
};

const JUNGSEONG_MAP: Record<string, number> = {
  k: 0, o: 1, i: 2, O: 3, j: 4, p: 5, u: 6, P: 7, h: 8,
  y: 12, n: 13, b: 17, m: 18, l: 20
};

const JONGSEONG_MAP: Record<string, number> = {
  r: 1, R: 2, s: 4, e: 7, f: 8, a: 16, q: 17, t: 19, T: 20,
  d: 21, w: 22, c: 23, z: 24, x: 25, v: 26, g: 27
};

const COMPOUND_JUNGSEONG: Record<string, number> = {
  '8,0': 9,
  '8,1': 10,
  '8,20': 11,
  '13,4': 14,
  '13,5': 15,
  '13,20': 16,
  '18,20': 19
};

const COMPOUND_JUNGSEONG_DECOMP: Record<number, [number, number]> = {
  9: [8, 0],
  10: [8, 1],
  11: [8, 20],
  14: [13, 4],
  15: [13, 5],
  16: [13, 20],
  19: [18, 20]
};

const COMPOUND_JONGSEONG: Record<string, number> = {
  '1,19': 3,
  '4,22': 5,
  '4,27': 6,
  '8,1': 9,
  '8,16': 10,
  '8,17': 11,
  '8,19': 12,
  '8,25': 13,
  '8,26': 14,
  '8,27': 15,
  '17,19': 18
};

const COMPOUND_JONGSEONG_DECOMP: Record<number, [number, number]> = {
  3: [1, 19],
  5: [4, 22],
  6: [4, 27],
  9: [8, 1],
  10: [8, 16],
  11: [8, 17],
  12: [8, 19],
  13: [8, 25],
  14: [8, 26],
  15: [8, 27],
  18: [17, 19]
};

const JONGSEONG_TO_CHOSEONG: Record<number, number> = {
  1: 0, 2: 1, 4: 2, 7: 3, 8: 5, 16: 6, 17: 7, 19: 9, 20: 10,
  21: 11, 22: 12, 23: 14, 24: 15, 25: 16, 26: 17, 27: 18
};

const CHOSEONG_STANDALONE = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ',
  'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const JUNGSEONG_STANDALONE = [
  'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ',
  'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'
];

export class HangulEngine {
  private currentChoseong: number | null = null;
  private currentJungseong: number | null = null;
  private currentJongseong: number | null = null;
  private composedString = '';

  private assemble(c: number, v: number, f: number): string {
    const code = (c * 21 + v) * 28 + f + HANGUL_BASE;
    return String.fromCharCode(code);
  }

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

  private flushCurrent(): void {
    const char = this.getCurrentChar();
    if (char) {
      this.composedString += char;
    }
    this.currentChoseong = null;
    this.currentJungseong = null;
    this.currentJongseong = null;
  }

  public handleKey(key: string): string {
    if (key === 'Backspace') {
      if (this.currentJongseong !== null && this.currentJongseong > 0) {
        if (COMPOUND_JONGSEONG_DECOMP[this.currentJongseong]) {
          this.currentJongseong = COMPOUND_JONGSEONG_DECOMP[this.currentJongseong][0];
        } else {
          this.currentJongseong = null;
        }
      } else if (this.currentJungseong !== null) {
        if (COMPOUND_JUNGSEONG_DECOMP[this.currentJungseong]) {
          this.currentJungseong = COMPOUND_JUNGSEONG_DECOMP[this.currentJungseong][0];
        } else {
          this.currentJungseong = null;
        }
      } else if (this.currentChoseong !== null) {
        this.currentChoseong = null;
      } else if (this.composedString.length > 0) {
        this.composedString = this.composedString.slice(0, -1);
      }
      return this.getComposedText();
    }

    const cho = CHOSEONG_MAP[key];
    const jung = JUNGSEONG_MAP[key];
    const jong = JONGSEONG_MAP[key];

    if (cho === undefined && jung === undefined) {
      this.flushCurrent();
      this.composedString += key;
      return this.getComposedText();
    }

    if (this.currentChoseong === null && this.currentJungseong === null) {
      if (cho !== undefined) {
        this.currentChoseong = cho;
      } else if (jung !== undefined) {
        this.currentJungseong = jung;
      }
      return this.getComposedText();
    }

    if (this.currentChoseong !== null && this.currentJungseong === null) {
      if (jung !== undefined) {
        this.currentJungseong = jung;
      } else if (cho !== undefined) {
        this.flushCurrent();
        this.currentChoseong = cho;
      }
      return this.getComposedText();
    }

    if (this.currentChoseong === null && this.currentJungseong !== null) {
      if (jung !== undefined) {
        const compoundKey = `${this.currentJungseong},${jung}`;
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

    if (this.currentChoseong !== null && this.currentJungseong !== null && (this.currentJongseong === null || this.currentJongseong === 0)) {
      if (jung !== undefined) {
        const compoundKey = `${this.currentJungseong},${jung}`;
        if (COMPOUND_JUNGSEONG[compoundKey] !== undefined) {
          this.currentJungseong = COMPOUND_JUNGSEONG[compoundKey];
        } else {
          this.flushCurrent();
          this.currentJungseong = jung;
        }
      } else if (jong !== undefined) {
        this.currentJongseong = jong;
      } else if (cho !== undefined) {
        this.flushCurrent();
        this.currentChoseong = cho;
      }
      return this.getComposedText();
    }

    if (this.currentChoseong !== null && this.currentJungseong !== null && this.currentJongseong !== null && this.currentJongseong > 0) {
      if (jung !== undefined) {
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
        const compoundKey = `${this.currentJongseong},${jong}`;
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

  public getComposedText(): string {
    return this.composedString + this.getCurrentChar();
  }

  public reset(): void {
    this.currentChoseong = null;
    this.currentJungseong = null;
    this.currentJongseong = null;
    this.composedString = '';
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

export function checkErrors(target: string, input: string): ErrorReport[] {
  const errors: ErrorReport[] = [];
  const maxLength = Math.max(target.length, input.length);
  for (let i = 0; i < maxLength; i++) {
    errors.push({ index: i, isError: target[i] !== input[i] });
  }
  return errors;
}

export function compose(input: string): string {
  const engine = new HangulEngine();
  for (const char of input) {
    engine.handleKey(char);
  }
  return engine.getComposedText();
}
