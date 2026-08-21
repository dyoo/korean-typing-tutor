export interface CurriculumCategory {
  id: string;
  name: string;
  moduleIds: string[];
}

/** Curriculum categories grouping practice modules into logical difficulty levels. */
export const CURRICULUM_CATEGORIES: CurriculumCategory[] = [
  {
    id: 'mastery_banks',
    name: 'Mastery Progression Banks',
    moduleIds: [
      'mastery_home_row',
      'mastery_top_row',
      'mastery_bottom_row',
      'mastery_shift_keys',
      'mastery_compound_batchim',
    ],
  },
  {
    id: 'beginner',
    name: 'Beginner Fundamentals',
    moduleIds: [
      'b1_home_row_vowels',
      'b2_home_row_consonants',
      'b3_home_row_words',
      'b4_top_row',
      'b5_bottom_row',
      'b6_shift_keys',
      'l2a_simple_batchim',
      'l2b_complex_batchim',
      'l3',
      'l4',
      'l5',
    ],
  },
  {
    id: 'practical',
    name: 'Practical & Culture',
    moduleIds: [
      'sejong_phrases',
      'sejong_travel',
      'sejong_workplace',
      'sejong_dialogues',
      'sejong_culture',
      'kpop_slang',
      'korean_culture',
      'korean_tongue_twisters',
    ],
  },
  {
    id: 'topik1',
    name: 'TOPIK I (Elementary)',
    moduleIds: ['topik1_vocab', 'topik1_verbs', 'topik_grammar'],
  },
  {
    id: 'topik2',
    name: 'TOPIK II & Advanced',
    moduleIds: ['topik2_vocab', 'korean_proverbs', 'topik2_passages'],
  },
  {
    id: 'frequency_words',
    name: 'NIKL Top 6,000 Frequency Vocabulary',
    moduleIds: ['freq_1k', 'freq_2k', 'freq_3k', 'freq_4k', 'freq_5k', 'freq_6k'],
  },
];

export const ALL_CATEGORY_IDS: string[] = CURRICULUM_CATEGORIES.map((c) => c.id);

/** Returns true if all modules in a category are currently enabled. */
export function isGroupAllChecked(
  category: CurriculumCategory,
  enabledModuleIds: string[],
): boolean {
  return category.moduleIds.every((id) => enabledModuleIds.includes(id));
}

/** Returns true if some (but not all) modules in a category are currently enabled. */
export function isGroupSomeChecked(
  category: CurriculumCategory,
  enabledModuleIds: string[],
): boolean {
  const count = category.moduleIds.filter((id) => enabledModuleIds.includes(id)).length;
  return count > 0 && count < category.moduleIds.length;
}

/** Returns the count of enabled modules in a given category. */
export function getGroupCheckedCount(
  category: CurriculumCategory,
  enabledModuleIds: string[],
): number {
  return category.moduleIds.filter((id) => enabledModuleIds.includes(id)).length;
}

/** Toggles all modules in a category on or off based on current state. */
export function toggleCategoryGroupIds(
  category: CurriculumCategory,
  enabledModuleIds: string[],
): string[] {
  const allChecked = isGroupAllChecked(category, enabledModuleIds);
  if (allChecked) {
    return enabledModuleIds.filter((id) => !category.moduleIds.includes(id));
  } else {
    const newSet = new Set([...enabledModuleIds, ...category.moduleIds]);
    return Array.from(newSet);
  }
}

/** Toggles all curriculum modules on or off using tri-state tree logic. */
export function toggleAllModuleIds(
  allModuleIds: string[],
  enabledModuleIds: string[],
): string[] {
  const allChecked =
    allModuleIds.length > 0 && allModuleIds.every((id) => enabledModuleIds.includes(id));
  if (allChecked) {
    return [];
  } else {
    return [...allModuleIds];
  }
}

