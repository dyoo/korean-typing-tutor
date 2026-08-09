import { describe, it, expect, beforeEach } from 'vitest';
import { HangulEngine, checkErrors, compose, isPartialOrExactMatch } from './koreanEngine';

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
    engine.handleKey('g');
    engine.handleKey('k');
    expect(engine.handleKey('s')).toBe('한');

    engine.reset();
    engine.handleKey('r');
    engine.handleKey('m');
    expect(engine.handleKey('f')).toBe('글');
  });

  it('should compose compound vowels', () => {
    engine.handleKey('r');
    engine.handleKey('h');
    expect(engine.getComposedText()).toBe('고');
    expect(engine.handleKey('k')).toBe('과');

    engine.reset();
    engine.handleKey('d');
    engine.handleKey('n');
    engine.handleKey('j');
    expect(engine.handleKey('f')).toBe('월');
  });

  it('should compose compound final consonants', () => {
    engine.handleKey('e');
    engine.handleKey('k');
    engine.handleKey('f');
    expect(engine.getComposedText()).toBe('달');
    expect(engine.handleKey('r')).toBe('닭');

    engine.reset();
    engine.handleKey('r');
    engine.handleKey('k');
    engine.handleKey('q');
    expect(engine.handleKey('t')).toBe('값');
  });

  it('should handle shifted double consonants and vowels', () => {
    expect(engine.handleKey('R')).toBe('ㄲ');
    expect(engine.handleKey('k')).toBe('까');

    engine.reset();
    engine.handleKey('E');
    expect(engine.handleKey('k')).toBe('따');

    engine.reset();
    engine.handleKey('Q');
    expect(engine.handleKey('k')).toBe('빠');

    engine.reset();
    engine.handleKey('T');
    expect(engine.handleKey('k')).toBe('싸');

    engine.reset();
    engine.handleKey('W');
    expect(engine.handleKey('k')).toBe('짜');

    engine.reset();
    expect(engine.handleKey('O')).toBe('ㅒ');

    engine.reset();
    expect(engine.handleKey('P')).toBe('ㅖ');
  });

  it('should handle liaison syllable splitting when vowel follows Jongseong', () => {
    engine.handleKey('g');
    engine.handleKey('k');
    engine.handleKey('s');
    expect(engine.getComposedText()).toBe('한');
    expect(engine.handleKey('k')).toBe('하나');

    engine.reset();
    engine.handleKey('e');
    engine.handleKey('k');
    engine.handleKey('f');
    engine.handleKey('r');
    expect(engine.getComposedText()).toBe('닭');
    expect(engine.handleKey('l')).toBe('달기');
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
