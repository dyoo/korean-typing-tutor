import { decomposeStringToJamos } from './hangulDecompose';
import { JAMO_TO_KEY } from './keyboardData';

function getKeyInfoResult(keyInfo?: {
  key: string;
  shift?: boolean;
  hand?: 'left' | 'right';
}): string[] {
  if (!keyInfo) return [];
  const lowerKey = keyInfo.key.toLowerCase();
  if (keyInfo.shift) {
    const shiftHand = keyInfo.hand === 'left' ? 'right-shift' : 'left-shift';
    return [shiftHand, lowerKey];
  }
  return [lowerKey];
}

/**
 * Determines the QWERTY key(s) required for the next Jamo in the active typing target.
 * Returns an array of lower-case key strings (e.g. ['k'], ['right-shift', 'r'], ['left-shift', 'p'], or [' ']) to highlight on the virtual keyboard.
 *
 * Examples:
 * - target: '가', input: ''     -> ['r'] (requires 'ㄱ')
 * - target: '까', input: ''     -> ['right-shift', 'r'] (requires Right-Shift + 'ㄱ' -> 'ㄲ')
 * - target: '예', input: 'ㅇ'    -> ['left-shift', 'p'] (requires Left-Shift + 'ㅔ' -> 'ㅖ')
 * - target: '가', input: 'ㄱ'    -> ['k'] (requires 'ㅏ')
 * - target: '화', input: '호'   -> ['k'] (requires 'ㅏ' for compound vowel ㅘ)
 * - target: '하나와', input: '한' -> ['k'] (requires 'ㅏ' for '나' since 'ㄴ' is already typed into '한')
 */
export function getNextRequiredKeys(
  target: string | undefined,
  input: string | undefined,
  isCompleted: boolean,
): string[] {
  if (isCompleted || !target) {
    return [];
  }

  const targetJamos = decomposeStringToJamos(target);
  const inputJamos = decomposeStringToJamos(input ?? '');

  let matchCount = 0;
  while (
    matchCount < inputJamos.length &&
    matchCount < targetJamos.length &&
    inputJamos[matchCount] === targetJamos[matchCount]
  ) {
    matchCount++;
  }

  if (matchCount >= targetJamos.length) {
    return [];
  }

  const nextJamo = targetJamos[matchCount];
  if (nextJamo === ' ') {
    return [' '];
  }

  return getKeyInfoResult(JAMO_TO_KEY[nextJamo]);
}
