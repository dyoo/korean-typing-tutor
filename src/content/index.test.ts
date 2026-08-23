import { describe, it, expect } from 'vitest';
import contentData from './index';
import { CURRICULUM_CATEGORIES } from './curriculumCategories';
import { isHangulSyllable } from '../utils/hangulTables';

describe('Content data validation', () => {
  it('should not contain Latin characters in any target field', () => {
    const latinPattern = /[a-zA-Z]/;
    const violations: { moduleId: string; id: string; target: string }[] = [];

    for (const item of contentData.items) {
      if (latinPattern.test(item.target)) {
        violations.push({
          moduleId: item.moduleId,
          id: item.id,
          target: item.target,
        });
      }
    }

    expect(violations, `Found ${violations.length} target(s) with Latin characters`).toEqual([]);
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

  it('should ensure all category module IDs exist in loaded modules', () => {
    const loadedModuleIds = new Set(contentData.modules.map((m) => m.id));
    for (const category of CURRICULUM_CATEGORIES) {
      for (const moduleId of category.moduleIds) {
        expect(
          loadedModuleIds.has(moduleId),
          `Category ${category.name} references unknown module ${moduleId}`,
        ).toBe(true);
      }
    }
  });

  it('should have non-empty targets and translations for all items', () => {
    const moduleIds = new Set(contentData.modules.map((m) => m.id));

    for (const item of contentData.items) {
      expect(item.target.trim().length).toBeGreaterThan(0);
      expect(item.translation?.trim().length ?? 0).toBeGreaterThan(0);
      expect(moduleIds.has(item.moduleId)).toBe(true);
    }
  });

  it('should have unique item IDs across the entire curriculum', () => {
    const seenIds = new Set<string>();
    const duplicates: string[] = [];

    for (const item of contentData.items) {
      if (seenIds.has(item.id)) {
        duplicates.push(item.id);
      }
      seenIds.add(item.id);
    }

    expect(duplicates, `Duplicate item IDs found: ${duplicates.join(', ')}`).toEqual([]);
  });

  it('should not contain unescaped HTML entities or HTML tags in targets or translations', () => {
    const entityPattern = /&[a-z0-9#]+;/i;
    const tagPattern = /<[^>]+>/;
    const entityViolations: { id: string; target: string; translation?: string | null }[] = [];

    for (const item of contentData.items) {
      if (
        entityPattern.test(item.target) ||
        (item.translation && entityPattern.test(item.translation)) ||
        tagPattern.test(item.target) ||
        (item.translation && tagPattern.test(item.translation))
      ) {
        entityViolations.push({
          id: item.id,
          target: item.target,
          translation: item.translation,
        });
      }
    }

    expect(
      entityViolations,
      `Found ${entityViolations.length} items with HTML entities or tags`,
    ).toEqual([]);
  });

  it('should load all 36 curriculum modules and 7,887 authentic items', () => {
    expect(contentData.modules.length).toBe(36);
    expect(contentData.items.length).toBe(7887);
  });
});


