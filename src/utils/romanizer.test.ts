import { describe, it, expect } from 'vitest';
import { romanize, getPronunciation } from './romanizer';
import { decomposeSyllable } from './hangulDecompose';
import type { LessonItem } from '../types/korean';

describe('Dynamic Romanizer Engine', () => {
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
  });

  it('should romanize basic syllables and words accurately', () => {
    expect(romanize('가구')).toBe('gagu');
    expect(romanize('고기')).toBe('gogi');
    expect(romanize('다리')).toBe('dari');
    expect(romanize('나무')).toBe('namu');
    expect(romanize('우유')).toBe('uyu');
    expect(romanize('토끼')).toBe('tokki');
  });

  it('should romanize all compound vowels (Jungseong)', () => {
    expect(romanize('과자')).toBe('gwaja'); // ㅘ
    expect(romanize('왜')).toBe('wae'); // ㅙ
    expect(romanize('외국')).toBe('oeguk'); // ㅚ
    expect(romanize('뭐')).toBe('mwo'); // ㅝ
    expect(romanize('웨딩')).toBe('weding'); // ㅞ
    expect(romanize('위')).toBe('wi'); // ㅟ
    expect(romanize('의사')).toBe('uisa'); // ㅢ
  });

  it('should handle liaison sound changes before vowels', () => {
    expect(romanize('한국어')).toBe('hangugeo');
    expect(romanize('꽃이')).toBe('kkochi');
    expect(romanize('월요일')).toBe('woryoil');
  });

  it('should handle compound final consonant liaison before vowels', () => {
    expect(romanize('닭이')).toBe('dargi'); // ㄺ + ㅇ -> r + g
    expect(romanize('앉아')).toBe('anja'); // ㄵ + ㅇ -> n + j
    expect(romanize('값이')).toBe('gapsi'); // ㅄ + ㅇ -> p + s
    expect(romanize('넓은')).toBe('neorbeun'); // ㄼ + ㅇ -> r + b
    expect(romanize('핥아')).toBe('harta'); // ㄾ + ㅇ -> r + t
  });

  it('should handle nasalization before ㄴ and ㅁ', () => {
    expect(romanize('입니다')).toBe('imnida');
    expect(romanize('감사합니다')).toBe('gamsahamnida');
    expect(romanize('킹받네')).toBe('kingbanne');
    expect(romanize('국물')).toBe('gungmul');
  });

  it('should handle liquidization of ㄴ and ㄹ', () => {
    expect(romanize('설날')).toBe('seollal');
    expect(romanize('신라')).toBe('silla');
    expect(romanize('완료')).toBe('wallyo');
  });

  it('should preserve spaces, punctuation, and non-Hangul characters in sentences', () => {
    expect(romanize('안녕하세요! 반갑습니다.')).toBe('annyeonghaseyo! bangapseumnida.');
    expect(romanize('사과, 배, 포도')).toBe('sagwa, bae, podo');
    expect(romanize('Hello 세계')).toBe('Hello segye');
  });

  it('should romanize isolated single Jamos', () => {
    expect(romanize('ㄱ')).toBe('g');
    expect(romanize('ㅏ')).toBe('a');
    expect(romanize('ㅎ')).toBe('h');
    expect(romanize('ㅘ')).toBe('wa');
  });

  it('should fallback to explicit item.pronunciation when specified', () => {
    const itemWithOverride: LessonItem = {
      id: 'test-1',
      moduleId: 'test',
      target: 'ㅏ',
      pronunciation: 'a (Key K)',
      translation: 'A',
    };
    expect(getPronunciation(itemWithOverride)).toBe('a (Key K)');

    const itemWithoutOverride: LessonItem = {
      id: 'test-2',
      moduleId: 'test',
      target: '호랑이',
      translation: 'Tiger',
    };
    expect(getPronunciation(itemWithoutOverride)).toBe('horangi');
  });
});
