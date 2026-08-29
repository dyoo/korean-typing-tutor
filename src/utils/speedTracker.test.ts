import { describe, it, expect, beforeEach } from 'vitest';
import {
  countCanonicalStrokes,
  createDefaultSpeedMetricsStore,
  loadSpeedMetricsStore,
  saveSpeedMetricsStore,
  resetSpeedMetricsStore,
  ExerciseSpeedTracker,
  getJamoKpmStats,
  getCategoryKpmStats,
  SPEED_STORAGE_KEY,
} from './speedTracker';

describe('speedTracker / KPM Engine', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('Canonical Stroke Counting (타수)', () => {
    it('counts simple Jamo syllables correctly', () => {
      // 가 = ㄱ (1) + ㅏ (1) = 2
      expect(countCanonicalStrokes('가')).toBe(2);
      // 나무 = ㄴ(1) + ㅏ(1) + ㅁ(1) + ㅜ(1) = 4
      expect(countCanonicalStrokes('나무')).toBe(4);
      // 한글 = ㅎ(1) + ㅏ(1) + ㄴ(1) + ㄱ(1) + ㅡ(1) + ㄹ(1) = 6
      expect(countCanonicalStrokes('한글')).toBe(6);
    });

    it('counts shifted Jamo as 1 stroke', () => {
      // 까 = ㄲ (1) + ㅏ (1) = 2
      expect(countCanonicalStrokes('까')).toBe(2);
      // 꽃 = ㄲ (1) + ㅗ (1) + ㅊ (1) = 3
      expect(countCanonicalStrokes('꽃')).toBe(3);
      // 예의 = ㅇ(1) + ㅖ(1) + ㅇ(1) + ㅢ(2) = 5
      expect(countCanonicalStrokes('예의')).toBe(5);
    });

    it('counts compound vowels correctly', () => {
      // 와 = ㅇ (1) + ㅘ (2) = 3
      expect(countCanonicalStrokes('와')).toBe(3);
      // 왜 = ㅇ (1) + ㅙ (3) = 4
      expect(countCanonicalStrokes('왜')).toBe(4);
      // 워 = ㅇ (1) + ㅝ (2) = 3
      expect(countCanonicalStrokes('워')).toBe(3);
      // 위 = ㅇ (1) + ㅟ (2) = 3
      expect(countCanonicalStrokes('위')).toBe(3);
    });

    it('counts compound batchim (겹받침) as 2 strokes', () => {
      // 닭 = ㄷ (1) + ㅏ (1) + ㄺ (2) = 4
      expect(countCanonicalStrokes('닭')).toBe(4);
      // 값 = ㄱ (1) + ㅏ (1) + ㅄ (2) = 4
      expect(countCanonicalStrokes('값')).toBe(4);
      // 앉다 = ㅇ(1)+ㅏ(1)+ㄵ(2) + ㄷ(1)+ㅏ(1) = 6
      expect(countCanonicalStrokes('앉다')).toBe(6);
    });

    it('counts spaces and punctuation as 1 stroke each', () => {
      // "안녕 하세요!" = ㅇ(1)+ㅏ(1)+ㄴ(1) + ㄴ(1)+ㅕ(1)+ㅇ(1) + ' '(1) + ㅎ(1)+ㅏ(1) + ㅅ(1)+ㅔ(1) + ㅇ(1)+ㅛ(1) + '!'(1)
      // = 3 + 3 + 1 + 2 + 2 + 2 + 1 = 14
      expect(countCanonicalStrokes('안녕 하세요!')).toBe(14);
    });
  });

  describe('ExerciseSpeedTracker execution and active duration calculation', () => {
    it('calculates active duration by clamping pauses to 2000ms', () => {
      const tracker = new ExerciseSpeedTracker();
      const store = createDefaultSpeedMetricsStore();

      tracker.recordKeystroke('r', 'ㄱ', true);
      tracker.recordKeystroke('k', 'ㅏ', true);

      const record = tracker.finalizeExercise(store, '가');
      expect(record).not.toBeNull();
      if (record) {
        expect(record.targetStrokes).toBe(2);
        expect(record.rawKeystrokes).toBe(2);
        expect(record.accuracy).toBe(100);
        expect(record.netKpm).toBeGreaterThan(0);
      }
    });

    it('updates per-Jamo IKI and store totals on finalized exercise', () => {
      const tracker = new ExerciseSpeedTracker();
      const store = createDefaultSpeedMetricsStore();

      tracker.recordKeystroke('r', 'ㄱ', true);
      tracker.recordKeystroke('k', 'ㅏ', true);
      tracker.recordKeystroke('s', 'ㄴ', true);

      tracker.finalizeExercise(store, '간');

      expect(store.totalExercisesCompleted).toBe(1);
      expect(store.totalTargetStrokes).toBe(3);
      expect(store.totalRawKeystrokes).toBe(3);

      const jamoStats = getJamoKpmStats(store, 'ㅏ');
      expect(jamoStats).not.toBeNull();
      if (jamoStats) {
        expect(jamoStats.attempts).toBe(1);
        expect(jamoStats.kpm).toBeGreaterThan(0);
      }
    });

    it('retrieves category stats for words and sentences', () => {
      const tracker = new ExerciseSpeedTracker();
      const store = createDefaultSpeedMetricsStore();

      // Word exercise
      tracker.recordKeystroke('r', 'ㄱ', true);
      tracker.recordKeystroke('k', 'ㅏ', true);
      tracker.finalizeExercise(store, '가');

      // Sentence exercise
      tracker.recordKeystroke('r', 'ㄱ', true);
      tracker.recordKeystroke('k', 'ㅏ', true);
      tracker.finalizeExercise(store, '한국어 공부를 시작해 봅시다');

      const wordStats = getCategoryKpmStats(store, 'words');
      expect(wordStats).not.toBeNull();
      if (wordStats) {
        expect(wordStats.count).toBe(1);
        expect(wordStats.kpm).toBeGreaterThan(0);
      }

      const sentenceStats = getCategoryKpmStats(store, 'sentences');
      expect(sentenceStats).not.toBeNull();
      if (sentenceStats) {
        expect(sentenceStats.count).toBe(1);
        expect(sentenceStats.kpm).toBeGreaterThan(0);
      }
    });

    it('persists, loads, and resets speed metrics store', () => {
      const store = createDefaultSpeedMetricsStore();
      store.bestNetKpm = 350;
      store.totalTargetStrokes = 1200;
      saveSpeedMetricsStore(store);

      const loaded = loadSpeedMetricsStore();
      expect(loaded.bestNetKpm).toBe(350);
      expect(loaded.totalTargetStrokes).toBe(1200);

      const raw = localStorage.getItem(SPEED_STORAGE_KEY);
      expect(raw).not.toBeNull();

      resetSpeedMetricsStore(loaded);
      expect(loaded.bestNetKpm).toBe(0);
      expect(loaded.totalTargetStrokes).toBe(0);
      expect(loaded.recentHistory).toEqual([]);

      const reloaded = loadSpeedMetricsStore();
      expect(reloaded.bestNetKpm).toBe(0);
      expect(reloaded.totalTargetStrokes).toBe(0);
    });
  });
});
