import { describe, it, expect } from 'vitest';
import { MasteryPool } from './masteryPool';
import type { LessonItem } from '../types/korean';
import type { MasteryTarget, JamoProgressionItem, SentenceCheckpoint } from '../types/mastery';

describe('MasteryPool Container', () => {
  const dummyCurriculum: LessonItem[] = [
    { id: '1', moduleId: 'm1', target: '어', translation: 'Oh' },
    { id: '2', moduleId: 'm1', target: '아', translation: 'Ah' },
    { id: '3', moduleId: 'm1', target: '아이', translation: 'Child' },
    { id: '4', moduleId: 'm1', target: '오이', translation: 'Cucumber' },
    { id: '5', moduleId: 'm1', target: '우유', translation: 'Milk' },
  ];

  const jamoTarget1: MasteryTarget = {
    type: 'jamo',
    item: {
      jamo: 'ㅓ',
      key: 'j',
      hand: 'right',
      stage: 1,
      stageName: 'Home Row Index Keys',
    } as JamoProgressionItem,
  };

  const jamoTarget2: MasteryTarget = {
    type: 'jamo',
    item: {
      jamo: 'ㅏ',
      key: 'k',
      hand: 'right',
      stage: 1,
      stageName: 'Home Row Index Keys',
    } as JamoProgressionItem,
  };

  const checkpointTarget: MasteryTarget = {
    type: 'checkpoint',
    checkpoint: {
      id: 'cp_home_row',
      stage: 2,
      stageName: 'Home Row Checkpoint',
      title: 'Home Row Sentences',
      afterJamoIndex: 8,
      requiredCompletions: 10,
    } as SentenceCheckpoint,
  };

  it('rebuilds the candidate pool and returns an initial exercise', () => {
    const pool = new MasteryPool();
    const unlocked = new Set(['ㅓ', 'ㅏ']);

    const initial = pool.rebuild(dummyCurriculum, unlocked, jamoTarget1, {});
    expect(initial).toBeDefined();
    expect(pool.getPool().length).toBeGreaterThan(0);
    expect(pool.getHistory()).toEqual([initial]);
    expect(pool.getHistoryIndex()).toBe(0);
    expect(pool.canGoBack()).toBe(false);
    expect(pool.canGoForward()).toBe(false);
    expect(pool.getCurrent()).toBe(initial);
  });

  it('advances history when next() is called', () => {
    const pool = new MasteryPool();
    const unlocked = new Set(['ㅓ', 'ㅏ']);

    const first = pool.rebuild(dummyCurriculum, unlocked, jamoTarget1, {});
    const second = pool.next({}, first.id);

    expect(pool.getHistory()).toHaveLength(2);
    expect(pool.getHistoryIndex()).toBe(1);
    expect(pool.getCurrent()).toBe(second);
    expect(pool.canGoBack()).toBe(true);
    expect(pool.canGoForward()).toBe(false);
  });

  it('supports backwards and forwards navigation along the history stack', () => {
    const pool = new MasteryPool();
    const unlocked = new Set(['ㅓ', 'ㅏ']);

    const first = pool.rebuild(dummyCurriculum, unlocked, jamoTarget1, {});
    const second = pool.next({}, first.id);
    const third = pool.next({}, second.id);

    expect(pool.getHistoryIndex()).toBe(2);
    expect(pool.canGoBack()).toBe(true);
    expect(pool.canGoForward()).toBe(false);

    // Navigate back to second
    const prev1 = pool.previous();
    expect(prev1).toBe(second);
    expect(pool.getHistoryIndex()).toBe(1);
    expect(pool.canGoBack()).toBe(true);
    expect(pool.canGoForward()).toBe(true);

    // Navigate back to first
    const prev2 = pool.previous();
    expect(prev2).toBe(first);
    expect(pool.getHistoryIndex()).toBe(0);
    expect(pool.canGoBack()).toBe(false);
    expect(pool.canGoForward()).toBe(true);

    // Navigate past the beginning returns null
    expect(pool.previous()).toBeNull();
    expect(pool.getHistoryIndex()).toBe(0);

    // Navigate forward using next() without generating a new item
    const fwd1 = pool.next({});
    expect(fwd1).toBe(second);
    expect(pool.getHistoryIndex()).toBe(1);
    expect(pool.getHistory()).toHaveLength(3); // History length preserved!

    const fwd2 = pool.next({});
    expect(fwd2).toBe(third);
    expect(pool.getHistoryIndex()).toBe(2);
    expect(pool.canGoForward()).toBe(false);

    // Now at forward edge: calling next() generates a 4th item
    const fourth = pool.next({});
    expect(pool.getHistory()).toHaveLength(4);
    expect(pool.getHistoryIndex()).toBe(3);
    expect(fourth).toBeDefined();
  });

  it('validates pool validity against active target and unlocked Jamo set', () => {
    const pool = new MasteryPool();
    const unlockedStage1 = new Set(['ㅓ', 'ㅏ']);
    const unlockedStage2 = new Set(['ㅓ', 'ㅏ', 'ㅇ', 'ㄹ']);

    pool.rebuild(dummyCurriculum, unlockedStage1, jamoTarget1, {});

    // Same target and unlocked set is valid
    expect(pool.isPoolValid(jamoTarget1, unlockedStage1)).toBe(true);

    // Different target is invalid
    expect(pool.isPoolValid(jamoTarget2, unlockedStage1)).toBe(false);

    // Different unlocked set is invalid
    expect(pool.isPoolValid(jamoTarget1, unlockedStage2)).toBe(false);

    // Transition to checkpoint is invalid
    expect(pool.isPoolValid(checkpointTarget, unlockedStage1)).toBe(false);
  });
});
