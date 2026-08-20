/** Hand assigned to touch-typing key. */
export type KeyboardHand = 'left' | 'right';

/** Definition of keycap metadata for Dubeolsik (2-set) Korean keyboard. */
export interface KeyCapDefinition {
  key: string;
  jamo: string;
  shiftJamo?: string;
  type: 'consonant' | 'vowel' | 'punctuation' | 'symbol';
}

/** Extended canonical layout entry including row index and typing hand. */
export interface DubeolsikKeyEntry extends KeyCapDefinition {
  row: 0 | 1 | 2;
  hand: KeyboardHand;
}

/**
 * Single canonical definition for the Dubeolsik (2-set) QWERTY keyboard layout.
 * Left-hand keys (Q-T, A-G, Z-V) correspond to consonants.
 * Right-hand keys (Y-P, H-L, B-M) correspond to vowels.
 */
export const DUBEOLSIK_KEY_DEFINITIONS: DubeolsikKeyEntry[] = [
  // Row 0: Q W E R T Y U I O P
  { row: 0, key: 'q', jamo: 'ㅂ', shiftJamo: 'ㅃ', type: 'consonant', hand: 'left' },
  { row: 0, key: 'w', jamo: 'ㅈ', shiftJamo: 'ㅉ', type: 'consonant', hand: 'left' },
  { row: 0, key: 'e', jamo: 'ㄷ', shiftJamo: 'ㄸ', type: 'consonant', hand: 'left' },
  { row: 0, key: 'r', jamo: 'ㄱ', shiftJamo: 'ㄲ', type: 'consonant', hand: 'left' },
  { row: 0, key: 't', jamo: 'ㅅ', shiftJamo: 'ㅆ', type: 'consonant', hand: 'left' },
  { row: 0, key: 'y', jamo: 'ㅛ', type: 'vowel', hand: 'right' },
  { row: 0, key: 'u', jamo: 'ㅕ', type: 'vowel', hand: 'right' },
  { row: 0, key: 'i', jamo: 'ㅑ', type: 'vowel', hand: 'right' },
  { row: 0, key: 'o', jamo: 'ㅐ', shiftJamo: 'ㅒ', type: 'vowel', hand: 'right' },
  { row: 0, key: 'p', jamo: 'ㅔ', shiftJamo: 'ㅖ', type: 'vowel', hand: 'right' },

  // Row 1: A S D F G H J K L
  { row: 1, key: 'a', jamo: 'ㅁ', type: 'consonant', hand: 'left' },
  { row: 1, key: 's', jamo: 'ㄴ', type: 'consonant', hand: 'left' },
  { row: 1, key: 'd', jamo: 'ㅇ', type: 'consonant', hand: 'left' },
  { row: 1, key: 'f', jamo: 'ㄹ', type: 'consonant', hand: 'left' },
  { row: 1, key: 'g', jamo: 'ㅎ', type: 'consonant', hand: 'left' },
  { row: 1, key: 'h', jamo: 'ㅗ', type: 'vowel', hand: 'right' },
  { row: 1, key: 'j', jamo: 'ㅓ', type: 'vowel', hand: 'right' },
  { row: 1, key: 'k', jamo: 'ㅏ', type: 'vowel', hand: 'right' },
  { row: 1, key: 'l', jamo: 'ㅣ', type: 'vowel', hand: 'right' },

  // Row 2: Z X C V B N M , .
  { row: 2, key: 'z', jamo: 'ㅋ', type: 'consonant', hand: 'left' },
  { row: 2, key: 'x', jamo: 'ㅌ', type: 'consonant', hand: 'left' },
  { row: 2, key: 'c', jamo: 'ㅊ', type: 'consonant', hand: 'left' },
  { row: 2, key: 'v', jamo: 'ㅍ', type: 'consonant', hand: 'left' },
  { row: 2, key: 'b', jamo: 'ㅠ', type: 'vowel', hand: 'right' },
  { row: 2, key: 'n', jamo: 'ㅜ', type: 'vowel', hand: 'right' },
  { row: 2, key: 'm', jamo: 'ㅡ', type: 'vowel', hand: 'right' },
  { row: 2, key: ',', jamo: ',', shiftJamo: '<', type: 'punctuation', hand: 'right' },
  { row: 2, key: '.', jamo: '.', shiftJamo: '>', type: 'punctuation', hand: 'right' },
];

/**
 * Standard Dubeolsik (2-set) Korean keyboard layout mapping partitioned across 3 QWERTY rows.
 */
export const DUBEOLSIK_ROWS: KeyCapDefinition[][] = [
  DUBEOLSIK_KEY_DEFINITIONS.filter((item) => item.row === 0),
  DUBEOLSIK_KEY_DEFINITIONS.filter((item) => item.row === 1),
  DUBEOLSIK_KEY_DEFINITIONS.filter((item) => item.row === 2),
];

/**
 * Mobile symbol mode keyboard layout across 3 rows.
 */
export const SYMBOL_ROWS: KeyCapDefinition[][] = [
  // Row 1: 1 2 3 4 5 6 7 8 9 0 (10 keys)
  [
    { key: '1', jamo: '1', type: 'symbol' },
    { key: '2', jamo: '2', type: 'symbol' },
    { key: '3', jamo: '3', type: 'symbol' },
    { key: '4', jamo: '4', type: 'symbol' },
    { key: '5', jamo: '5', type: 'symbol' },
    { key: '6', jamo: '6', type: 'symbol' },
    { key: '7', jamo: '7', type: 'symbol' },
    { key: '8', jamo: '8', type: 'symbol' },
    { key: '9', jamo: '9', type: 'symbol' },
    { key: '0', jamo: '0', type: 'symbol' },
  ],
  // Row 2: @ # ₩ _ & - + ( ) / (10 keys)
  [
    { key: '@', jamo: '@', type: 'symbol' },
    { key: '#', jamo: '#', type: 'symbol' },
    { key: '₩', jamo: '₩', type: 'symbol' },
    { key: '_', jamo: '_', type: 'symbol' },
    { key: '&', jamo: '&', type: 'symbol' },
    { key: '-', jamo: '-', type: 'symbol' },
    { key: '+', jamo: '+', type: 'symbol' },
    { key: '(', jamo: '(', type: 'symbol' },
    { key: ')', jamo: ')', type: 'symbol' },
    { key: '/', jamo: '/', type: 'symbol' },
  ],
  // Row 3: * " ' : ; ! ? (7 keys)
  [
    { key: '*', jamo: '*', type: 'symbol' },
    { key: '"', jamo: '"', type: 'symbol' },
    { key: "'", jamo: "'", type: 'symbol' },
    { key: ':', jamo: ':', type: 'symbol' },
    { key: ';', jamo: ';', type: 'symbol' },
    { key: '!', jamo: '!', type: 'symbol' },
    { key: '?', jamo: '?', type: 'symbol' },
  ],
];

/** Specific hand/shift overrides for symbols and numbers. */
const SYMBOL_KEY_METADATA: Record<string, { hand: KeyboardHand; shift?: boolean }> = {
  '1': { hand: 'left' },
  '2': { hand: 'left' },
  '3': { hand: 'left' },
  '4': { hand: 'left' },
  '5': { hand: 'left' },
  '6': { hand: 'right' },
  '7': { hand: 'right' },
  '8': { hand: 'right' },
  '9': { hand: 'right' },
  '0': { hand: 'right' },
  '@': { hand: 'left', shift: true },
  '#': { hand: 'left', shift: true },
  '₩': { hand: 'right' },
  _: { hand: 'right', shift: true },
  '&': { hand: 'right', shift: true },
  '-': { hand: 'right' },
  '+': { hand: 'right', shift: true },
  '(': { hand: 'right', shift: true },
  ')': { hand: 'right', shift: true },
  '/': { hand: 'right' },
  '*': { hand: 'right', shift: true },
  '"': { hand: 'right', shift: true },
  "'": { hand: 'right' },
  ':': { hand: 'right', shift: true },
  ';': { hand: 'right' },
  '!': { hand: 'left', shift: true },
  '?': { hand: 'right', shift: true },
};

/**
 * Builds the derived lookup map from single Hangul Jamos, numbers, and symbols
 * to their keystroke representation, Shift requirement, and typing hand.
 */
function buildJamoToKeyMap(): Record<
  string,
  { key: string; shift?: boolean; hand: KeyboardHand }
> {
  const map: Record<string, { key: string; shift?: boolean; hand: KeyboardHand }> = {};

  for (const entry of DUBEOLSIK_KEY_DEFINITIONS) {
    map[entry.jamo] = { key: entry.key, hand: entry.hand };
    if (entry.shiftJamo && entry.type !== 'punctuation') {
      map[entry.shiftJamo] = { key: entry.key, shift: true, hand: entry.hand };
    }
  }

  for (const row of SYMBOL_ROWS) {
    for (const item of row) {
      const meta = SYMBOL_KEY_METADATA[item.key];
      if (meta) {
        map[item.key] = {
          key: item.key,
          hand: meta.hand,
          ...(meta.shift ? { shift: true } : {}),
        };
      }
    }
  }

  return map;
}

/** Map of individual Hangul Jamos, numbers, and symbols to their standard keystroke representation. */
export const JAMO_TO_KEY = buildJamoToKeyMap();
