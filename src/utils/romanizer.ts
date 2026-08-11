import type { LessonItem } from '../types/korean';

/** Initial Hangul consonants (초성). */
const CHOSEONG = [
  'ㄱ',
  'ㄲ',
  'ㄴ',
  'ㄷ',
  'ㄸ',
  'ㄹ',
  'ㅁ',
  'ㅂ',
  'ㅃ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅉ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ'
];

/** Medial Hangul vowels (중성). */
const JUNGSEONG = [
  'ㅏ',
  'ㅐ',
  'ㅑ',
  'ㅒ',
  'ㅓ',
  'ㅔ',
  'ㅕ',
  'ㅖ',
  'ㅗ',
  'ㅘ',
  'ㅙ',
  '외',
  '요',
  'ㅜ',
  'ㅝ',
  'ㅞ',
  '위',
  '유',
  'ㅡ',
  'ㅢ',
  'ㅣ'
];

/** Final Hangul consonants (종성). */
const JONGSEONG = [
  '',
  'ㄱ',
  'ㄲ',
  'ㄳ',
  'ㄴ',
  'ㄵ',
  'ㄶ',
  'ㄷ',
  'ㄹ',
  'ㄺ',
  'ㄻ',
  'ㄼ',
  'ㄽ',
  'ㄾ',
  'ㄿ',
  'ㅀ',
  'ㅁ',
  'ㅂ',
  'ㅄ',
  'ㅅ',
  'ㅆ',
  'ㅇ',
  'ㅈ',
  'ㅊ',
  'ㅋ',
  'ㅌ',
  'ㅍ',
  'ㅎ'
];

/** Revised Romanization map for initial consonants (초성). */
const CHO_MAP: Record<string, string> = {
  ㄱ: 'g',
  ㄲ: 'kk',
  ㄴ: 'n',
  ㄷ: 'd',
  ㄸ: 'tt',
  ㄹ: 'r',
  ㅁ: 'm',
  ㅂ: 'b',
  ㅃ: 'pp',
  ㅅ: 's',
  ㅆ: 'ss',
  ㅇ: '',
  ㅈ: 'j',
  ㅉ: 'jj',
  ㅊ: 'ch',
  ㅋ: 'k',
  ㅌ: 't',
  ㅍ: 'p',
  ㅎ: 'h'
};

/** Revised Romanization map for vowels (중성). */
const JUNG_MAP: Record<string, string> = {
  ㅏ: 'a',
  ㅐ: 'ae',
  ㅑ: 'ya',
  ㅒ: 'yae',
  ㅓ: 'eo',
  ㅔ: 'e',
  ㅕ: 'yeo',
  ㅖ: 'ye',
  ㅗ: 'o',
  ㅘ: 'wa',
  ㅙ: 'wae',
  외: 'oe',
  요: 'yo',
  ㅜ: 'u',
  ㅝ: 'wo',
  ㅞ: 'we',
  위: 'wi',
  유: 'yu',
  ㅡ: 'eu',
  ㅢ: 'ui',
  ㅣ: 'i'
};

/** Romanization map for isolated Jamo characters. */
const SINGLE_JAMO_PRONUNCIATION: Record<string, string> = {
  ㅏ: 'a',
  ㅓ: 'eo',
  ㅗ: 'o',
  ㅜ: 'u',
  ㅡ: 'eu',
  ㅣ: 'i',
  ㅐ: 'ae',
  ㅔ: 'e',
  ㅑ: 'ya',
  ㅕ: 'yeo',
  ㅛ: 'yo',
  ㅠ: 'yu',
  ㅒ: 'yae',
  ㅖ: 'ye',
  ㅘ: 'wa',
  ㅙ: 'wae',
  외: 'oe',
  ㅝ: 'wo',
  ㅞ: 'we',
  위: 'wi',
  ㅢ: 'ui',
  ㄱ: 'g',
  ㄴ: 'n',
  ㄷ: 'd',
  ㄹ: 'r/l',
  ㅁ: 'm',
  ㅂ: 'b',
  ㅅ: 's',
  ㅇ: 'ng',
  ㅈ: 'j',
  ㅊ: 'ch',
  ㅋ: 'k',
  ㅌ: 't',
  ㅍ: 'p',
  ㅎ: 'h',
  ㄲ: 'kk',
  ㄸ: 'tt',
  ㅃ: 'pp',
  ㅆ: 'ss',
  ㅉ: 'jj'
};

interface SyllableDecomposition {
  cho: string;
  jung: string;
  jong: string;
  choStr?: string;
  raw?: string;
}

/**
 * Decomposes a single Hangul syllable character into its constituent Jamo (초성, 중성, 종성).
 * Returns null if the character is outside the Unicode Hangul Syllables block (U+AC00..U+D7A3).
 */
export function decomposeSyllable(char: string): SyllableDecomposition | null {
  const code = char.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return null;
  const choIdx = Math.floor(code / 588);
  const jungIdx = Math.floor((code % 588) / 28);
  const jongIdx = code % 28;
  return {
    cho: CHOSEONG[choIdx],
    jung: JUNGSEONG[jungIdx],
    jong: JONGSEONG[jongIdx]
  };
}

/**
 * Converts a final consonant (종성) to its default non-liaison Revised Romanization letter.
 */
function getNormalJongStr(jong: string): string {
  if (['ㄱ', 'ㄲ', 'ㅋ', 'ㄺ'].includes(jong)) return 'k';
  if (['ㄴ', 'ㄵ', 'ㄶ'].includes(jong)) return 'n';
  if (['ㄷ', 'ㅅ', 'ㅆ', 'ㅈ', 'ㅊ', 'ㅌ', 'ㅎ'].includes(jong)) return 't';
  if (['ㄹ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㅀ'].includes(jong)) return 'l';
  if (['ㅁ', 'ㄻ'].includes(jong)) return 'm';
  if (['ㅂ', 'ㅍ', 'ㄿ', 'ㅄ'].includes(jong)) return 'p';
  if (jong === 'ㅇ') return 'ng';
  return '';
}

/**
 * Romanizes a single continuous Korean word, taking into account phonological sound change rules
 * (liaison before vowels, nasalization before ㄴ/ㅁ, liquidization of ㄴ+ㄹ/ㄹ+ㄴ).
 */
function romanizeWord(word: string): string {
  if (word.length === 1 && SINGLE_JAMO_PRONUNCIATION[word]) {
    return SINGLE_JAMO_PRONUNCIATION[word];
  }

  let res = '';
  const syls: SyllableDecomposition[] = [];
  for (let i = 0; i < word.length; i++) {
    const d = decomposeSyllable(word[i]);
    if (d) syls.push(d);
    else syls.push({ cho: '', jung: '', jong: '', raw: word[i] });
  }

  for (let i = 0; i < syls.length; i++) {
    const curr = syls[i];
    if (curr.raw) {
      res += curr.raw;
      continue;
    }

    const next = syls[i + 1];
    let choStr = CHO_MAP[curr.cho] || '';
    let jungStr = JUNG_MAP[curr.jung] || '';
    let jongStr = '';

    if (curr.jong) {
      if (next && next.cho === 'ㅇ') {
        // Liaison before initial vowel
        switch (curr.jong) {
          case 'ㄱ':
          case 'ㄲ':
            next.choStr = 'g';
            jongStr = '';
            break;
          case 'ㄴ':
            next.choStr = 'n';
            jongStr = '';
            break;
          case 'ㄷ':
            next.choStr = 'd';
            jongStr = '';
            break;
          case 'ㄹ':
            next.choStr = 'r';
            jongStr = '';
            break;
          case 'ㅁ':
            next.choStr = 'm';
            jongStr = '';
            break;
          case 'ㅂ':
            next.choStr = 'b';
            jongStr = '';
            break;
          case 'ㅅ':
            next.choStr = 's';
            jongStr = '';
            break;
          case 'ㅆ':
            next.choStr = 'ss';
            jongStr = '';
            break;
          case 'ㅈ':
            next.choStr = 'j';
            jongStr = '';
            break;
          case 'ㅊ':
            next.choStr = 'ch';
            jongStr = '';
            break;
          case 'ㅌ':
            next.choStr = 't';
            jongStr = '';
            break;
          case 'ㅍ':
            next.choStr = 'p';
            jongStr = '';
            break;
          case 'ㄳ':
            jongStr = 'k';
            next.choStr = 's';
            break;
          case 'ㄵ':
            jongStr = 'n';
            next.choStr = 'j';
            break;
          case 'ㄶ':
            jongStr = 'n';
            next.choStr = '';
            break;
          case 'ㄺ':
            jongStr = 'r';
            next.choStr = 'g';
            break;
          case 'ㄻ':
            jongStr = 'r';
            next.choStr = 'm';
            break;
          case 'ㄼ':
            jongStr = 'r';
            next.choStr = 'b';
            break;
          case 'ㄾ':
            jongStr = 'r';
            next.choStr = 't';
            break;
          case 'ㄿ':
            jongStr = 'r';
            next.choStr = 'p';
            break;
          case 'ㅀ':
            jongStr = 'r';
            next.choStr = '';
            break;
          case 'ㅄ':
            jongStr = 'p';
            next.choStr = 's';
            break;
          case 'ㅇ':
            jongStr = 'ng';
            break;
        }
      } else if (
        next &&
        ((curr.jong === 'ㄴ' && next.cho === 'ㄹ') ||
          (curr.jong === 'ㄹ' && next.cho === 'ㄴ') ||
          (curr.jong === 'ㄹ' && next.cho === 'ㄹ'))
      ) {
        // Liquidization (ㄴ+ㄹ, ㄹ+ㄴ, ㄹ+ㄹ -> ll)
        jongStr = 'l';
        next.choStr = 'l';
      } else if (next && (next.cho === 'ㄴ' || next.cho === 'ㅁ')) {
        // Nasalization before ㄴ/ㅁ
        if (['ㄱ', 'ㄲ', 'ㅋ', 'ㄺ'].includes(curr.jong)) jongStr = 'ng';
        else if (['ㄷ', 'ㅅ', 'ㅆ', 'ㅈ', 'ㅊ', 'ㅌ', 'ㅎ'].includes(curr.jong)) jongStr = 'n';
        else if (['ㅂ', 'ㅍ', 'ㄼ', 'ㄿ', 'ㅄ'].includes(curr.jong)) jongStr = 'm';
        else if (curr.jong === 'ㄴ') jongStr = 'n';
        else if (curr.jong === 'ㄹ') jongStr = 'l';
        else if (curr.jong === 'ㅁ') jongStr = 'm';
        else if (curr.jong === 'ㅇ') jongStr = 'ng';
      } else if (next && next.cho === 'ㄹ') {
        jongStr = getNormalJongStr(curr.jong);
      } else {
        jongStr = getNormalJongStr(curr.jong);
      }
    }

    if (curr.choStr !== undefined) choStr = curr.choStr;

    res += choStr + jungStr + jongStr;
  }

  return res;
}

/**
 * Computes standard Revised Romanization for any Korean text target.
 */
export function romanize(text: string): string {
  return text.split(' ').map(romanizeWord).join(' ');
}

/**
 * Retrieves the pronunciation display text for a lesson item.
 * Uses item.pronunciation if explicitly defined; otherwise dynamically computes Romanization.
 */
export function getPronunciation(item: LessonItem): string {
  if (item.pronunciation && item.pronunciation.trim() !== '') {
    return item.pronunciation;
  }
  return romanize(item.target);
}
