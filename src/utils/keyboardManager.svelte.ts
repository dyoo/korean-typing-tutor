/**
 * @file keyboardManager.svelte.ts
 * @description Decoupled keyboard state manager and event handler.
 * Encapsulates Shift key modifier tracking and keystroke filtering/dispatching.
 */

export interface KeyboardManagerOptions {
  /**
   * Optional predicate function. When it returns true, typing keys and shortcuts are ignored.
   */
  disabled?: () => boolean;

  /**
   * Callback invoked when a valid typing or navigation keystroke occurs.
   *
   * @param key The event key string (e.g. 'a', 'Backspace', 'Enter', 'ArrowLeft').
   */
  onKey?: (key: string) => void;

  /**
   * Callback invoked when the audio prompt replay shortcut (Ctrl+S / Cmd+S) is pressed.
   */
  onSpeakShortcut?: () => void;
}

/**
 * Valid navigation and editing key identifiers that should be processed by the tutor.
 */
const NAVIGATION_KEYS = new Set([
  'Backspace',
  'Delete',
  'Enter',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
]);

/**
 * Manages reactive physical keyboard modifier states (Left Shift vs Right Shift)
 * and interprets raw browser KeyboardEvents for the typing tutor.
 */
export class KeyboardManager {
  isLeftShiftPressed = $state(false);
  isRightShiftPressed = $state(false);

  private options: KeyboardManagerOptions;

  constructor(options: KeyboardManagerOptions = {}) {
    this.options = options;
  }

  /**
   * Updates the options configuration if needed.
   */
  setOptions(options: KeyboardManagerOptions): void {
    this.options = options;
  }

  /**
   * Handles physical keydown events.
   * Tracks Shift key presses, handles audio shortcuts, filters out unhandled
   * modifier combinations, and dispatches typing keys to onKey.
   *
   * @param e The raw browser KeyboardEvent.
   */
  handleKeydown = (e: KeyboardEvent): void => {
    // If disabled via predicate, ignore all processing
    if (this.options.disabled?.()) {
      return;
    }

    // Track physical Shift modifier sides
    if (e.key === 'Shift') {
      if (e.code === 'ShiftLeft') {
        this.isLeftShiftPressed = true;
      } else if (e.code === 'ShiftRight') {
        this.isRightShiftPressed = true;
      } else {
        this.isLeftShiftPressed = true;
      }
      return;
    }

    // Audio shortcut: Ctrl+S (Windows/Linux) or Cmd+S (macOS)
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      this.options.onSpeakShortcut?.();
      return;
    }

    // Ignore browser system keys and modifier combinations
    if (e.key === 'Tab' || e.key === 'Escape' || e.altKey || e.ctrlKey || e.metaKey) {
      return;
    }

    // Check if the key is a valid single printable character or recognized navigation key
    if (NAVIGATION_KEYS.has(e.key) || e.key.length === 1) {
      e.preventDefault();
      this.options.onKey?.(e.key);
    }
  };

  /**
   * Handles physical keyup events to reset Shift modifier states.
   *
   * @param e The raw browser KeyboardEvent.
   */
  handleKeyup = (e: KeyboardEvent): void => {
    if (e.key === 'Shift') {
      if (e.code === 'ShiftLeft') {
        this.isLeftShiftPressed = false;
      } else if (e.code === 'ShiftRight') {
        this.isRightShiftPressed = false;
      } else {
        this.isLeftShiftPressed = false;
        this.isRightShiftPressed = false;
      }
    }
  };

  /**
   * Resets all modifier key states when the window loses focus.
   */
  handleBlur = (): void => {
    this.isLeftShiftPressed = false;
    this.isRightShiftPressed = false;
  };
}
