import { describe, it, expect, beforeEach } from 'vitest';
import {
  HangulEngine,
  checkErrors,
  compose,
  isPartialOrExactMatch,
  isSyllableComplete,
  decomposeCharToJamos,
  getChoseongJamo,
  calculateTargetCursorIndex,
  calculateInputCursorIndex,
  getWordTokens
} from './koreanEngine';

describe('Jamo decomposition helpers', () => {
  it('should decompose Hangul syllables and Jamos into individual Jamo sequences', () => {
    expect(decomposeCharToJamos('화')).toBe('ㅎㅗㅏ');
    expect(decomposeCharToJamos(compose('ghkw'))).toBe('ㅎㅗㅏㅈ');
    expect(decomposeCharToJamos('닭')).toBe('ㄷㅏㄹㄱ');
    expect(decomposeCharToJamos('ㅘ')).toBe('ㅗㅏ');
    expect(decomposeCharToJamos('ㄳ')).toBe('ㄱㅅ');
  });

  it('should extract Choseong Jamo correctly', () => {
    expect(getChoseongJamo('장')).toBe('ㅈ');
    expect(getChoseongJamo('요')).toBe('ㅇ');
    expect(getChoseongJamo('ㄱ')).toBe('ㄱ');
    expect(getChoseongJamo(' ')).toBe(null);
  });

  it('should evaluate isSyllableComplete correctly to prevent cursor backtracking', () => {
    // Exact match
    expect(isSyllableComplete('화', '화', '장')).toBe(true);

    // Typing 'w' (ㅈ) after '화' when target is '화장실'
    const inputAfterW = compose('ghkw');
    expect(isSyllableComplete('화', inputAfterW, '장')).toBe(true);

    // Typing wrong consonant 'd' (ㅇ) after '화' when target is '화장실'
    const inputAfterWrongD = compose('ghkd');
    expect(isSyllableComplete('화', inputAfterWrongD, '장')).toBe(false);

    // Partial input '자' for target '장' is not complete
    expect(isSyllableComplete('장', '자', '실')).toBe(false);
  });
});

describe('checkErrors and isPartialOrExactMatch functions', () => {
  it('should return no errors for exact match', () => {
    const target = 'hello';
    const input = 'hello';
    const errors = checkErrors(target, input);
    expect(errors.length).toBe(5);
    expect(errors.every(e => !e.isError)).toBe(true);
  });

  it('should identify mismatches', () => {
    const target = 'hello';
    const input = 'helo';
    const errors = checkErrors(target, input);
    expect(errors[3].isError).toBe(true);
  });

  it('should handle different lengths', () => {
    const target = 'abc';
    const input = 'abcd';
    const errors = checkErrors(target, input);
    expect(errors.length).toBe(4);
    expect(errors[3].isError).toBe(true);
  });

  it('should not flag valid partial Hangul composition as error', () => {
    const target = '사과';

    expect(isPartialOrExactMatch('사', 'ㅅ')).toBe(true);
    expect(isPartialOrExactMatch('사', '사')).toBe(true);
    expect(isPartialOrExactMatch('과', 'ㄱ')).toBe(true);
    expect(isPartialOrExactMatch('과', '고')).toBe(true);
    expect(isPartialOrExactMatch('과', '과')).toBe(true);
    expect(isPartialOrExactMatch('과', 'ㅋ')).toBe(false);

    let errors = checkErrors(target, 'ㅅ');
    expect(errors[0].isError).toBe(false);

    errors = checkErrors(target, '사고');
    expect(errors[0].isError).toBe(false);
    expect(errors[1].isError).toBe(false);

    errors = checkErrors(target, '사ㅋ');
    expect(errors[0].isError).toBe(false);
    expect(errors[1].isError).toBe(true);
  });

  it('should handle ambiguous next-syllable choseong during typing (e.g. 화장실)', () => {
    const target = '화장실';
    const inputAfterW = compose('ghkw'); // '화' + 'ㅈ'

    // inputAfterW vs target[0] '화' with nextTarget '장'
    expect(isPartialOrExactMatch('화', inputAfterW, '장')).toBe(true);

    // Typing 'w' (ㅈ) after '화' produces inputAfterW before vowel 'ㅏ' is typed
    const errorsWhenAmbiguous = checkErrors(target, inputAfterW);
    expect(errorsWhenAmbiguous[0].isError).toBe(false);

    // Incorrect trailing consonant (e.g. 'd' / 'ㅇ' instead of 'w' / 'ㅈ') should still be flagged as error
    const inputAfterWrongD = compose('ghkd'); // '화' + 'ㅇ'
    expect(isPartialOrExactMatch('화', inputAfterWrongD, '장')).toBe(false);
    const errorsWhenWrongConsonant = checkErrors(target, inputAfterWrongD);
    expect(errorsWhenWrongConsonant[0].isError).toBe(true);
  });

  it('should handle step-by-step typing of multi-syllable word 화장실 without false errors', () => {
    const target = '화장실';
    const engine = new HangulEngine();
    const keystrokes = ['g', 'h', 'k', 'w', 'k', 'd', 't', 'l', 'f'];

    let currentInput = '';
    for (const key of keystrokes) {
      currentInput = engine.handleKey(key);
      const errors = checkErrors(target, currentInput);
      expect(errors.every(e => !e.isError)).toBe(true);
    }
    expect(currentInput).toBe('화장실');
  });

  it('should detect impossible keystrokes immediately as errors (e.g. ㄷ for 우유)', () => {
    const target = '우유';
    
    expect(isPartialOrExactMatch('우', 'ㅇ')).toBe(true);
    let errors = checkErrors(target, 'ㅇ');
    expect(errors[0].isError).toBe(false);

    expect(isPartialOrExactMatch('우', 'ㄷ')).toBe(false);
    errors = checkErrors(target, 'ㄷ');
    expect(errors[0].isError).toBe(true);
  });

  it('should not flag intermediate partial keystrokes as errors when typing 가요.', () => {
    const target = '가요.';
    expect(isPartialOrExactMatch('요', 'ㅇ')).toBe(true);
    expect(isPartialOrExactMatch('요', '요')).toBe(true);

    const step1 = checkErrors(target, 'ㄱ');
    expect(step1[0].isError).toBe(false);

    const step2 = checkErrors(target, '가');
    expect(step2[0].isError).toBe(false);

    const step3 = checkErrors(target, '가ㅇ');
    expect(step3[0].isError).toBe(false);
    expect(step3[1].isError).toBe(false);

    const step4 = checkErrors(target, '가요');
    expect(step4[0].isError).toBe(false);
    expect(step4[1].isError).toBe(false);

    const step5 = checkErrors(target, '가요.');
    expect(step5.every(e => !e.isError)).toBe(true);
  });

  it('should recognize compound Jongseong partial matches as valid', () => {
    expect(isPartialOrExactMatch('닭', '달')).toBe(true);
    expect(isPartialOrExactMatch('닭', '다')).toBe(true);
    expect(isPartialOrExactMatch('닭', 'ㄷ')).toBe(true);
    expect(isPartialOrExactMatch('닭', '닭')).toBe(true);
    expect(isPartialOrExactMatch('닭', '댟')).toBe(false);
  });
});

describe('HangulEngine class', () => {
  let engine: HangulEngine;

  beforeEach(() => {
    engine = new HangulEngine();
  });

  it('should compose single Jamo characters', () => {
    expect(engine.handleKey('r')).toBe('ㄱ');
    engine.reset();
    expect(engine.handleKey('k')).toBe('ㅏ');
  });

  it('should compose basic syllables (Choseong + Jungseong)', () => {
    engine.handleKey('r');
    expect(engine.handleKey('k')).toBe('가');
    engine.reset();
    engine.handleKey('g');
    expect(engine.handleKey('k')).toBe('하');
  });

  it('should compose syllables with final consonants (Jongseong)', () => {
    engine.handleKey('r');
    engine.handleKey('k');
    expect(engine.handleKey('s')).toBe('간');
  });

  it('should split Jongseong into Choseong of next syllable when vowel follows', () => {
    engine.handleKey('g');
    engine.handleKey('k');
    engine.handleKey('s');
    expect(engine.getComposedText()).toBe('한');

    engine.handleKey('r');
    expect(engine.getComposedText()).toBe('한ㄱ');

    engine.handleKey('k');
    expect(engine.getComposedText()).toBe('한가');
  });

  it('should handle complex compound Jongseong (e.g. 닭, 흙, 삶)', () => {
    engine.handleKey('e');
    engine.handleKey('k');
    engine.handleKey('f');
    engine.handleKey('r');
    expect(engine.getComposedText()).toBe('닭');

    engine.handleKey('k');
    expect(engine.getComposedText()).toBe('달가');
  });

  it('should handle punctuation and non-Korean keys by flushing active block', () => {
    engine.handleKey('t');
    engine.handleKey('k');
    expect(engine.getComposedText()).toBe('사');

    engine.handleKey('r');
    engine.handleKey('h');
    engine.handleKey('k');
    expect(engine.getComposedText()).toBe('사과');

    engine.handleKey(' ');
    expect(engine.getComposedText()).toBe('사과 ');

    engine.handleKey('a');
    engine.handleKey('j');
    engine.handleKey('r');
    expect(engine.handleKey('!')).toBe('사과 먹!');
  });

  it('should compose multi-syllable phrases accurately', () => {
    const text = compose('dkssudgktpdy');
    expect(text).toBe('안녕하세요');
  });

  it('should support backspace decomposition step-by-step', () => {
    engine.handleKey('g');
    engine.handleKey('k');
    engine.handleKey('s');
    expect(engine.getComposedText()).toBe('한');
    expect(engine.handleKey('Backspace')).toBe('하');
    expect(engine.handleKey('Backspace')).toBe('ㅎ');
    expect(engine.handleKey('Backspace')).toBe('');

    engine.reset();
    engine.handleKey('e');
    engine.handleKey('k');
    engine.handleKey('f');
    engine.handleKey('r');
    expect(engine.getComposedText()).toBe('닭');
    expect(engine.handleKey('Backspace')).toBe('달');
    expect(engine.handleKey('Backspace')).toBe('다');
  });
});

describe('Cursor index calculation helpers', () => {
  it('should calculate active target cursor index correctly', () => {
    // Initial state: target cursor on 1st character (0)
    expect(calculateTargetCursorIndex('가나다', '', false)).toBe(0);

    // In-progress jamo for 1st char: target cursor stays on 1st character (0)
    expect(calculateTargetCursorIndex('가나다', 'ㄱ', false)).toBe(0);

    // 1st char complete: target cursor moves to 2nd character (1)
    expect(calculateTargetCursorIndex('가나다', '가', false)).toBe(1);

    // In-progress 2nd char: target cursor stays on 2nd character (1)
    expect(calculateTargetCursorIndex('가나다', '가ㄴ', false)).toBe(1);

    // Clamps to last target character index when typing at end of target text
    expect(calculateTargetCursorIndex('가', '나', false)).toBe(0);

    // Returns -1 when item is completed
    expect(calculateTargetCursorIndex('가나다', '가나다', true)).toBe(-1);
  });

  it('should calculate active input cursor index correctly', () => {
    // Initial state: input cursor at position 0
    expect(calculateInputCursorIndex('', '가나다', false)).toBe(0);

    // In-progress jamo: input cursor stays under 1st typed char (0)
    expect(calculateInputCursorIndex('ㄱ', '가나다', false)).toBe(0);

    // 1st char complete: input cursor moves to new position after 1st char (1)
    expect(calculateInputCursorIndex('가', '가나다', false)).toBe(1);

    // In-progress 2nd char: input cursor is under 2nd char (1)
    expect(calculateInputCursorIndex('가ㄴ', '가나다', false)).toBe(1);

    // Returns -1 when item is completed
    expect(calculateInputCursorIndex('가나다', '가나다', true)).toBe(-1);
  });
});

describe('getWordTokens helper', () => {
  it('should group target sentence into words and trailing punctuation tokens', () => {
    const text = '안녕하세요. 반갑습니다!';
    const tokens = getWordTokens(text);
    expect(tokens.length).toBe(3);

    expect(tokens[0].type).toBe('word');
    expect(tokens[0].indices).toEqual([0, 1, 2, 3, 4, 5]);
    expect(tokens[0].indices.map(i => text[i]).join('')).toBe('안녕하세요.');

    expect(tokens[1].type).toBe('space');
    expect(tokens[1].indices).toEqual([6]);
    expect(tokens[1].indices.map(i => text[i]).join('')).toBe(' ');

    expect(tokens[2].type).toBe('word');
    expect(tokens[2].indices).toEqual([7, 8, 9, 10, 11, 12]);
    expect(tokens[2].indices.map(i => text[i]).join('')).toBe('반갑습니다!');
  });
});

