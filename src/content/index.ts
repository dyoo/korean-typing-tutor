import type { CurriculumData, LessonItem, ModuleDefinition } from '../types/korean';

/** Lesson item as stored inside per-module JSON files (without redundant moduleId). */
type RawLessonItem = Omit<LessonItem, 'moduleId'>;

interface ModuleFile {
  id: string;
  title: string;
  description: string;
  items: RawLessonItem[];
}

/** Canonical ordered list of module IDs for curriculum progression. */
const MODULE_ORDER = [
  'mastery_home_row',
  'mastery_top_row',
  'mastery_bottom_row',
  'mastery_shift_keys',
  'mastery_compound_batchim',
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
  'sejong_phrases',
  'sejong_travel',
  'sejong_workplace',
  'sejong_dialogues',
  'sejong_culture',
  'kpop_slang',
  'korean_culture',
  'korean_tongue_twisters',
  'topik1_vocab',
  'topik1_verbs',
  'topik_grammar',
  'topik2_vocab',
  'korean_proverbs',
  'topik2_passages',
  'freq_1k',
  'freq_2k',
  'freq_3k',
  'freq_4k',
  'freq_5k',
  'freq_6k',
];

/** Eagerly import all per-module JSON content files. */
const moduleFiles = import.meta.glob<ModuleFile>('./modules/*.json', { eager: true });

const moduleMap = new Map<string, ModuleFile>();
for (const path in moduleFiles) {
  const modData = moduleFiles[path];
  const fileContent = (modData as { default?: ModuleFile }).default ?? modData;
  if (fileContent && fileContent.id) {
    moduleMap.set(fileContent.id, fileContent);
  }
}

const modules: ModuleDefinition[] = [];
const items: LessonItem[] = [];

function appendModule(mod: ModuleFile): void {
  modules.push({
    id: mod.id,
    title: mod.title,
    description: mod.description,
  });
  items.push(
    ...mod.items.map((item) => ({
      ...item,
      moduleId: mod.id,
    })),
  );
}

for (const id of MODULE_ORDER) {
  const mod = moduleMap.get(id);
  if (mod) {
    appendModule(mod);
  }
}

for (const [id, mod] of moduleMap.entries()) {
  if (!MODULE_ORDER.includes(id)) {
    appendModule(mod);
  }
}

const contentData: CurriculumData = {
  modules,
  items,
};

export * from './curriculumCategories';
export default contentData;

