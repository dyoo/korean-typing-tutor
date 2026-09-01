import { describe, it, expect, vi } from 'vitest';
import { KeyboardManager } from './keyboardManager.svelte';

describe('KeyboardManager', () => {
  it('initializes with shift states set to false', () => {
    const manager = new KeyboardManager();
    expect(manager.isLeftShiftPressed).toBe(false);
    expect(manager.isRightShiftPressed).toBe(false);
  });

  describe('Shift key handling', () => {
    it('tracks ShiftLeft keydown and keyup', () => {
      const manager = new KeyboardManager();

      const shiftLeftDown = new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft' });
      manager.handleKeydown(shiftLeftDown);
      expect(manager.isLeftShiftPressed).toBe(true);
      expect(manager.isRightShiftPressed).toBe(false);

      const shiftLeftUp = new KeyboardEvent('keyup', { key: 'Shift', code: 'ShiftLeft' });
      manager.handleKeyup(shiftLeftUp);
      expect(manager.isLeftShiftPressed).toBe(false);
      expect(manager.isRightShiftPressed).toBe(false);
    });

    it('tracks ShiftRight keydown and keyup', () => {
      const manager = new KeyboardManager();

      const shiftRightDown = new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftRight' });
      manager.handleKeydown(shiftRightDown);
      expect(manager.isLeftShiftPressed).toBe(false);
      expect(manager.isRightShiftPressed).toBe(true);

      const shiftRightUp = new KeyboardEvent('keyup', { key: 'Shift', code: 'ShiftRight' });
      manager.handleKeyup(shiftRightUp);
      expect(manager.isLeftShiftPressed).toBe(false);
      expect(manager.isRightShiftPressed).toBe(false);
    });

    it('defaults unspecified Shift code to left shift', () => {
      const manager = new KeyboardManager();

      const shiftDown = new KeyboardEvent('keydown', { key: 'Shift' });
      manager.handleKeydown(shiftDown);
      expect(manager.isLeftShiftPressed).toBe(true);

      const shiftUp = new KeyboardEvent('keyup', { key: 'Shift' });
      manager.handleKeyup(shiftUp);
      expect(manager.isLeftShiftPressed).toBe(false);
      expect(manager.isRightShiftPressed).toBe(false);
    });

    it('resets shift states on window blur', () => {
      const manager = new KeyboardManager();
      manager.handleKeydown(new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft' }));
      expect(manager.isLeftShiftPressed).toBe(true);

      manager.handleBlur();
      expect(manager.isLeftShiftPressed).toBe(false);
      expect(manager.isRightShiftPressed).toBe(false);
    });
  });

  describe('Keystroke dispatching', () => {
    it('dispatches single character keys and calls preventDefault', () => {
      const onKey = vi.fn();
      const manager = new KeyboardManager({ onKey });

      const event = new KeyboardEvent('keydown', { key: 'g', cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

      manager.handleKeydown(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
      expect(onKey).toHaveBeenCalledWith('g');
    });

    it('dispatches navigation keys and calls preventDefault', () => {
      const onKey = vi.fn();
      const manager = new KeyboardManager({ onKey });

      const navKeys = [
        'Backspace',
        'Delete',
        'Enter',
        'ArrowLeft',
        'ArrowRight',
        'Home',
        'End',
      ];

      for (const key of navKeys) {
        const event = new KeyboardEvent('keydown', { key, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

        manager.handleKeydown(event);

        expect(preventDefaultSpy).toHaveBeenCalled();
        expect(onKey).toHaveBeenCalledWith(key);
      }
    });

    it('ignores modifier keys like Tab, Escape, Alt, Ctrl, Meta', () => {
      const onKey = vi.fn();
      const manager = new KeyboardManager({ onKey });

      for (const key of ['Tab', 'Escape', 'Alt', 'Control', 'Meta']) {
        const event = new KeyboardEvent('keydown', { key, cancelable: true });
        const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

        manager.handleKeydown(event);

        expect(preventDefaultSpy).not.toHaveBeenCalled();
        expect(onKey).not.toHaveBeenCalled();
      }
    });

    it('ignores key events with Ctrl/Alt/Meta pressed (except shortcuts)', () => {
      const onKey = vi.fn();
      const manager = new KeyboardManager({ onKey });

      manager.handleKeydown(new KeyboardEvent('keydown', { key: 'r', ctrlKey: true }));
      manager.handleKeydown(new KeyboardEvent('keydown', { key: 'r', altKey: true }));
      manager.handleKeydown(new KeyboardEvent('keydown', { key: 'r', metaKey: true }));

      expect(onKey).not.toHaveBeenCalled();
    });
  });

  describe('Audio Shortcut', () => {
    it('dispatches onSpeakShortcut and prevents default on Ctrl+S or Cmd+S', () => {
      const onSpeakShortcut = vi.fn();
      const manager = new KeyboardManager({ onSpeakShortcut });

      const ctrlS = new KeyboardEvent('keydown', { key: 's', ctrlKey: true, cancelable: true });
      const ctrlSSpy = vi.spyOn(ctrlS, 'preventDefault');
      manager.handleKeydown(ctrlS);

      expect(ctrlSSpy).toHaveBeenCalled();
      expect(onSpeakShortcut).toHaveBeenCalledTimes(1);

      const cmdS = new KeyboardEvent('keydown', { key: 'S', metaKey: true, cancelable: true });
      const cmdSSpy = vi.spyOn(cmdS, 'preventDefault');
      manager.handleKeydown(cmdS);

      expect(cmdSSpy).toHaveBeenCalled();
      expect(onSpeakShortcut).toHaveBeenCalledTimes(2);
    });
  });

  describe('Disabled predicate', () => {
    it('suppresses keydown events when disabled returns true', () => {
      let isDisabled = true;
      const onKey = vi.fn();
      const onSpeakShortcut = vi.fn();

      const manager = new KeyboardManager({
        disabled: () => isDisabled,
        onKey,
        onSpeakShortcut,
      });

      manager.handleKeydown(new KeyboardEvent('keydown', { key: 'a' }));
      manager.handleKeydown(new KeyboardEvent('keydown', { key: 'Shift', code: 'ShiftLeft' }));
      manager.handleKeydown(new KeyboardEvent('keydown', { key: 's', ctrlKey: true }));

      expect(onKey).not.toHaveBeenCalled();
      expect(onSpeakShortcut).not.toHaveBeenCalled();
      expect(manager.isLeftShiftPressed).toBe(false);

      isDisabled = false;
      manager.handleKeydown(new KeyboardEvent('keydown', { key: 'a' }));
      expect(onKey).toHaveBeenCalledWith('a');
    });
  });
});
