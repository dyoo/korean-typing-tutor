/** Definition of keycap metadata for Dubeolsik (2-set) Korean keyboard. */
export interface KeyCapDefinition {
  key: string;
  jamo: string;
  shiftJamo?: string;
  type: 'consonant' | 'vowel';
}

/**
 * Standard Dubeolsik (2-set) Korean keyboard layout mapping across 3 QWERTY rows.
 * Left-hand keys (Q-T, A-G, Z-V) correspond to consonants.
 * Right-hand keys (Y-P, H-L, B-M) correspond to vowels.
 */
export const DUBEOLSIK_ROWS: KeyCapDefinition[][] = [
  // Row 1: Q W E R T Y U I O P
  [
    { key: 'q', jamo: 'ㅂ', shiftJamo: 'ㅃ', type: 'consonant' },
    { key: 'w', jamo: 'ㅈ', shiftJamo: 'ㅉ', type: 'consonant' },
    { key: 'e', jamo: 'ㄷ', shiftJamo: 'ㄸ', type: 'consonant' },
    { key: 'r', jamo: 'ㄱ', shiftJamo: 'ㄲ', type: 'consonant' },
    { key: 't', jamo: 'ㅅ', shiftJamo: 'ㅆ', type: 'consonant' },
    { key: 'y', jamo: 'ㅛ', type: 'vowel' },
    { key: 'u', jamo: 'ㅕ', type: 'vowel' },
    { key: 'i', jamo: 'ㅑ', type: 'vowel' },
    { key: 'o', jamo: 'ㅐ', shiftJamo: 'ㅒ', type: 'vowel' },
    { key: 'p', jamo: 'ㅔ', shiftJamo: 'ㅖ', type: 'vowel' },
  ],
  // Row 2: A S D F G H J K L
  [
    { key: 'a', jamo: 'ㅁ', type: 'consonant' },
    { key: 's', jamo: 'ㄴ', type: 'consonant' },
    { key: 'd', jamo: 'ㅇ', type: 'consonant' },
    { key: 'f', jamo: 'ㄹ', type: 'consonant' },
    { key: 'g', jamo: 'ㅎ', type: 'consonant' },
    { key: 'h', jamo: 'ㅗ', type: 'vowel' },
    { key: 'j', jamo: 'ㅓ', type: 'vowel' },
    { key: 'k', jamo: 'ㅏ', type: 'vowel' },
    { key: 'l', jamo: 'ㅣ', type: 'vowel' },
  ],
  // Row 3: Z X C V B N M
  [
    { key: 'z', jamo: 'ㅋ', type: 'consonant' },
    { key: 'x', jamo: 'ㅌ', type: 'consonant' },
    { key: 'c', jamo: 'ㅊ', type: 'consonant' },
    { key: 'v', jamo: 'ㅍ', type: 'consonant' },
    { key: 'b', jamo: 'ㅠ', type: 'vowel' },
    { key: 'n', jamo: 'ㅜ', type: 'vowel' },
    { key: 'm', jamo: 'ㅡ', type: 'vowel' },
  ],
];

/** Map of individual Hangul Jamos to their standard QWERTY keystroke representation and hand assignment. */
export const JAMO_TO_KEY: Record<string, { key: string; shift?: boolean; hand: 'left' | 'right' }> =
  {
    ㅂ: { key: 'q', hand: 'left' },
    ㅃ: { key: 'q', shift: true, hand: 'left' },
    ㅈ: { key: 'w', hand: 'left' },
    ㅉ: { key: 'w', shift: true, hand: 'left' },
    ㄷ: { key: 'e', hand: 'left' },
    ㄸ: { key: 'e', shift: true, hand: 'left' },
    ㄱ: { key: 'r', hand: 'left' },
    ㄲ: { key: 'r', shift: true, hand: 'left' },
    ㅅ: { key: 't', hand: 'left' },
    ㅆ: { key: 't', shift: true, hand: 'left' },
    ㅛ: { key: 'y', hand: 'right' },
    ㅕ: { key: 'u', hand: 'right' },
    ㅑ: { key: 'i', hand: 'right' },
    ㅐ: { key: 'o', hand: 'right' },
    ㅒ: { key: 'o', shift: true, hand: 'right' },
    ㅔ: { key: 'p', hand: 'right' },
    ㅖ: { key: 'p', shift: true, hand: 'right' },
    ㅁ: { key: 'a', hand: 'left' },
    ㄴ: { key: 's', hand: 'left' },
    ㅇ: { key: 'd', hand: 'left' },
    ㄹ: { key: 'f', hand: 'left' },
    ㅎ: { key: 'g', hand: 'left' },
    ㅗ: { key: 'h', hand: 'right' },
    ㅓ: { key: 'j', hand: 'right' },
    ㅏ: { key: 'k', hand: 'right' },
    ㅣ: { key: 'l', hand: 'right' },
    ㅋ: { key: 'z', hand: 'left' },
    ㅌ: { key: 'x', hand: 'left' },
    ㅊ: { key: 'c', hand: 'left' },
    ㅍ: { key: 'v', hand: 'left' },
    ㅠ: { key: 'b', hand: 'right' },
    ㅜ: { key: 'n', hand: 'right' },
    ㅡ: { key: 'm', hand: 'right' },
  };
