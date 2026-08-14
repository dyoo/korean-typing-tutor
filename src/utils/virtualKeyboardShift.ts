/** Utility for virtual keyboard shift state management. */

/**
 * Determine if the given shift side is a target key from activeKeys.
 * Handles both explicit side targets ('left-shift', 'right-shift') and generic 'shift'.
 * Generic 'shift' maps to a side only when the opposite side is NOT explicitly present.
 */
export function isShiftTarget(activeKeys: string[], side: 'left' | 'right'): boolean {
  const explicit = side === 'left' ? 'left-shift' : 'right-shift';
  if (activeKeys.includes(explicit)) {
    return true;
  }
  // Generic 'shift' maps to this side only when the opposite side is absent
  if (activeKeys.includes('shift')) {
    const other = side === 'left' ? 'right-shift' : 'left-shift';
    return !activeKeys.includes(other);
  }
  return false;
}

/**
 * Compute the actual output key when a key is clicked on the virtual keyboard.
 * Only uppercases single-char keys when shift is physically pressed (not from target highlighting).
 */
export function resolveKeyOutput(key: string, isShiftPressed: boolean): string {
  if (key.length === 1 && isShiftPressed) {
    return key.toUpperCase();
  }
  return key;
}

/**
 * Compute combined shift state for display purposes.
 * Includes both actual shift presses and target highlighting, so keys can show shifted jamo.
 */
export function isShiftActiveForDisplay(
  isShiftPressed: boolean,
  isLeftShiftTarget: boolean,
  isRightShiftTarget: boolean,
): boolean {
  return isShiftPressed || isLeftShiftTarget || isRightShiftTarget;
}
