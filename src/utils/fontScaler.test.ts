import { describe, it, expect } from 'vitest';
import {
  getTargetFontSizeClass,
  getTargetFontWeightClass,
  getSubtextFontSizeClass,
  getTargetFontSizeStyle,
} from './fontScaler';

describe('fontScaler utility', () => {
  describe('getTargetFontSizeClass', () => {
    it('returns text-giant for short targets', () => {
      expect(getTargetFontSizeClass(5)).toBe('text-giant');
      expect(getTargetFontSizeClass(15)).toBe('text-giant');
    });

    it('returns text-longsentence for medium targets', () => {
      expect(getTargetFontSizeClass(20)).toBe('text-longsentence');
      expect(getTargetFontSizeClass(35)).toBe('text-longsentence');
    });

    it('returns text-sentence for long targets', () => {
      expect(getTargetFontSizeClass(50)).toBe('text-sentence');
      expect(getTargetFontSizeClass(75)).toBe('text-sentence');
    });

    it('returns text-paragraph for very long targets', () => {
      expect(getTargetFontSizeClass(100)).toBe('text-paragraph');
    });

    it('factors in display text length', () => {
      // 10 chars target + 50 chars translation (10 + 17.5 = 27.5) -> text-longsentence
      expect(getTargetFontSizeClass(10, 50)).toBe('text-longsentence');
    });
  });

  describe('getTargetFontWeightClass', () => {
    it('returns font-bold for short targets', () => {
      expect(getTargetFontWeightClass(10)).toBe('font-bold');
    });

    it('returns font-semibold for medium targets', () => {
      expect(getTargetFontWeightClass(25)).toBe('font-semibold');
    });

    it('returns font-medium for long targets', () => {
      expect(getTargetFontWeightClass(50)).toBe('font-medium');
    });
  });

  describe('getSubtextFontSizeClass', () => {
    it('returns text-subgiant for short targets', () => {
      expect(getSubtextFontSizeClass(10)).toBe('text-subgiant');
    });

    it('returns responsive medium text class for medium targets', () => {
      expect(getSubtextFontSizeClass(25)).toBe('text-base md:text-lg');
    });

    it('returns responsive small text class for long targets', () => {
      expect(getSubtextFontSizeClass(50)).toBe('text-sm md:text-base');
    });
  });

  describe('getTargetFontSizeStyle', () => {
    it('returns empty string when using default min and max bounds', () => {
      expect(getTargetFontSizeStyle(10, 0, 1.25, 5.5, false)).toBe('');
      expect(getTargetFontSizeStyle(10, 0, 1.0, 5.5, false)).toBe('');
    });

    it('returns fixed font-size style when lockFontSize is true', () => {
      expect(getTargetFontSizeStyle(10, 0, 3.0, 3.0, true)).toBe('font-size: 3rem;');
      expect(getTargetFontSizeStyle(100, 0, 2.5, 5.5, true)).toBe('font-size: 2.5rem;');
    });

    it('returns bounded clamp CSS style when custom min or max font sizes are specified', () => {
      expect(getTargetFontSizeStyle(100, 0, 2.5, 5.5, false)).toBe('font-size: 2.5rem;');
      expect(getTargetFontSizeStyle(5, 0, 1.25, 4.0, false)).toBe(
        'font-size: clamp(2.75rem, 6vw, 4rem);',
      );
    });
  });
});
