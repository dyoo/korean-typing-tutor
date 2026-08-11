import { describe, it, expect } from 'vitest';
import {
  CURRICULUM_CATEGORIES,
  ALL_CATEGORY_IDS,
  isGroupAllChecked,
  isGroupSomeChecked,
  getGroupCheckedCount,
  toggleCategoryGroupIds,
} from './curriculumCategories';

describe('curriculumCategories helper module', () => {
  const beginnerCategory = CURRICULUM_CATEGORIES[0]; // Beginner Fundamentals

  it('contains expected categories and category IDs', () => {
    expect(CURRICULUM_CATEGORIES.length).toBeGreaterThan(0);
    expect(ALL_CATEGORY_IDS).toContain('beginner');
    expect(ALL_CATEGORY_IDS).toContain('batchim');
    expect(ALL_CATEGORY_IDS).toContain('topik1');
  });

  it('correctly calculates isGroupAllChecked', () => {
    const allEnabled = [...beginnerCategory.moduleIds];
    expect(isGroupAllChecked(beginnerCategory, allEnabled)).toBe(true);

    const partialEnabled = [beginnerCategory.moduleIds[0]];
    expect(isGroupAllChecked(beginnerCategory, partialEnabled)).toBe(false);
  });

  it('correctly calculates isGroupSomeChecked', () => {
    const allEnabled = [...beginnerCategory.moduleIds];
    expect(isGroupSomeChecked(beginnerCategory, allEnabled)).toBe(false);

    const partialEnabled = [beginnerCategory.moduleIds[0]];
    expect(isGroupSomeChecked(beginnerCategory, partialEnabled)).toBe(true);

    const noneEnabled: string[] = [];
    expect(isGroupSomeChecked(beginnerCategory, noneEnabled)).toBe(false);
  });

  it('correctly returns getGroupCheckedCount', () => {
    const partialEnabled = [beginnerCategory.moduleIds[0], beginnerCategory.moduleIds[1]];
    expect(getGroupCheckedCount(beginnerCategory, partialEnabled)).toBe(2);
  });

  it('toggles category group on and off', () => {
    const initial: string[] = [];
    const enabledAll = toggleCategoryGroupIds(beginnerCategory, initial);
    expect(enabledAll).toEqual(expect.arrayContaining(beginnerCategory.moduleIds));

    const disabledAll = toggleCategoryGroupIds(beginnerCategory, enabledAll);
    expect(disabledAll).toEqual([]);
  });
});
