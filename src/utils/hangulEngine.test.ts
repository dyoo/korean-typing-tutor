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

  it('should handle direct pre-composed Unicode Hangul syllable input from native OS IME', () => {
    expect(engine.handleKey('가')).toBe('가');
    expect(engine.handleKey('나')).toBe('가나');
    expect(engine.handleKey('다')).toBe('가나다');
  });

  it('should fallback unmapped uppercase Shift keys to lowercase Jamo equivalents in Dubeolsik', () => {
    // Unmapped consonants: X (ㅌ), Z (ㅋ), C (ㅊ), V (ㅍ), G (ㅎ), A (ㅁ), S (ㄴ), D (ㅇ), F (ㄹ)
    expect(engine.handleKey('X')).toBe('ㅌ');
    engine.reset();
    expect(engine.handleKey('Z')).toBe('ㅋ');
    engine.reset();
    expect(engine.handleKey('C')).toBe('ㅊ');
    engine.reset();
    expect(engine.handleKey('V')).toBe('ㅍ');
    engine.reset();
    expect(engine.handleKey('G')).toBe('ㅎ');
    engine.reset();
    expect(engine.handleKey('A')).toBe('ㅁ');
    engine.reset();
    expect(engine.handleKey('S')).toBe('ㄴ');
    engine.reset();
    expect(engine.handleKey('D')).toBe('ㅇ');
    engine.reset();
    expect(engine.handleKey('F')).toBe('ㄹ');

    // Unmapped vowels: H (ㅗ), J (ㅓ), K (ㅏ), L (ㅣ), B (ㅠ), N (ㅜ), M (ㅡ), Y (ㅛ), I (ㅑ), U (ㅕ)
    engine.reset();
    expect(engine.handleKey('H')).toBe('ㅗ');
    engine.reset();
    expect(engine.handleKey('K')).toBe('ㅏ');
    engine.reset();
    expect(engine.handleKey('L')).toBe('ㅣ');
    engine.reset();
    expect(engine.handleKey('B')).toBe('ㅠ');
    engine.reset();
    expect(engine.handleKey('N')).toBe('ㅜ');
    engine.reset();
    expect(engine.handleKey('M')).toBe('ㅡ');
  });

  it('should compose all 7 compound vowels and decompose them step-by-step with Backspace', () => {
    // 1. ㅗ + ㅏ = ㅘ
    engine.reset();
    engine.handleKey('h'); // ㅗ
    expect(engine.handleKey('k')).toBe('ㅘ');
    expect(engine.handleKey('Backspace')).toBe('ㅗ');

    // 2. ㅗ + ㅐ = ㅙ
    engine.reset();
    engine.handleKey('h'); // ㅗ
    expect(engine.handleKey('o')).toBe('ㅙ');
    expect(engine.handleKey('Backspace')).toBe('ㅗ');

    // 3. ㅗ + ㅣ = ㅚ
    engine.reset();
    engine.handleKey('h'); // ㅗ
    expect(engine.handleKey('l')).toBe('ㅚ');
    expect(engine.handleKey('Backspace')).toBe('ㅗ');

    // 4. ㅜ + ㅓ = ㅝ
    engine.reset();
    engine.handleKey('n'); // ㅜ
    expect(engine.handleKey('j')).toBe('ㅝ');
    expect(engine.handleKey('Backspace')).toBe('ㅜ');

    // 5. ㅜ + ㅔ = ㅞ
    engine.reset();
    engine.handleKey('n'); // ㅜ
    expect(engine.handleKey('p')).toBe('ㅞ');
    expect(engine.handleKey('Backspace')).toBe('ㅜ');

    // 6. ㅜ + ㅣ = ㅟ
    engine.reset();
    engine.handleKey('n'); // ㅜ
    expect(engine.handleKey('l')).toBe('ㅟ');
    expect(engine.handleKey('Backspace')).toBe('ㅜ');

    // 7. ㅡ + ㅣ = ㅢ
    engine.reset();
    engine.handleKey('m'); // ㅡ
    expect(engine.handleKey('l')).toBe('ㅢ');
    expect(engine.handleKey('Backspace')).toBe('ㅡ');
  });

  it('should compose all 11 compound final consonants (Jongseong) and decompose them step-by-step with Backspace', () => {
    // 1. ㄱ + ㅅ = ㄳ (e.g. 몫)
    engine.reset();
    engine.handleKey('a'); // ㅁ
    engine.handleKey('h'); // ㅗ
    engine.handleKey('r'); // ㄱ -> 목
    expect(engine.handleKey('t')).toBe('몫');
    expect(engine.handleKey('Backspace')).toBe('목');

    // 2. ㄴ + ㅈ = ㄵ (e.g. 앉)
    engine.reset();
    engine.handleKey('d'); // ㅇ
    engine.handleKey('k'); // ㅏ
    engine.handleKey('s'); // ㄴ -> 안
    expect(engine.handleKey('w')).toBe('앉');
    expect(engine.handleKey('Backspace')).toBe('안');

    // 3. ㄴ + ㅎ = ㄶ (e.g. 많)
    engine.reset();
    engine.handleKey('a'); // ㅁ
    engine.handleKey('k'); // ㅏ
    engine.handleKey('s'); // ㄴ -> 만
    expect(engine.handleKey('g')).toBe('많');
    expect(engine.handleKey('Backspace')).toBe('만');

    // 4. ㄹ + ㄱ = ㄺ (e.g. 닭)
    engine.reset();
    engine.handleKey('e'); // ㄷ
    engine.handleKey('k'); // ㅏ
    engine.handleKey('f'); // ㄹ -> 달
    expect(engine.handleKey('r')).toBe('닭');
    expect(engine.handleKey('Backspace')).toBe('달');

    // 5. ㄹ + ㅁ = ㄻ (e.g. 삶)
    engine.reset();
    engine.handleKey('t'); // ㅅ
    engine.handleKey('k'); // ㅏ
    engine.handleKey('f'); // ㄹ -> 살
    expect(engine.handleKey('a')).toBe('삶');
    expect(engine.handleKey('Backspace')).toBe('살');

    // 6. ㄹ + ㅂ = ㄼ (e.g. 넓)
    engine.reset();
    engine.handleKey('s'); // ㄴ
    engine.handleKey('j'); // ㅓ
    engine.handleKey('f'); // ㄹ -> 널
    expect(engine.handleKey('q')).toBe('넓');
    expect(engine.handleKey('Backspace')).toBe('널');

    // 7. ㄹ + ㅅ = ㄽ (e.g. 골) + ㅅ = 곬
    engine.reset();
    engine.handleKey('r'); // ㄱ
    engine.handleKey('h'); // ㅗ
    engine.handleKey('f'); // ㄹ -> 골
    expect(engine.handleKey('t')).toBe('곬');
    expect(engine.handleKey('Backspace')).toBe('골');

    // 8. ㄹ + ㅌ = ㄾ (e.g. 핥)
    engine.reset();
    engine.handleKey('g'); // ㅎ
    engine.handleKey('k'); // ㅏ
    engine.handleKey('f'); // ㄹ -> 할
    expect(engine.handleKey('x')).toBe('핥');
    expect(engine.handleKey('Backspace')).toBe('할');

    // 9. ㄹ + ㅍ = ㄿ (e.g. 읊)
    engine.reset();
    engine.handleKey('d'); // ㅇ
    engine.handleKey('m'); // ㅡ
    engine.handleKey('f'); // ㄹ -> 을
    expect(engine.handleKey('v')).toBe('읊');
    expect(engine.handleKey('Backspace')).toBe('을');

    // 10. ㄹ + ㅎ = ㅀ (e.g. 잃)
    engine.reset();
    engine.handleKey('d'); // ㅇ
    engine.handleKey('l'); // ㅣ
    engine.handleKey('f'); // ㄹ -> 일
    expect(engine.handleKey('g')).toBe('잃');
    expect(engine.handleKey('Backspace')).toBe('일');

    // 11. ㅂ + ㅅ = ㅄ (e.g. 값)
    engine.reset();
    engine.handleKey('r'); // ㄱ
    engine.handleKey('k'); // ㅏ
    engine.handleKey('q'); // ㅂ -> 갑
    expect(engine.handleKey('t')).toBe('값');
    expect(engine.handleKey('Backspace')).toBe('갑');
  });

  it('should rehydrate composition state cleanly with resetTo(prefix)', () => {
    // Empty prefix
    engine.resetTo('');
    expect(engine.getComposedText()).toBe('');

    // Complete syllable prefix
    engine.resetTo('안녕');
    expect(engine.getComposedText()).toBe('안녕');
    // Next keystroke starts fresh syllable block
    expect(engine.handleKey('g')).toBe('안녕ㅎ');

    // Prefix ending with standalone Choseong consonant
    engine.resetTo('안녕ㅎ');
    expect(engine.getComposedText()).toBe('안녕ㅎ');
    // Next vowel keystroke continues composition into syllable '하'
    expect(engine.handleKey('k')).toBe('안녕하');

    // Prefix ending with standalone Jungseong vowel
    engine.resetTo('안녕ㅏ');
    expect(engine.getComposedText()).toBe('안녕ㅏ');
    // Next consonant keystroke starts new Choseong
    expect(engine.handleKey('r')).toBe('안녕ㅏㄱ');
  });
});
