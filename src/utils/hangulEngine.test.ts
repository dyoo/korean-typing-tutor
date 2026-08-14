import { describe, it, expect, beforeEach } from 'vitest';
import { HangulEngine, compose } from './hangulEngine';

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
