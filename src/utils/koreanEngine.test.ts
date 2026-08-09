import { describe, it, expect } from 'vitest';
import { checkErrors } from './koreanEngine';

describe('koreanEngine - checkErrors', () => {
  it('should correctly identify errors in typing', () => {
    const target = 'apple';
    const input = 'applx';
    const errors = checkErrors(target, input);

    expect(errors).toHaveLength(5);
    expect(errors[0].isError).toBe(false);
    expect(errors[1].isError).toBe(false);
    expect(errors[2].isError).toBe(false);
    expect(errors[3].isError).toBe(false);
    expect(errors[4].isError).toBe(true);
  });

  it('should handle inputs shorter than the target', () => {
    const target = 'apple';
    const input = 'app';
    const errors = checkErrors(target, input);

    expect(errors).toHaveLength(3);
    expect(errors[0].isError).toBe(false);
    expect(errors[1].isError).toBe(false);
    expect(errors[2].isError).toBe(false);
  });
});
