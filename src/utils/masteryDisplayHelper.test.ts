import { describe, it, expect } from 'vitest';
import { computeMasteryDisplayInfo } from './masteryDisplayHelper';
import { JAMO_PROGRESSION_ORDER, SENTENCE_CHECKPOINTS } from './jamoMastery';
import type { MasteryTarget, MasteryState } from '../types/mastery';

function createMockMasteryState(): MasteryState {
  return {
    mode: 'mastery',
    unlockedCount: 1,
    activeCheckpointId: null,
    activeFocusBatchim: null,
    jamoStats: {
      ㅓ: {
        totalAttempts: 20,
        correctAttempts: 20,
        recentHistory: Array(20).fill(true),
        isMastered: true,
      },
    },
    sentenceCheckpointStats: {
      cp_home_row: {
        completedCount: 3,
        isMastered: false,
      },
    },
  };
}

describe('computeMasteryDisplayInfo', () => {
  it('computes display info for a linear Jamo learning target', () => {
    const target: MasteryTarget = {
      type: 'jamo',
      item: JAMO_PROGRESSION_ORDER[0],
    };
    const state = createMockMasteryState();

    const info = computeMasteryDisplayInfo(
      target,
      state,
      () => null,
      (jamo) => (jamo === 'ㅓ' ? { kpm: 180 } : null),
      true,
    );

    expect(info.activeJamoChar).toBe('ㅓ');
    expect(info.activeJamoLabel).toBe('Focus:');
    expect(info.isPostGame).toBe(false);
    expect(info.activeJamoProgress).toBe(100);
    expect(info.currentStageNumber).toBe(1);
    expect(info.currentStageName).toBe('Home Row Index Keys');
    expect(info.activeKpm).toBe(180);
  });

  it('computes display info for a checkpoint milestone target', () => {
    const checkpoint = SENTENCE_CHECKPOINTS[0];
    const target: MasteryTarget = {
      type: 'checkpoint',
      checkpoint,
    };
    const state = createMockMasteryState();

    const info = computeMasteryDisplayInfo(target, state);

    expect(info.activeCheckpointTitle).toBe(checkpoint.title);
    expect(info.activeCheckpointProgress).toEqual({
      completed: 3,
      total: checkpoint.requiredCompletions,
    });
    expect(info.isPostGame).toBe(false);
    expect(info.currentStageNumber).toBe(checkpoint.stage);
    expect(info.currentStageName).toBe(checkpoint.stageName);
  });

  it('computes display info for word consolidation mode', () => {
    const target: MasteryTarget = {
      type: 'consolidation_words',
    };
    const state = createMockMasteryState();

    const info = computeMasteryDisplayInfo(
      target,
      state,
      (cat) => (cat === 'words' ? { kpm: 220 } : null),
      () => null,
      true,
    );

    expect(info.isPostGame).toBe(true);
    expect(info.postGameSubtype).toBe('Words');
    expect(info.activeJamoLabel).toBe('Target:');
    expect(info.activeTargetRemaining).toBe('All Words');
    expect(info.activeKpm).toBe(220);
  });

  it('computes display info for sentence consolidation mode', () => {
    const target: MasteryTarget = {
      type: 'consolidation_sentences',
    };
    const state = createMockMasteryState();

    const info = computeMasteryDisplayInfo(
      target,
      state,
      (cat) => (cat === 'sentences' ? { kpm: 310 } : null),
      () => null,
      true,
    );

    expect(info.isPostGame).toBe(true);
    expect(info.postGameSubtype).toBe('Sentences');
    expect(info.activeJamoLabel).toBe('Target:');
    expect(info.activeTargetRemaining).toBe('All Sentences');
    expect(info.activeKpm).toBe(310);
  });

  it('computes display info for batchim focus mode', () => {
    const target: MasteryTarget = {
      type: 'focus',
      item: {
        batchim: 'ㄲ',
        name: 'Tense G/K',
        jamo: 'ㄲ',
        key: 'r',
        shift: true,
        hand: 'left',
        combination: ['ㄱ', 'ㄱ'],
      },
    };
    const state = createMockMasteryState();

    const info = computeMasteryDisplayInfo(target, state);

    expect(info.isPostGame).toBe(true);
    expect(info.postGameSubtype).toBe('Batchim');
    expect(info.activeJamoChar).toBe('ㄲ');
    expect(info.activeJamoLabel).toBe('Batchim:');
    expect(info.activeTargetRemaining).toBe('Tense G/K');
    expect(info.activeLearningCombination).toEqual(['ㄱ', 'ㄱ']);
  });

  it('suppresses KPM when showKpm is false', () => {
    const target: MasteryTarget = {
      type: 'jamo',
      item: JAMO_PROGRESSION_ORDER[0],
    };
    const state = createMockMasteryState();

    const info = computeMasteryDisplayInfo(
      target,
      state,
      () => ({ kpm: 200 }),
      () => ({ kpm: 200 }),
      false,
    );

    expect(info.activeKpm).toBeNull();
  });
});
