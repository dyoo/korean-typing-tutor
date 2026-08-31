import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount, unmount } from 'svelte';
import InputDisplay from './InputDisplay.svelte';
import { settingsStore } from './settings.svelte';

describe('InputDisplay component', () => {
  let target: HTMLDivElement;
  let component: Record<string, unknown> | null = null;

  beforeEach(() => {
    target = document.createElement('div');
    document.body.appendChild(target);
    settingsStore.reset();
  });

  afterEach(() => {
    if (component) {
      unmount(component);
      component = null;
    }
    target.remove();
  });

  it('should render "Start typing..." placeholder when input is empty and modules are enabled', () => {
    component = mount(InputDisplay, {
      target,
      props: {
        userInput: '',
        errorMap: new Map<number, boolean>(),
        activeInputCursorIndex: 0,
        isCompleted: false,
        hasEnabledModules: true,
        onkeydown: vi.fn(),
        oninputprevent: vi.fn(),
        onsetcursorposition: vi.fn(),
      },
    });

    expect(target.textContent).toContain('Start typing...');
    const hiddenInput = target.querySelector('input');
    expect(hiddenInput).not.toBeNull();
    expect(hiddenInput?.value).toBe('');
  });

  it('should render "Select a module above to begin..." placeholder when no modules are enabled', () => {
    component = mount(InputDisplay, {
      target,
      props: {
        userInput: '',
        errorMap: new Map<number, boolean>(),
        activeInputCursorIndex: 0,
        isCompleted: false,
        hasEnabledModules: false,
        onkeydown: vi.fn(),
        oninputprevent: vi.fn(),
        onsetcursorposition: vi.fn(),
      },
    });

    expect(target.textContent).toContain('Select a module above to begin...');
  });

  it('should render "Press Enter or Space for next word" placeholder when completed with empty input', () => {
    component = mount(InputDisplay, {
      target,
      props: {
        userInput: '',
        errorMap: new Map<number, boolean>(),
        activeInputCursorIndex: 0,
        isCompleted: true,
        hasEnabledModules: true,
        onkeydown: vi.fn(),
        oninputprevent: vi.fn(),
        onsetcursorposition: vi.fn(),
      },
    });

    expect(target.textContent).toContain('Press Enter or Space for next word');
  });

  it('should render typed Hangul characters and hidden input value accurately', () => {
    component = mount(InputDisplay, {
      target,
      props: {
        userInput: '사과',
        errorMap: new Map<number, boolean>(),
        activeInputCursorIndex: 2,
        isCompleted: false,
        hasEnabledModules: true,
        onkeydown: vi.fn(),
        oninputprevent: vi.fn(),
        onsetcursorposition: vi.fn(),
      },
    });

    const display = target.querySelector('.input-display');
    expect(display).not.toBeNull();
    expect(display?.textContent).toContain('사');
    expect(display?.textContent).toContain('과');

    const chars = target.querySelectorAll('[data-char]');
    expect(chars.length).toBe(2);
    expect(chars[0].getAttribute('data-char')).toBe('사');
    expect(chars[1].getAttribute('data-char')).toBe('과');

    const hiddenInput = target.querySelector('input');
    expect(hiddenInput?.value).toBe('사과');
  });

  it('should apply error styling to characters matching errorMap', () => {
    const errorMap = new Map<number, boolean>([
      [0, true],
      [1, false],
    ]);

    component = mount(InputDisplay, {
      target,
      props: {
        userInput: '사과',
        errorMap,
        activeInputCursorIndex: 2,
        isCompleted: false,
        hasEnabledModules: true,
        onkeydown: vi.fn(),
        oninputprevent: vi.fn(),
        onsetcursorposition: vi.fn(),
      },
    });

    const charElements = target.querySelectorAll('[data-char] > span');
    expect(charElements[0].className).toContain('text-red-500');
    expect(charElements[1].className).toContain('text-blue-600');
  });

  it('should render the caret beam on the active character', () => {
    component = mount(InputDisplay, {
      target,
      props: {
        userInput: '가',
        errorMap: new Map<number, boolean>(),
        activeInputCursorIndex: 1, // at the end of '가'
        isCompleted: false,
        hasEnabledModules: true,
        onkeydown: vi.fn(),
        oninputprevent: vi.fn(),
        onsetcursorposition: vi.fn(),
      },
    });

    const caretBeam = target.querySelector('.bg-amber-500');
    expect(caretBeam).not.toBeNull();
    expect(caretBeam?.className).toContain('-right-0.5');
  });

  it('should render the sky-themed caret beam on the active character', () => {
    settingsStore.update('cursorColor', 'sky');

    component = mount(InputDisplay, {
      target,
      props: {
        userInput: '가',
        errorMap: new Map<number, boolean>(),
        activeInputCursorIndex: 1, // at the end of '가'
        isCompleted: false,
        hasEnabledModules: true,
        onkeydown: vi.fn(),
        oninputprevent: vi.fn(),
        onsetcursorposition: vi.fn(),
      },
    });

    const caretBeam = target.querySelector('.bg-sky-400');
    expect(caretBeam).not.toBeNull();
    expect(caretBeam?.className).toContain('-right-0.5');
  });

  it('should dispatch keyboard and input events to provided handlers', () => {
    const onkeydown = vi.fn();
    const onkeyup = vi.fn();
    const oninputprevent = vi.fn();

    component = mount(InputDisplay, {
      target,
      props: {
        userInput: '가',
        errorMap: new Map<number, boolean>(),
        activeInputCursorIndex: 1,
        isCompleted: false,
        hasEnabledModules: true,
        onkeydown,
        onkeyup,
        oninputprevent,
        onsetcursorposition: vi.fn(),
      },
    });

    const hiddenInput = target.querySelector('input');
    expect(hiddenInput).not.toBeNull();

    hiddenInput?.dispatchEvent(new KeyboardEvent('keydown', { key: 'r', bubbles: true }));
    expect(onkeydown).toHaveBeenCalledTimes(1);

    hiddenInput?.dispatchEvent(new KeyboardEvent('keyup', { key: 'r', bubbles: true }));
    expect(onkeyup).toHaveBeenCalledTimes(1);

    hiddenInput?.dispatchEvent(new Event('input', { bubbles: true }));
    expect(oninputprevent).toHaveBeenCalledTimes(1);
  });

  it('should invoke onsetcursorposition when clicking a character element', () => {
    const onsetcursorposition = vi.fn();

    component = mount(InputDisplay, {
      target,
      props: {
        userInput: '한국어',
        errorMap: new Map<number, boolean>(),
        activeInputCursorIndex: 3,
        isCompleted: false,
        hasEnabledModules: true,
        onkeydown: vi.fn(),
        oninputprevent: vi.fn(),
        onsetcursorposition,
      },
    });

    const charElements = target.querySelectorAll('[data-char]');
    expect(charElements.length).toBe(3);

    // Clicking the first character ('한' at index 0) selects cursor position 1 (after index 0)
    (charElements[0] as HTMLElement).click();
    expect(onsetcursorposition).toHaveBeenCalledWith(1);

    // Clicking the second character ('국' at index 1) selects cursor position 2
    (charElements[1] as HTMLElement).click();
    expect(onsetcursorposition).toHaveBeenCalledWith(2);
  });
});
