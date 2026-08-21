import { describe, it, expect } from 'vitest';
import {
  CURRICULUM_CATEGORIES,
  ALL_CATEGORY_IDS,
  isGroupAllChecked,
  isGroupSomeChecked,
  getGroupCheckedCount,
  toggleCategoryGroupIds,
  toggleAllModuleIds,
} from './curriculumCategories';

describe('curriculumCategories helper module', () => {
  const beginnerCategory = CURRICULUM_CATEGORIES.find((c) => c.id === 'beginner')!;
  const sampleModuleIds = ['mod1', 'mod2', 'mod3'];

  it('contains expected categories and category IDs', () => {
    expect(CURRICULUM_CATEGORIES.length).toBeGreaterThan(0);
    expect(ALL_CATEGORY_IDS).toContain('mastery_banks');
    expect(ALL_CATEGORY_IDS).toContain('beginner');
    expect(ALL_CATEGORY_IDS).toContain('practical');
    expect(ALL_CATEGORY_IDS).toContain('topik1');
    expect(ALL_CATEGORY_IDS).toContain('topik2');
    expect(ALL_CATEGORY_IDS).toContain('frequency_words');

    expect(ALL_CATEGORY_IDS).not.toContain('batchim');
    expect(ALL_CATEGORY_IDS).not.toContain('core');

    const masteryIndex = ALL_CATEGORY_IDS.indexOf('mastery_banks');
    expect(masteryIndex).toBe(0);

    const practicalIndex = ALL_CATEGORY_IDS.indexOf('practical');
    const topik1Index = ALL_CATEGORY_IDS.indexOf('topik1');
    expect(practicalIndex).toBeLessThan(topik1Index);
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

  it('correctly toggles all module IDs using tri-state logic', () => {
    // When none enabled -> selects all
    expect(toggleAllModuleIds(sampleModuleIds, [])).toEqual(sampleModuleIds);

    // When partially enabled (indeterminate) -> selects all
    expect(toggleAllModuleIds(sampleModuleIds, ['mod1'])).toEqual(sampleModuleIds);

    // When all enabled -> deselects all
    expect(toggleAllModuleIds(sampleModuleIds, sampleModuleIds)).toEqual([]);
  });
});
