import { describe, it, expect } from 'vitest';
import {
  decomposeCharToJamos,
  decomposeStringToJamos,
  decomposeSyllable,
  getInitialConsonantJamo,
} from './hangulDecompose';
import { compose } from './hangulEngine';
import { isHangulSyllable, STANDALONE_COMPOUND_MAP } from './hangulTables';

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

  it('should correctly identify Hangul syllables with isHangulSyllable', () => {
    expect(isHangulSyllable('가')).toBe(true);
    expect(isHangulSyllable('힣')).toBe(true);
    expect(isHangulSyllable(0xac00)).toBe(true);
    expect(isHangulSyllable(0xd7a3)).toBe(true);
    expect(isHangulSyllable('ㄱ')).toBe(false);
    expect(isHangulSyllable('a')).toBe(false);
    expect(isHangulSyllable(0xac00 - 1)).toBe(false);
    expect(isHangulSyllable(0xd7a3 + 1)).toBe(false);
  });

  it('should have complete standalone compound decompositions', () => {
    expect(STANDALONE_COMPOUND_MAP['ㅘ']).toBe('ㅗㅏ');
    expect(STANDALONE_COMPOUND_MAP['ㅢ']).toBe('ㅡㅣ');
    expect(STANDALONE_COMPOUND_MAP['ㄳ']).toBe('ㄱㅅ');
    expect(STANDALONE_COMPOUND_MAP['ㅄ']).toBe('ㅂㅅ');
    expect(Object.keys(STANDALONE_COMPOUND_MAP).length).toBe(18);
  });
});
