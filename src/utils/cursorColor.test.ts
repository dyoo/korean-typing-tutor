import { describe, it, expect } from 'vitest';
import { getCursorColorClass } from './cursorColor';

describe('cursorColor utility', () => {
  it('returns amber background class by default or for amber mode', () => {
    expect(getCursorColorClass('amber')).toBe('bg-amber-500 dark:bg-amber-400');
    expect(getCursorColorClass(undefined as unknown as 'amber')).toBe(
      'bg-amber-500 dark:bg-amber-400',
    );
  });

  it('returns sky background class for sky mode', () => {
    expect(getCursorColorClass('sky')).toBe('bg-sky-400 dark:bg-sky-300');
  });

  it('returns emerald background class for emerald mode', () => {
    expect(getCursorColorClass('emerald')).toBe('bg-emerald-600 dark:bg-emerald-400');
  });

  it('returns blue background class for blue mode', () => {
    expect(getCursorColorClass('blue')).toBe('bg-blue-600 dark:bg-blue-500');
  });
});
