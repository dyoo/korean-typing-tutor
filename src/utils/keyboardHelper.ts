import { decomposeCharToJamos, isSyllableComplete } from './koreanEngine';
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
 * - target: '안녕하세요', input: '안' -> ['ㄴ'] for '녕' -> ['s']
 */
export function getNextRequiredKeys(
  target: string | undefined,
  input: string | undefined,
  isCompleted: boolean,
): string[] {
  if (isCompleted || !target) {
    return [];
  }

  const userInput = input ?? '';
  if (userInput.length === 0) {
    const firstChar = target[0];
    if (firstChar === ' ') return [' '];
    const jamos = decomposeCharToJamos(firstChar);
    if (!jamos || jamos.length === 0) return [];
    const firstJamo = jamos[0];
    return getKeyInfoResult(JAMO_TO_KEY[firstJamo]);
  }

  const lastInputIndex = userInput.length - 1;
  const isLastComplete = isSyllableComplete(
    target[lastInputIndex],
    userInput[lastInputIndex],
    target[lastInputIndex + 1],
  );

  const activeIndex = isLastComplete ? userInput.length : lastInputIndex;
  if (activeIndex >= target.length) {
    return [];
  }

  const activeTargetChar = target[activeIndex];
  if (activeTargetChar === ' ') {
    return [' '];
  }

  const activeInputChar = userInput[activeIndex];
  const targetJamos = decomposeCharToJamos(activeTargetChar);
  if (!targetJamos) {
    return [];
  }

  if (!activeInputChar) {
    const firstJamo = targetJamos[0];
    return getKeyInfoResult(JAMO_TO_KEY[firstJamo]);
  }

  const inputJamos = decomposeCharToJamos(activeInputChar);
  if (targetJamos.startsWith(inputJamos) && inputJamos.length < targetJamos.length) {
    const nextJamo = targetJamos[inputJamos.length];
    return getKeyInfoResult(JAMO_TO_KEY[nextJamo]);
  }

  // Fallback: If input doesn't match prefix, highlight the first Jamo of the active target character
  const firstJamo = targetJamos[0];
  return getKeyInfoResult(JAMO_TO_KEY[firstJamo]);
}
