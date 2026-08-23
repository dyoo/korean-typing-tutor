import { describe, it, expect } from 'vitest';
import {
  calculateTargetCursorIndex,
  calculateInputCursorIndex,
  getWordTokens,
  getInputCaretStatus,
} from './cursorHelper';

describe('Cursor index calculation helpers (cursorHelper)', () => {
  it('should calculate active target cursor index correctly', () => {
    // Initial state: target cursor on 1st character (0)
    expect(calculateTargetCursorIndex('가나다', '', false)).toBe(0);

    // In-progress jamo for 1st char: target cursor stays on 1st character (0)
    expect(calculateTargetCursorIndex('가나다', 'ㄱ', false)).toBe(0);

    // 1st char complete: target cursor moves to 2nd character (1)
    expect(calculateTargetCursorIndex('가나다', '가', false)).toBe(1);

    // In-progress 2nd char: target cursor stays on 2nd character (1)
    expect(calculateTargetCursorIndex('가나다', '가ㄴ', false)).toBe(1);

    // Clamps to last target character index when typing at end of target text
    expect(calculateTargetCursorIndex('가', '나', false)).toBe(0);

    // Returns -1 when item is completed
    expect(calculateTargetCursorIndex('가나다', '가나다', true)).toBe(-1);
  });

  it('should calculate active target cursor index correctly when inputCursorIndex is provided', () => {
    const target = '글로벌';

    // Before typing: cursor is at index 0 ('글')
    expect(calculateTargetCursorIndex(target, '', false, 0)).toBe(0);

    // First Jamo 'ㄱ' typed: cursor must STAY at index 0 ('글')
    expect(calculateTargetCursorIndex(target, 'ㄱ', false, 1)).toBe(0);

    // Partial syllable '그' composed: cursor must STAY at index 0 ('글')
    expect(calculateTargetCursorIndex(target, '그', false, 1)).toBe(0);

    // Syllable 1 '글' completed: cursor moves to index 1 ('로')
    expect(calculateTargetCursorIndex(target, '글', false, 1)).toBe(1);

    // In-progress Jamo for 2nd syllable 'ㄹ': cursor stays at index 1 ('로')
    expect(calculateTargetCursorIndex(target, '글ㄹ', false, 2)).toBe(1);

    // Syllable 2 '로' completed: cursor moves to index 2 ('벌')
    expect(calculateTargetCursorIndex(target, '글로', false, 2)).toBe(2);

    // In-progress Jamo for 3rd syllable 'ㅂ': cursor stays at index 2 ('벌')
    expect(calculateTargetCursorIndex(target, '글로ㅂ', false, 3)).toBe(2);

    // Completed: cursor returns -1
    expect(calculateTargetCursorIndex(target, '글로벌', true, 3)).toBe(-1);

    // Mid-text navigation via Arrow keys:
    // Caret at index 0 (before '글') -> highlights '글' (0)
    expect(calculateTargetCursorIndex(target, '글로벌', false, 0)).toBe(0);
    // Caret at index 1 (after '글') -> highlights '로' (1)
    expect(calculateTargetCursorIndex(target, '글로벌', false, 1)).toBe(1);
    // Caret at index 2 (after '로') -> highlights '벌' (2)
    expect(calculateTargetCursorIndex(target, '글로벌', false, 2)).toBe(2);
  });

  it('should calculate active input cursor index correctly', () => {
    // Initial state: input cursor at position 0
    expect(calculateInputCursorIndex('', '가나다', false)).toBe(0);

    // In-progress jamo: input cursor stays under 1st typed char (0)
    expect(calculateInputCursorIndex('ㄱ', '가나다', false)).toBe(0);

    // 1st char complete: input cursor moves to new position after 1st char (1)
    expect(calculateInputCursorIndex('가', '가나다', false)).toBe(1);

    // In-progress 2nd char: input cursor is under 2nd char (1)
    expect(calculateInputCursorIndex('가ㄴ', '가나다', false)).toBe(1);

    // Positions cursor at the end of input when item is completed
    expect(calculateInputCursorIndex('가나다', '가나다', true)).toBe(3);
  });
});

describe('getWordTokens helper', () => {
  it('should group target sentence into words and trailing punctuation tokens', () => {
    const text = '안녕하세요. 반갑습니다!';
    const tokens = getWordTokens(text);
    expect(tokens.length).toBe(3);

    expect(tokens[0].type).toBe('word');
    expect(tokens[0].indices).toEqual([0, 1, 2, 3, 4, 5]);
    expect(tokens[0].indices.map((i) => text[i]).join('')).toBe('안녕하세요.');

    expect(tokens[1].type).toBe('space');
    expect(tokens[1].indices).toEqual([6]);
    expect(tokens[1].indices.map((i) => text[i]).join('')).toBe(' ');

    expect(tokens[2].type).toBe('word');
    expect(tokens[2].indices).toEqual([7, 8, 9, 10, 11, 12]);
    expect(tokens[2].indices.map((i) => text[i]).join('')).toBe('반갑습니다!');
  });
});

describe('getInputCaretStatus helper', () => {
  it('assigns the caret to the leading edge of the first character when cursor is at 0', () => {
    // String "안녕" (length 2), active cursor at 0
    const char0 = getInputCaretStatus(0, 0, 2);
    expect(char0).toEqual({ hasCaret: true, isLeading: true });

    const char1 = getInputCaretStatus(1, 0, 2);
    expect(char1).toEqual({ hasCaret: false, isLeading: false });
  });

  it('assigns the caret to the leading edge of the character after the cursor when between characters', () => {
    // String "안녕" (length 2), active cursor at 1 (between '안' and '녕')
    // Trailing char ('안', index 0) must NOT draw a beam to prevent double-width tiling (issue #14)
    const char0 = getInputCaretStatus(0, 1, 2);
    expect(char0).toEqual({ hasCaret: false, isLeading: false });

    // Leading char ('녕', index 1) owns the beam on its leading (left) edge
    const char1 = getInputCaretStatus(1, 1, 2);
    expect(char1).toEqual({ hasCaret: true, isLeading: true });
  });

  it('assigns the caret to the trailing edge of the last character when cursor is at the end of input', () => {
    // String "안녕" (length 2), active cursor at 2 (after '녕')
    const char0 = getInputCaretStatus(0, 2, 2);
    expect(char0).toEqual({ hasCaret: false, isLeading: false });

    // Trailing char ('녕', index 1) owns the beam on its trailing (right) edge
    const char1 = getInputCaretStatus(1, 2, 2);
    expect(char1).toEqual({ hasCaret: true, isLeading: false });
  });

  it('ensures exactly one character owns the caret across all valid cursor positions', () => {
    const textLength = 5;
    for (let cursorIndex = 0; cursorIndex <= textLength; cursorIndex++) {
      let caretCount = 0;
      for (let charIndex = 0; charIndex < textLength; charIndex++) {
        const status = getInputCaretStatus(charIndex, cursorIndex, textLength);
        if (status.hasCaret) {
          caretCount++;
        }
      }
      expect(caretCount).toBe(1);
    }
  });
});

