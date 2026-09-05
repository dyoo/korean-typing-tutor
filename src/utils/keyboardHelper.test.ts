import { describe, it, expect } from 'vitest';
import { getNextRequiredKeys } from './keyboardHelper';
import { decomposeStringToJamos } from './hangulDecompose';

const nextKeys = (target: string, input: string, isCompleted: boolean) =>
  getNextRequiredKeys(decomposeStringToJamos(target), input, isCompleted);

describe('getNextRequiredKeys helper', () => {
  it('should return empty array when lesson item is completed or target is empty', () => {
    expect(nextKeys('가나다', '가나다', true)).toEqual([]);
    expect(nextKeys('', '', false)).toEqual([]);
    expect(getNextRequiredKeys([], '', false)).toEqual([]);
  });

  it('should return the key for the initial consonant (Choseong) when input is empty', () => {
    expect(nextKeys('가', '', false)).toEqual(['r']); // 'ㄱ'
    expect(nextKeys('사과', '', false)).toEqual(['t']); // 'ㅅ'
    expect(nextKeys('우유', '', false)).toEqual(['d']); // 'ㅇ'
  });

  it('should return the key for the next required vowel (Jungseong) when initial consonant (Choseong) is entered', () => {
    expect(nextKeys('가', 'ㄱ', false)).toEqual(['k']); // 'ㅏ'
    expect(nextKeys('사과', 'ㅅ', false)).toEqual(['k']); // 'ㅏ'
  });

  it('should handle compound vowels step-by-step', () => {
    // Target '과' (ㄱ ㅗ ㅏ): input '고' (ㄱ ㅗ) -> next required is 'ㅏ' ('k')
    expect(nextKeys('과', '고', false)).toEqual(['k']);
  });

  it('should handle compound final consonants step-by-step', () => {
    // Target '닭' (ㄷ ㅏ ㄹ ㄱ): input '달' (ㄷ ㅏ ㄹ) -> next required is 'ㄱ' ('r')
    expect(nextKeys('닭', '달', false)).toEqual(['r']);
  });

  it('should advance to next syllable when current syllable is completed', () => {
    expect(nextKeys('가나다', '가', false)).toEqual(['s']); // 'ㄴ' for '나'
    expect(nextKeys('가나다', '가나', false)).toEqual(['e']); // 'ㄷ' for '다'
  });

  it('should correctly hint vowel when initial consonant of next syllable was absorbed into previous syllable block (Issue #4)', () => {
    // Target '하나와', input '한' (where 'ㄴ' was absorbed into '하' -> '한'). Next required key for '나' is 'ㅏ' ('k').
    expect(nextKeys('하나와', '한', false)).toEqual(['k']);
    // Target '달고기', input '닭' (where 'ㄱ' was absorbed into '달' -> '닭'). Next required key for '고' is 'ㅗ' ('h').
    expect(nextKeys('달고기', '닭', false)).toEqual(['h']);
  });

  it('should return space key when target character is a space', () => {
    expect(nextKeys('사 과', '사', false)).toEqual([' ']);
  });

  it('should return opposite-hand shift key alongside letter key when Jamo requires Shift key', () => {
    expect(nextKeys('까', '', false)).toEqual(['right-shift', 'r']); // 'ㄲ' (left hand R) -> Right-Shift
    expect(nextKeys('꿀잼', '', false)).toEqual(['right-shift', 'r']); // 'ㄲ' for '꿀잼' -> Right-Shift
    expect(nextKeys('따', '', false)).toEqual(['right-shift', 'e']); // 'ㄸ' (left hand E) -> Right-Shift
    expect(nextKeys('빠', '', false)).toEqual(['right-shift', 'q']); // 'ㅃ' (left hand Q) -> Right-Shift
    expect(nextKeys('싸', '', false)).toEqual(['right-shift', 't']); // 'ㅆ' (left hand T) -> Right-Shift
    expect(nextKeys('짜', '', false)).toEqual(['right-shift', 'w']); // 'ㅉ' (left hand W) -> Right-Shift
    expect(nextKeys('얘', '', false)).toEqual(['d']); // 'ㅇ' -> D
    expect(nextKeys('얘', 'ㅇ', false)).toEqual(['left-shift', 'o']); // 'ㅒ' (right hand O) -> Left-Shift
    expect(nextKeys('예', 'ㅇ', false)).toEqual(['left-shift', 'p']); // 'ㅖ' (right hand P) -> Left-Shift
  });

  it('should return punctuation keys for comma and period', () => {
    expect(nextKeys(',', '', false)).toEqual([',']);
    expect(nextKeys('.', '', false)).toEqual(['.']);
    expect(nextKeys('가요.', '가요', false)).toEqual(['.']);
    expect(nextKeys('사과, 배', '사과', false)).toEqual([',']);
  });

  it('should return keys for numbers and supported symbols', () => {
    expect(nextKeys('123', '', false)).toEqual(['1']);
    expect(nextKeys('123', '1', false)).toEqual(['2']);
    expect(nextKeys('!?', '', false)).toEqual(['right-shift', '!']);
    expect(nextKeys('!?', '!', false)).toEqual(['left-shift', '?']);
  });

  it('should return empty array for unsupported or unknown characters', () => {
    expect(nextKeys('$', '', false)).toEqual([]);
    expect(nextKeys('<', '', false)).toEqual([]);
    expect(nextKeys('>', '', false)).toEqual([]);
  });
});
