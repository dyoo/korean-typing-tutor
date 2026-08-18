export interface CurriculumCategory {
  id: string;
  name: string;
  moduleIds: string[];
}

/** Curriculum categories grouping practice modules into logical difficulty levels. */
export const CURRICULUM_CATEGORIES: CurriculumCategory[] = [
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
    ],
  },
  {
    id: 'batchim',
    name: 'Final Consonants (받침)',
    moduleIds: ['l2a_simple_batchim', 'l2b_complex_batchim'],
  },
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
    id: 'core',
    name: 'Core Vocabulary & Verbs',
    moduleIds: ['l3', 'l4', 'l5'],
  },
  {
    id: 'topik1',
    name: 'TOPIK I (Elementary)',
    moduleIds: ['topik1_vocab', 'topik1_verbs', 'topik_grammar'],
  },
  {
    id: 'practical',
    name: 'Practical & Culture',
    moduleIds: ['sejong_phrases', 'kpop_slang', 'korean_culture', 'korean_tongue_twisters'],
  },
  {
    id: 'topik2',
    name: 'TOPIK II & Advanced',
    moduleIds: ['topik2_vocab', 'korean_proverbs', 'topik2_passages'],
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
