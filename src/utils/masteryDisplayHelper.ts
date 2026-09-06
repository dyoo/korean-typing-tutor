import { JAMO_STAGES, calculateJamoProgress } from './jamoMastery';
import type { MasteryTarget, MasteryState } from '../types/mastery';

export interface MasteryDisplayInfo {
  readonly activeJamoChar: string | null;
  readonly activeJamoLabel: string;
  readonly activeLearningCombination?: readonly [string, string];
  readonly activeJamoProgress: number;
  readonly activeTargetRemaining: string | null;
  readonly isPostGame: boolean;
  readonly postGameSubtype: string | null;
  readonly activeCheckpointTitle: string | null;
  readonly activeCheckpointProgress: { readonly completed: number; readonly total: number } | null;
  readonly currentStageNumber: number;
  readonly currentStageName: string;
  readonly totalStageCount: number;
  readonly activeKpm: number | null;
}

/**
 * Computes the unified presentation metadata for the mastery mode header and badges.
 * Evaluates whether the user is in linear progression, a sentence checkpoint milestone,
 * a single-Jamo focus workshop, or open word/sentence consolidation practice.
 */
export function computeMasteryDisplayInfo(
  activeMasteryTarget: MasteryTarget,
  masteryState: MasteryState,
  getCategoryKpm?: (category: 'words' | 'sentences') => { readonly kpm: number } | null,
  getJamoKpm?: (jamo: string) => { readonly kpm: number } | null,
  showKpm = true,
): MasteryDisplayInfo {
  const activeLearningJamo = activeMasteryTarget.type === 'jamo' ? activeMasteryTarget.item : null;
  const activeFocusBatchimItem =
    activeMasteryTarget.type === 'focus' ? activeMasteryTarget.item : null;
  const activeFocusVowelItem =
    activeMasteryTarget.type === 'consolidation_vowel' ? activeMasteryTarget.item : null;
  const activeFocusConsonantItem =
    activeMasteryTarget.type === 'consolidation_consonant' ? activeMasteryTarget.item : null;

  const activeConsolidationMode =
    activeMasteryTarget.type === 'consolidation_words'
      ? 'words'
      : activeMasteryTarget.type === 'consolidation_sentences'
        ? 'sentences'
        : null;

  const activeJamoChar =
    activeLearningJamo?.jamo ??
    activeFocusBatchimItem?.batchim ??
    activeFocusVowelItem?.jamo ??
    activeFocusConsonantItem?.jamo ??
    null;

  const activeLearningCombination =
    activeLearningJamo?.combination ??
    activeFocusBatchimItem?.combination ??
    activeFocusVowelItem?.combination ??
    activeFocusConsonantItem?.combination;

  const isPostGame =
    activeMasteryTarget.type === 'focus' ||
    activeMasteryTarget.type === 'consolidation_words' ||
    activeMasteryTarget.type === 'consolidation_sentences' ||
    activeMasteryTarget.type === 'consolidation_vowel' ||
    activeMasteryTarget.type === 'consolidation_consonant';

  const postGameSubtype =
    activeConsolidationMode === 'words'
      ? 'Words'
      : activeConsolidationMode === 'sentences'
        ? 'Sentences'
        : activeFocusVowelItem
          ? 'Vowel'
          : activeFocusConsonantItem
            ? 'Consonant'
            : activeFocusBatchimItem
              ? 'Batchim'
              : null;

  const activeJamoLabel = activeConsolidationMode
    ? 'Target:'
    : activeFocusBatchimItem
      ? 'Batchim:'
      : 'Focus:';

  const activeTargetRemaining =
    activeConsolidationMode === 'words'
      ? 'All Words'
      : activeConsolidationMode === 'sentences'
        ? 'All Sentences'
        : (activeFocusBatchimItem?.name ??
          activeFocusVowelItem?.name ??
          activeFocusConsonantItem?.name ??
          null);

  const activeJamoProgress =
    activeJamoChar && masteryState.jamoStats?.[activeJamoChar]
      ? calculateJamoProgress(masteryState.jamoStats[activeJamoChar])
      : 0;

  const activeCheckpointTitle =
    activeMasteryTarget.type === 'checkpoint' ? activeMasteryTarget.checkpoint.title : null;

  const activeCheckpointProgress =
    activeMasteryTarget.type === 'checkpoint'
      ? {
          completed:
            masteryState.sentenceCheckpointStats?.[activeMasteryTarget.checkpoint.id]
              ?.completedCount ?? 0,
          total: activeMasteryTarget.checkpoint.requiredCompletions,
        }
      : null;

  let activeKpm: number | null = null;
  if (showKpm) {
    if (activeConsolidationMode === 'words') {
      activeKpm = getCategoryKpm?.('words')?.kpm ?? null;
    } else if (activeConsolidationMode === 'sentences') {
      activeKpm = getCategoryKpm?.('sentences')?.kpm ?? null;
    } else if (activeJamoChar) {
      activeKpm = getJamoKpm?.(activeJamoChar)?.kpm ?? null;
    }
  }

  const currentStageNumber =
    activeLearningJamo?.stage ??
    (activeMasteryTarget.type === 'checkpoint' ? activeMasteryTarget.checkpoint.stage : 1);

  const currentStageName =
    activeLearningJamo?.stageName ??
    (activeMasteryTarget.type === 'checkpoint'
      ? activeMasteryTarget.checkpoint.stageName
      : 'Home Row');

  const totalStageCount = JAMO_STAGES.length;

  return {
    activeJamoChar,
    activeJamoLabel,
    activeLearningCombination,
    activeJamoProgress,
    activeTargetRemaining,
    isPostGame,
    postGameSubtype,
    activeCheckpointTitle,
    activeCheckpointProgress,
    currentStageNumber,
    currentStageName,
    totalStageCount,
    activeKpm,
  };
}
