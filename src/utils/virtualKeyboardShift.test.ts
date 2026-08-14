import { describe, it, expect } from 'vitest';
import { isShiftTarget, resolveKeyOutput, isShiftActiveForDisplay } from './virtualKeyboardShift';

describe('isShiftTarget', () => {
  it('returns true when explicit left-shift is in activeKeys', () => {
    expect(isShiftTarget(['left-shift'], 'left')).toBe(true);
  });

  it('returns true when explicit right-shift is in activeKeys', () => {
    expect(isShiftTarget(['right-shift'], 'right')).toBe(true);
  });

  it('returns false when opposite explicit shift is present', () => {
    expect(isShiftTarget(['right-shift'], 'left')).toBe(false);
    expect(isShiftTarget(['left-shift'], 'right')).toBe(false);
  });

  it('maps generic "shift" to left when right-shift is absent', () => {
    expect(isShiftTarget(['shift'], 'left')).toBe(true);
  });

  it('maps generic "shift" to right when left-shift is absent', () => {
    expect(isShiftTarget(['shift'], 'right')).toBe(true);
  });

  it('resolves generic "shift" to left when right-shift is explicitly present', () => {
    expect(isShiftTarget(['shift', 'right-shift'], 'left')).toBe(false);
    expect(isShiftTarget(['shift', 'right-shift'], 'right')).toBe(true);
  });

  it('resolves generic "shift" to right when left-shift is explicitly present', () => {
    expect(isShiftTarget(['shift', 'left-shift'], 'right')).toBe(false);
    expect(isShiftTarget(['shift', 'left-shift'], 'left')).toBe(true);
  });

  it('returns false when shift is not in activeKeys', () => {
    expect(isShiftTarget(['q', 'w'], 'left')).toBe(false);
    expect(isShiftTarget(['o', 'p'], 'right')).toBe(false);
    expect(isShiftTarget([], 'left')).toBe(false);
  });
});

describe('resolveKeyOutput', () => {
  it('uppercases single-char keys when shift is pressed', () => {
    expect(resolveKeyOutput('q', true)).toBe('Q');
    expect(resolveKeyOutput('p', true)).toBe('P');
    expect(resolveKeyOutput('a', true)).toBe('A');
  });

  it('leaves single-char keys lowercase when shift is not pressed', () => {
    expect(resolveKeyOutput('q', false)).toBe('q');
    expect(resolveKeyOutput('p', false)).toBe('p');
  });

  it('passes through multi-char keys unchanged regardless of shift', () => {
    expect(resolveKeyOutput('Backspace', true)).toBe('Backspace');
    expect(resolveKeyOutput('Shift', true)).toBe('Shift');
    expect(resolveKeyOutput('Backspace', false)).toBe('Backspace');
  });

  it('does NOT auto-shift when target highlighting is the only shift indicator', () => {
    // This is the critical bug fix: isShiftPressed is false even if target requires shift
    expect(resolveKeyOutput('q', false)).toBe('q');
    expect(resolveKeyOutput('o', false)).toBe('o');
  });
});

describe('isShiftActiveForDisplay', () => {
  it('returns true when shift is physically pressed', () => {
    expect(isShiftActiveForDisplay(true, false, false)).toBe(true);
  });

  it('returns true when left shift is a target (for display highlighting)', () => {
    expect(isShiftActiveForDisplay(false, true, false)).toBe(true);
  });

  it('returns true when right shift is a target (for display highlighting)', () => {
    expect(isShiftActiveForDisplay(false, false, true)).toBe(true);
  });

  it('returns false when neither pressed nor targeted', () => {
    expect(isShiftActiveForDisplay(false, false, false)).toBe(false);
  });

  it('returns true when any combination of pressed or targeted is true', () => {
    expect(isShiftActiveForDisplay(true, true, false)).toBe(true);
    expect(isShiftActiveForDisplay(true, false, true)).toBe(true);
    expect(isShiftActiveForDisplay(true, true, true)).toBe(true);
  });
});

describe('integration: virtual keyboard click flow', () => {
  it('does NOT auto-shift when target requires shift but user has not pressed shift', () => {
    // Simulate: target is ㅃ (shift+Q), so activeKeys = ['left-shift']
    const activeKeys = ['left-shift'];
    const isLeftShiftTarget = isShiftTarget(activeKeys, 'left');
    const isRightShiftTarget = isShiftTarget(activeKeys, 'right');
    const isShiftPressed = false; // user hasn't pressed shift

    // Display should show shifted jamo (isShiftActiveForDisplay is true)
    expect(isShiftActiveForDisplay(isShiftPressed, isLeftShiftTarget, isRightShiftTarget)).toBe(true);

    // But clicking 'q' should output 'q', not 'Q'
    expect(resolveKeyOutput('q', isShiftPressed)).toBe('q');
    expect(resolveKeyOutput('o', isShiftPressed)).toBe('o');
  });

  it('outputs shifted key when user presses shift', () => {
    // Simulate: user has pressed left shift on physical keyboard
    const isShiftPressed = true;
    expect(resolveKeyOutput('q', isShiftPressed)).toBe('Q');
    expect(resolveKeyOutput('o', isShiftPressed)).toBe('O');
  });

  it('outputs lowercase when neither pressed nor targeted', () => {
    const isShiftPressed = false;
    expect(resolveKeyOutput('q', isShiftPressed)).toBe('q');
    expect(resolveKeyOutput('p', isShiftPressed)).toBe('p');
  });
});
