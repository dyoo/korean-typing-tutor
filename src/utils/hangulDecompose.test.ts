import { describe, it, expect } from 'vitest';
import {
  decomposeCharToJamos,
  decomposeStringToJamos,
  decomposeSyllable,
  getInitialConsonantJamo,
} from './hangulDecompose';
import { compose } from './hangulEngine';

describe('Jamo decomposition helpers (hangulDecompose)', () => {
  it('should decompose Hangul syllables into initial consonant (Choseong), vowel (Jungseong), and final consonant (Jongseong)', () => {
    expect(decomposeSyllable('가')).toEqual({
      initialConsonant: 'ㄱ',
      vowel: 'ㅏ',
      finalConsonant: null,
    });
    expect(decomposeSyllable('한')).toEqual({
      initialConsonant: 'ㅎ',
      vowel: 'ㅏ',
      finalConsonant: 'ㄴ',
    });
    expect(decomposeSyllable('글')).toEqual({
      initialConsonant: 'ㄱ',
      vowel: 'ㅡ',
      finalConsonant: 'ㄹ',
    });
    expect(decomposeSyllable('A')).toBeNull();
    expect(decomposeSyllable('')).toBeNull();
  });

  it('should decompose Hangul syllables and Jamos into individual Jamo sequences', () => {
    expect(decomposeCharToJamos('화')).toBe('ㅎㅗㅏ');
    expect(decomposeCharToJamos(compose('ghkw'))).toBe('ㅎㅗㅏㅈ');
    expect(decomposeCharToJamos('닭')).toBe('ㄷㅏㄹㄱ');
    expect(decomposeCharToJamos('ㅘ')).toBe('ㅗㅏ');
    expect(decomposeCharToJamos('ㄳ')).toBe('ㄱㅅ');
  });

  it('should decompose full strings into flat Jamo arrays', () => {
    expect(decomposeStringToJamos('하나와')).toEqual(['ㅎ', 'ㅏ', 'ㄴ', 'ㅏ', 'ㅇ', 'ㅗ', 'ㅏ']);
    expect(decomposeStringToJamos('사 과')).toEqual(['ㅅ', 'ㅏ', ' ', 'ㄱ', 'ㅗ', 'ㅏ']);
    expect(decomposeStringToJamos('')).toEqual([]);
  });

  it('should extract Initial Consonant (Choseong) Jamo correctly', () => {
    expect(getInitialConsonantJamo('장')).toBe('ㅈ');
    expect(getInitialConsonantJamo('요')).toBe('ㅇ');
    expect(getInitialConsonantJamo('ㄱ')).toBe('ㄱ');
    expect(getInitialConsonantJamo(' ')).toBe(null);
  });
});
