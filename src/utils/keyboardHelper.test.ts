import { describe, it, expect } from 'vitest';
import { getNextRequiredKeys } from './keyboardHelper';

describe('getNextRequiredKeys helper', () => {
  it('should return empty array when lesson item is completed or target is empty', () => {
    expect(getNextRequiredKeys('가나다', '가나다', true)).toEqual([]);
    expect(getNextRequiredKeys('', '', false)).toEqual([]);
  });

  it('should return the key for the initial consonant (Choseong) when input is empty', () => {
    expect(getNextRequiredKeys('가', '', false)).toEqual(['r']); // 'ㄱ'
    expect(getNextRequiredKeys('사과', '', false)).toEqual(['t']); // 'ㅅ'
    expect(getNextRequiredKeys('우유', '', false)).toEqual(['d']); // 'ㅇ'
  });

  it('should return the key for the next required vowel (Jungseong) when initial consonant (Choseong) is entered', () => {
    expect(getNextRequiredKeys('가', 'ㄱ', false)).toEqual(['k']); // 'ㅏ'
    expect(getNextRequiredKeys('사과', 'ㅅ', false)).toEqual(['k']); // 'ㅏ'
  });

  it('should handle compound vowels step-by-step', () => {
    // Target '과' (ㄱ ㅗ ㅏ): input '고' (ㄱ ㅗ) -> next required is 'ㅏ' ('k')
    expect(getNextRequiredKeys('과', '고', false)).toEqual(['k']);
  });

  it('should handle compound final consonants step-by-step', () => {
    // Target '닭' (ㄷ ㅏ ㄹ ㄱ): input '달' (ㄷ ㅏ ㄹ) -> next required is 'ㄱ' ('r')
    expect(getNextRequiredKeys('닭', '달', false)).toEqual(['r']);
  });

  it('should advance to next syllable when current syllable is completed', () => {
    expect(getNextRequiredKeys('가나다', '가', false)).toEqual(['s']); // 'ㄴ' for '나'
    expect(getNextRequiredKeys('가나다', '가나', false)).toEqual(['e']); // 'ㄷ' for '다'
  });

  it('should correctly hint vowel when initial consonant of next syllable was absorbed into previous syllable block (Issue #4)', () => {
    // Target '하나와', input '한' (where 'ㄴ' was absorbed into '하' -> '한'). Next required key for '나' is 'ㅏ' ('k').
    expect(getNextRequiredKeys('하나와', '한', false)).toEqual(['k']);
    // Target '달고기', input '닭' (where 'ㄱ' was absorbed into '달' -> '닭'). Next required key for '고' is 'ㅗ' ('h').
    expect(getNextRequiredKeys('달고기', '닭', false)).toEqual(['h']);
  });

  it('should return space key when target character is a space', () => {
    expect(getNextRequiredKeys('사 과', '사', false)).toEqual([' ']);
  });

  it('should return opposite-hand shift key alongside letter key when Jamo requires Shift key', () => {
    expect(getNextRequiredKeys('까', '', false)).toEqual(['right-shift', 'r']); // 'ㄲ' (left hand R) -> Right-Shift
    expect(getNextRequiredKeys('꿀잼', '', false)).toEqual(['right-shift', 'r']); // 'ㄲ' for '꿀잼' -> Right-Shift
    expect(getNextRequiredKeys('따', '', false)).toEqual(['right-shift', 'e']); // 'ㄸ' (left hand E) -> Right-Shift
    expect(getNextRequiredKeys('빠', '', false)).toEqual(['right-shift', 'q']); // 'ㅃ' (left hand Q) -> Right-Shift
    expect(getNextRequiredKeys('싸', '', false)).toEqual(['right-shift', 't']); // 'ㅆ' (left hand T) -> Right-Shift
    expect(getNextRequiredKeys('짜', '', false)).toEqual(['right-shift', 'w']); // 'ㅉ' (left hand W) -> Right-Shift
    expect(getNextRequiredKeys('얘', '', false)).toEqual(['d']); // 'ㅇ' -> D
    expect(getNextRequiredKeys('얘', 'ㅇ', false)).toEqual(['left-shift', 'o']); // 'ㅒ' (right hand O) -> Left-Shift
    expect(getNextRequiredKeys('예', 'ㅇ', false)).toEqual(['left-shift', 'p']); // 'ㅖ' (right hand P) -> Left-Shift
  });

  it('should return punctuation keys for comma and period', () => {
    expect(getNextRequiredKeys(',', '', false)).toEqual([',']);
    expect(getNextRequiredKeys('.', '', false)).toEqual(['.']);
    expect(getNextRequiredKeys('가요.', '가요', false)).toEqual(['.']);
    expect(getNextRequiredKeys('사과, 배', '사과', false)).toEqual([',']);
  });

  it('should return keys for numbers and supported symbols', () => {
    expect(getNextRequiredKeys('123', '', false)).toEqual(['1']);
    expect(getNextRequiredKeys('123', '1', false)).toEqual(['2']);
    expect(getNextRequiredKeys('!?', '', false)).toEqual(['right-shift', '!']);
    expect(getNextRequiredKeys('!?', '!', false)).toEqual(['left-shift', '?']);
  });

  it('should return empty array for unsupported or unknown characters', () => {
    expect(getNextRequiredKeys('$', '', false)).toEqual([]);
    expect(getNextRequiredKeys('<', '', false)).toEqual([]);
    expect(getNextRequiredKeys('>', '', false)).toEqual([]);
  });
});
