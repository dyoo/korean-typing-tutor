import { describe, it, expect } from 'vitest';
import contentData from './content';
import { isHangulSyllable } from './utils/hangulTables';

describe('Curriculum Content Dataset Integrity', () => {
  it('contains modules and items', () => {
    expect(contentData.modules.length).toBeGreaterThan(0);
    expect(contentData.items.length).toBeGreaterThan(0);
  });

  it('ensures all item targets contain only typeable characters', () => {
    const nonTypeableItems: Array<{ id: string; target: string; invalidChar: string }> = [];

    for (const item of contentData.items) {
      for (const char of item.target) {
        const code = char.charCodeAt(0);
        const isKoreanSyllable = isHangulSyllable(code);
        const isHangulJamo = code >= 0x3131 && code <= 0x318e;
        const isAsciiPrintable = code >= 32 && code <= 126; // includes space, numbers, punctuation, English letters

        if (!isKoreanSyllable && !isHangulJamo && !isAsciiPrintable) {
          nonTypeableItems.push({
            id: item.id,
            target: item.target,
            invalidChar: char,
          });
        }
      }
    }

    expect(nonTypeableItems).toEqual([]);
  });

  it('ensures all items have valid module IDs and non-empty targets', () => {
    const moduleIds = new Set(contentData.modules.map((m) => m.id));

    for (const item of contentData.items) {
      expect(item.target.trim().length).toBeGreaterThan(0);
      expect(moduleIds.has(item.moduleId)).toBe(true);
    }
  });
});
