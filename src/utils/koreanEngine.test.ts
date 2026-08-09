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
