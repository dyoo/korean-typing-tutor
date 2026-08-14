import { isSyllableComplete } from './hangulMatch';

/**
 * Calculates the active target character index for cursor display on the main target text.
 * Determines the target character being actively composed based on the prefix of userInput up to inputCursorIndex.
 * Clamps result to target.length - 1 when not completed so the target cursor never disappears.
 */
export function calculateTargetCursorIndex(
  target: string,
  userInput: string,
  isCompleted: boolean,
  inputCursorIndex?: number,
): number {
  if (isCompleted || !target) {
    return -1;
  }
  const effectiveInput =
    typeof inputCursorIndex === 'number' && inputCursorIndex >= 0
      ? userInput.slice(0, inputCursorIndex)
      : userInput;

  if (effectiveInput.length === 0) {
    return 0;
  }
  const lastIndex = effectiveInput.length - 1;
  const isLastComplete = isSyllableComplete(
    target[lastIndex],
    effectiveInput[lastIndex],
    target[lastIndex + 1],
  );
  const rawIndex = isLastComplete ? effectiveInput.length : lastIndex;
  return Math.min(rawIndex, target.length - 1);
}

/**
 * Calculates the active input position index for cursor display on the user input display.
 * Returns -1 if completed, or an index from 0 to userInput.length.
 */
export function calculateInputCursorIndex(
  userInput: string,
  target: string,
  isCompleted: boolean,
  inputCursorIndex?: number,
): number {
  if (isCompleted) {
    return -1;
  }
  if (typeof inputCursorIndex === 'number' && inputCursorIndex >= 0) {
    return Math.min(inputCursorIndex, userInput.length);
  }
  if (userInput.length === 0) {
    return 0;
  }
  const lastIndex = userInput.length - 1;
  const isLastComplete = isSyllableComplete(
    target[lastIndex],
    userInput[lastIndex],
    target[lastIndex + 1],
  );
  return isLastComplete ? userInput.length : lastIndex;
}

export interface WordTokenGroup {
  type: 'word' | 'space';
  indices: number[];
}

/**
 * Groups character indices of a target string into word tokens and space tokens.
 * Ensures words and their trailing punctuation (e.g. "입니다.") remain bound together
 * inside single inline-flex containers to prevent lone punctuation line wrapping.
 */
export function getWordTokens(target: string): WordTokenGroup[] {
  const tokens: WordTokenGroup[] = [];
  let currentWordIndices: number[] = [];

  for (let i = 0; i < target.length; i++) {
    if (target[i] === ' ') {
      if (currentWordIndices.length > 0) {
        tokens.push({ type: 'word', indices: currentWordIndices });
        currentWordIndices = [];
      }
      tokens.push({ type: 'space', indices: [i] });
    } else {
      currentWordIndices.push(i);
    }
  }

  if (currentWordIndices.length > 0) {
    tokens.push({ type: 'word', indices: currentWordIndices });
  }

  return tokens;
}
