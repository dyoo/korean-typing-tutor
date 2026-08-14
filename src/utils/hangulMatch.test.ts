import { describe, it, expect } from 'vitest';
import { isPartialOrExactMatch, isSyllableComplete, checkErrors } from './hangulMatch';
import { HangulEngine, compose } from './hangulEngine';

describe('Syllable matching and error evaluation (hangulMatch)', () => {
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

  it('should return no errors for exact match', () => {
    const target = 'hello';
    const input = 'hello';
    const errors = checkErrors(target, input);
    expect(errors.length).toBe(5);
    expect(errors.every((e) => !e.isError)).toBe(true);
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

  it('should flag completed incorrect syllables as errors (Issue #3: typing 난날이 for 나날이)', () => {
    const target = '나날이';
    const input = '난날이';
    const errors = checkErrors(target, input);
    expect(errors[0].isError).toBe(true); // '난' is finalized and incorrect for '나'
    expect(errors[1].isError).toBe(false); // '날' matches '날'
    expect(errors[2].isError).toBe(false); // '이' matches '이'
  });

  it('should handle step-by-step typing of multi-syllable word 화장실 without false errors', () => {
    const target = '화장실';
    const engine = new HangulEngine();
    const keystrokes = ['g', 'h', 'k', 'w', 'k', 'd', 't', 'l', 'f'];

    let currentInput = '';
    for (const key of keystrokes) {
      currentInput = engine.handleKey(key);
      const errors = checkErrors(target, currentInput);
      expect(errors.every((e) => !e.isError)).toBe(true);
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
    expect(step5.every((e) => !e.isError)).toBe(true);
  });

  it('should recognize compound Jongseong partial matches as valid', () => {
    expect(isPartialOrExactMatch('닭', '달')).toBe(true);
    expect(isPartialOrExactMatch('닭', '다')).toBe(true);
    expect(isPartialOrExactMatch('닭', 'ㄷ')).toBe(true);
    expect(isPartialOrExactMatch('닭', '닭')).toBe(true);
    expect(isPartialOrExactMatch('닭', '댟')).toBe(false);
  });

  it('should flag flushed incomplete Jamo blocks as errors when typing only consonants (Issue #1)', () => {
    const target = '어머니';

    // Single active consonant 'ㅇ' is in-progress for position 0
    let errors = checkErrors(target, 'ㅇ');
    expect(errors[0].isError).toBe(false);

    // Typing second consonant 'ㅁ' flushes 'ㅇ' as incomplete syllable for '어'
    errors = checkErrors(target, 'ㅇㅁ');
    expect(errors[0].isError).toBe(true); // 'ㅇ' is flushed, incomplete for '어'
    expect(errors[1].isError).toBe(false); // 'ㅁ' is active, in-progress for '머'

    // Typing third consonant 'ㄴ' flushes 'ㅁ' as incomplete syllable for '머'
    errors = checkErrors(target, 'ㅇㅁㄴ');
    expect(errors[0].isError).toBe(true); // 'ㅇ' is flushed, incomplete for '어'
    expect(errors[1].isError).toBe(true); // 'ㅁ' is flushed, incomplete for '머'
    expect(errors[2].isError).toBe(false); // 'ㄴ' is active, in-progress for '니'
  });
});
