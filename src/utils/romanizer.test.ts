import { describe, it, expect } from 'vitest';
import { romanize, decomposeSyllable, getPronunciation } from './romanizer';
import type { LessonItem } from '../types/korean';

describe('Dynamic Romanizer Engine', () => {
  it('should decompose Hangul syllables into 초성, 중성, 종성', () => {
    expect(decomposeSyllable('가')).toEqual({ cho: 'ㄱ', jung: 'ㅏ', jong: '' });
    expect(decomposeSyllable('한')).toEqual({ cho: 'ㅎ', jung: 'ㅏ', jong: 'ㄴ' });
    expect(decomposeSyllable('글')).toEqual({ cho: 'ㄱ', jung: 'ㅡ', jong: 'ㄹ' });
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

  it('should handle liaison sound changes before vowels', () => {
    expect(romanize('한국어')).toBe('hangugeo');
    expect(romanize('꽃이')).toBe('kkochi');
    expect(romanize('월요일')).toBe('woryoil');
  });

  it('should handle nasalization before ㄴ and ㅁ', () => {
    expect(romanize('입니다')).toBe('imnida');
    expect(romanize('감사합니다')).toBe('gamsahamnida');
    expect(romanize('킹받네')).toBe('kingbanne');
  });

  it('should handle liquidization of ㄴ and ㄹ', () => {
    expect(romanize('설날')).toBe('seollal');
    expect(romanize('신라')).toBe('silla');
    expect(romanize('완료')).toBe('wallyo');
  });

  it('should fallback to explicit item.pronunciation when specified', () => {
    const itemWithOverride: LessonItem = {
      id: 'test-1',
      moduleId: 'test',
      type: 'syllable',
      target: 'ㅏ',
      pronunciation: 'a (Key K)',
      translation: 'A'
    };
    expect(getPronunciation(itemWithOverride)).toBe('a (Key K)');

    const itemWithoutOverride: LessonItem = {
      id: 'test-2',
      moduleId: 'test',
      type: 'word',
      target: '호랑이',
      translation: 'Tiger'
    };
    expect(getPronunciation(itemWithoutOverride)).toBe('horangi');
  });
});
