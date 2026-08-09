import { describe, it, expect, beforeEach } from 'vitest';
import { HangulEngine, checkErrors } from './koreanEngine';

describe('checkErrors function', () => {
  it('should return no errors for exact match', () => {
    const target = 'hello';
    const input = 'hello';
    const errors = checkErrors(target, input);
    expect(errors.length).toBe(5);
    expect(errors.every(e => !e.isError)).toBe(true);
  });

  it('should identify mismatches', () => {
    const target = 'hello';
    const input = 'helo';
    const errors = checkErrors(target, input);
    // errors[0]: h-h (ok)
    // errors[1]: e-e (ok)
    // errors[2]: l-l (ok)
    // errors[3]: l-o (ERROR)
    expect(errors[3].isError).toBe(true);
  });

  it('should handle different lengths', () => {
    const target = 'abc';
    const input = 'abcd';
    const errors = checkErrors(target, input);
    expect(errors.length).toBe(4);
    expect(errors[3].isError).toBe(true);
  });
});

describe('HangulEngine class', () => {
  let engine: HangulEngine;

  beforeEach(() => {
    engine = new HangulEngine();
  });

  it('should accumulate characters via handleKey', () => {
    engine.handleKey('a');
    engine.handleKey('b');
    expect(engine.getComposedText()).toBe('ab');
  });

  it('should identify errors within the engine', () => {
    const target = 'abc';
    const input = 'abd';
    const errors = engine.checkErrors(target, input);
    expect(errors[2].isError).toBe(true);
  });
});
