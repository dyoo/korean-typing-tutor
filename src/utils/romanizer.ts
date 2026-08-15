import type { LessonItem, SyllableDecomposition } from '../types/korean';
import { decomposeSyllable } from './hangulDecompose';

/** Revised Romanization map for initial consonants (Choseong). */
const INITIAL_CONSONANT_MAP: Record<string, string> = {
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
  ㅎ: 'h',
};

/** Revised Romanization map for vowels (Jungseong). */
const VOWEL_MAP: Record<string, string> = {
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
  ㅚ: 'oe',
  ㅛ: 'yo',
  ㅜ: 'u',
  ㅝ: 'wo',
  ㅞ: 'we',
  ㅟ: 'wi',
  ㅠ: 'yu',
  ㅡ: 'eu',
  ㅢ: 'ui',
  ㅣ: 'i',
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
  ㅚ: 'oe',
  ㅝ: 'wo',
  ㅞ: 'we',
  ㅟ: 'wi',
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
  ㅉ: 'jj',
};

/**
 * Converts a final consonant (Jongseong) to its default non-liaison Revised Romanization letter.
 */
function getNormalFinalConsonantStr(finalConsonant: string | null): string {
  if (!finalConsonant) {
    return '';
  }
  if (['ㄱ', 'ㄲ', 'ㅋ', 'ㄺ'].includes(finalConsonant)) {
    return 'k';
  }
  if (['ㄴ', 'ㄵ', 'ㄶ'].includes(finalConsonant)) {
    return 'n';
  }
  if (['ㄷ', 'ㅅ', 'ㅆ', 'ㅈ', 'ㅊ', 'ㅌ', 'ㅎ'].includes(finalConsonant)) {
    return 't';
  }
  if (['ㄹ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㅀ'].includes(finalConsonant)) {
    return 'l';
  }
  if (['ㅁ', 'ㄻ'].includes(finalConsonant)) {
    return 'm';
  }
  if (['ㅂ', 'ㅍ', 'ㄿ', 'ㅄ'].includes(finalConsonant)) {
    return 'p';
  }
  if (finalConsonant === 'ㅇ') {
    return 'ng';
  }
  return '';
}

/**
 * A syllable decomposition annotated with romanization overrides computed during word traversal.
 * `initialConsonantStr` holds a phonologically-adjusted romanized initial consonant (e.g. from
 * liaison or liquidization) that takes precedence over the base Choseong mapping.
 */
type RomanizedSyllable = SyllableDecomposition & { initialConsonantStr?: string };

/**
 * Romanizes a single continuous Korean word, taking into account phonological sound change rules
 * (liaison before vowels, nasalization before ㄴ/ㅁ, liquidization of ㄴ+ㄹ/ㄹ+ㄴ).
 */
function romanizeWord(word: string): string {
  if (word.length === 1 && SINGLE_JAMO_PRONUNCIATION[word]) {
    return SINGLE_JAMO_PRONUNCIATION[word];
  }

  let res = '';
  const syls: RomanizedSyllable[] = [];
  for (let i = 0; i < word.length; i++) {
    const d = decomposeSyllable(word[i]);
    if (d) {
      syls.push(d);
    } else {
      syls.push({ initialConsonant: '', vowel: '', finalConsonant: null, raw: word[i] });
    }
  }

  for (let i = 0; i < syls.length; i++) {
    const curr = syls[i];
    if (curr.raw) {
      res += curr.raw;
      continue;
    }

    const next = syls[i + 1];
    let initialConsonantStr = INITIAL_CONSONANT_MAP[curr.initialConsonant] || '';
    const vowelStr = VOWEL_MAP[curr.vowel] || '';
    let finalConsonantStr = '';

    if (curr.finalConsonant) {
      if (next && next.initialConsonant === 'ㅇ') {
        // Liaison before initial vowel
        switch (curr.finalConsonant) {
          case 'ㄱ':
          case 'ㄲ':
            next.initialConsonantStr = 'g';
            finalConsonantStr = '';
            break;
          case 'ㄴ':
            next.initialConsonantStr = 'n';
            finalConsonantStr = '';
            break;
          case 'ㄷ':
            next.initialConsonantStr = 'd';
            finalConsonantStr = '';
            break;
          case 'ㄹ':
            next.initialConsonantStr = 'r';
            finalConsonantStr = '';
            break;
          case 'ㅁ':
            next.initialConsonantStr = 'm';
            finalConsonantStr = '';
            break;
          case 'ㅂ':
            next.initialConsonantStr = 'b';
            finalConsonantStr = '';
            break;
          case 'ㅅ':
            next.initialConsonantStr = 's';
            finalConsonantStr = '';
            break;
          case 'ㅆ':
            next.initialConsonantStr = 'ss';
            finalConsonantStr = '';
            break;
          case 'ㅈ':
            next.initialConsonantStr = 'j';
            finalConsonantStr = '';
            break;
          case 'ㅊ':
            next.initialConsonantStr = 'ch';
            finalConsonantStr = '';
            break;
          case 'ㅌ':
            next.initialConsonantStr = 't';
            finalConsonantStr = '';
            break;
          case 'ㅍ':
            next.initialConsonantStr = 'p';
            finalConsonantStr = '';
            break;
          case 'ㄳ':
            finalConsonantStr = 'k';
            next.initialConsonantStr = 's';
            break;
          case 'ㄵ':
            finalConsonantStr = 'n';
            next.initialConsonantStr = 'j';
            break;
          case 'ㄶ':
            finalConsonantStr = 'n';
            next.initialConsonantStr = '';
            break;
          case 'ㄺ':
            finalConsonantStr = 'r';
            next.initialConsonantStr = 'g';
            break;
          case 'ㄻ':
            finalConsonantStr = 'r';
            next.initialConsonantStr = 'm';
            break;
          case 'ㄼ':
            finalConsonantStr = 'r';
            next.initialConsonantStr = 'b';
            break;
          case 'ㄾ':
            finalConsonantStr = 'r';
            next.initialConsonantStr = 't';
            break;
          case 'ㄿ':
            finalConsonantStr = 'r';
            next.initialConsonantStr = 'p';
            break;
          case 'ㅀ':
            finalConsonantStr = 'r';
            next.initialConsonantStr = '';
            break;
          case 'ㅄ':
            finalConsonantStr = 'p';
            next.initialConsonantStr = 's';
            break;
          case 'ㅇ':
            finalConsonantStr = 'ng';
            break;
        }
      } else if (
        next &&
        ((curr.finalConsonant === 'ㄴ' && next.initialConsonant === 'ㄹ') ||
          (curr.finalConsonant === 'ㄹ' && next.initialConsonant === 'ㄴ') ||
          (curr.finalConsonant === 'ㄹ' && next.initialConsonant === 'ㄹ'))
      ) {
        // Liquidization (ㄴ+ㄹ, ㄹ+ㄴ, ㄹ+ㄹ -> ll)
        finalConsonantStr = 'l';
        next.initialConsonantStr = 'l';
      } else if (next && (next.initialConsonant === 'ㄴ' || next.initialConsonant === 'ㅁ')) {
        // Nasalization before ㄴ/ㅁ
        if (['ㄱ', 'ㄲ', 'ㅋ', 'ㄺ'].includes(curr.finalConsonant)) {
          finalConsonantStr = 'ng';
        } else if (['ㄷ', 'ㅅ', 'ㅆ', 'ㅈ', 'ㅊ', 'ㅌ', 'ㅎ'].includes(curr.finalConsonant)) {
          finalConsonantStr = 'n';
        } else if (['ㅂ', 'ㅍ', 'ㄼ', 'ㄿ', 'ㅄ'].includes(curr.finalConsonant)) {
          finalConsonantStr = 'm';
        } else if (curr.finalConsonant === 'ㄴ') {
          finalConsonantStr = 'n';
        } else if (curr.finalConsonant === 'ㄹ') {
          finalConsonantStr = 'l';
        } else if (curr.finalConsonant === 'ㅁ') {
          finalConsonantStr = 'm';
        } else if (curr.finalConsonant === 'ㅇ') {
          finalConsonantStr = 'ng';
        }
      } else if (next && next.initialConsonant === 'ㄹ') {
        finalConsonantStr = getNormalFinalConsonantStr(curr.finalConsonant);
      } else {
        finalConsonantStr = getNormalFinalConsonantStr(curr.finalConsonant);
      }
    }

    if (curr.initialConsonantStr !== undefined) {
      initialConsonantStr = curr.initialConsonantStr;
    }

    res += initialConsonantStr + vowelStr + finalConsonantStr;
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
