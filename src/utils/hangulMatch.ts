import type { ErrorReport } from '../types/korean';
import { decomposeCharToJamos, getInitialConsonantJamo } from './hangulDecompose';

/**
 * Checks if inputChar is an exact match or a valid partial composition prefix of targetChar.
 * Takes into account an optional nextTargetChar (e.g. the initial consonant of the next syllable)
 * to avoid flagging temporary trailing consonants created during Hangul IME composition as errors.
 */
export function isPartialOrExactMatch(
  targetChar: string | undefined,
  inputChar: string | undefined,
  nextTargetChar?: string,
): boolean {
  if (!inputChar || !targetChar) {
    return false;
  }
  if (targetChar === inputChar) {
    return true;
  }

  let targetJamos = decomposeCharToJamos(targetChar);

  if (nextTargetChar) {
    const nextInitialConsonant = getInitialConsonantJamo(nextTargetChar);
    if (nextInitialConsonant) {
      targetJamos += nextInitialConsonant;
    }
  }

  const inputJamos = decomposeCharToJamos(inputChar);

  return targetJamos.startsWith(inputJamos);
}

/**
 * Checks if inputChar fully completes targetChar.
 * Returns true if inputChar is an exact match for targetChar, OR if inputChar contains
 * the complete targetChar Jamo sequence plus the initial consonant (Choseong) of nextTargetChar.
 *
 * Example:
 * - isSyllableComplete('화', '화', '장') -> true (exact match)
 * - isSyllableComplete('화', compose('ghkw'), '장') -> true ('화' + '장''s Initial Consonant (Choseong) 'ㅈ')
 * - isSyllableComplete('화', compose('ghkd'), '장') -> false ('화' + 'ㅇ' trailing consonant)
 * - isSyllableComplete('장', '자', '실') -> false ('자' is incomplete for '장')
 */
export function isSyllableComplete(
  targetChar: string | undefined,
  inputChar: string | undefined,
  nextTargetChar?: string,
): boolean {
  if (!targetChar || !inputChar) {
    return false;
  }
  if (targetChar === inputChar) {
    return true;
  }

  const targetJamos = decomposeCharToJamos(targetChar);
  const inputJamos = decomposeCharToJamos(inputChar);

  if (inputJamos.startsWith(targetJamos)) {
    const remaining = inputJamos.slice(targetJamos.length);
    if (remaining.length > 0 && nextTargetChar) {
      const nextInitialConsonant = getInitialConsonantJamo(nextTargetChar);
      if (nextInitialConsonant === remaining) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Utility function to compute error reports for target text vs user input.
 * Compares target string vs user composed input and returns error flags per character position.
 * Utilizes isPartialOrExactMatch to ensure valid in-progress Hangul syllables are not marked as errors.
 */
export function checkErrors(target: string, input: string): ErrorReport[] {
  const errors: ErrorReport[] = [];
  const maxLength = Math.max(target.length, input.length);

  for (let i = 0; i < maxLength; i++) {
    const t = target[i];
    const inp = input[i];
    const nextT = target[i + 1];

    let isError = false;
    if (inp !== undefined) {
      if (t === undefined) {
        isError = true;
      } else if (i < input.length - 1) {
        isError = inp !== t;
      } else {
        isError = !isPartialOrExactMatch(t, inp, nextT);
      }
    }

    errors.push({
      index: i,
      isError,
    });
  }
  return errors;
}
