import { describe, it, expect } from 'vitest';
import { MASTERY_JAMO_VOCABULARY, MASTERY_CHECKPOINT_SENTENCES } from './masteryVocabulary';
import {
  JAMO_PROGRESSION_ORDER,
  SENTENCE_CHECKPOINTS,
  isItemEligible,
  getSectionJamosForCheckpoint,
  itemUsesAnyJamo,
} from '../utils/jamoMastery';
import { decomposeStringToJamos } from '../utils/hangulDecompose';

describe('Mastery Vocabulary Bank Verification', () => {
  it('contains vocabulary entries for every single Jamo in progression order', () => {
    for (const item of JAMO_PROGRESSION_ORDER) {
      const vocab = MASTERY_JAMO_VOCABULARY[item.jamo];
      expect(vocab, `Missing vocabulary for Jamo: ${item.jamo}`).toBeDefined();
      expect(vocab.length, `Expected at least 1 item for Jamo: ${item.jamo}`).toBeGreaterThan(0);
    }
  });

  it('ensures every word in each Jamo bank only uses cumulative unlocked Jamos up to that step', () => {
    const cumulativeJamos = new Set<string>(['ㅓ', 'ㅏ', 'ㅇ', 'ㄹ']);

    for (const item of JAMO_PROGRESSION_ORDER) {
      cumulativeJamos.add(item.jamo);
      const vocab = MASTERY_JAMO_VOCABULARY[item.jamo] || [];

      for (const entry of vocab) {
        const isEligible = isItemEligible(entry, cumulativeJamos);
        const decomposed = decomposeStringToJamos(entry.target);
        expect(
          isEligible,
          `Item "${entry.target}" for Jamo "${item.jamo}" contains unauthorized Jamos: ${decomposed.join(', ')}. Cumulative unlocked: ${Array.from(cumulativeJamos).join(', ')}`,
        ).toBe(true);

        // Ensure Jamo practice items are short (<= 12 chars)
        expect(
          entry.target.length,
          `Item "${entry.target}" is too long (${entry.target.length} chars) for short word practice`,
        ).toBeLessThanOrEqual(12);
      }
    }
  });

  it('ensures each Sentence Checkpoint contains at least 15 valid sentences matching unlocked Jamos and section Jamos', () => {
    for (const cp of SENTENCE_CHECKPOINTS) {
      const sentences = MASTERY_CHECKPOINT_SENTENCES[cp.id];
      expect(sentences, `Missing sentences for checkpoint: ${cp.id}`).toBeDefined();
      expect(
        sentences.length,
        `Expected at least 15 sentences for ${cp.id}, got ${sentences?.length}`,
      ).toBeGreaterThanOrEqual(15);

      const unlockedJamos = new Set(
        JAMO_PROGRESSION_ORDER.slice(0, cp.afterJamoIndex).map((i) => i.jamo),
      );
      const sectionJamos = getSectionJamosForCheckpoint(cp.id);

      for (const sent of sentences) {
        // Sentence should only use unlocked letters
        const isEligible = isItemEligible(sent, unlockedJamos);
        expect(
          isEligible,
          `Sentence "${sent.target}" in ${cp.id} contains unauthorized Jamos`,
        ).toBe(true);

        // Sentence should be multi-word / medium-to-long
        expect(
          sent.target.length,
          `Sentence "${sent.target}" should be at least 5 characters`,
        ).toBeGreaterThanOrEqual(5);

        // For milestone challenges (except the last milestone cp_master), sentence must use Jamo used in that section
        if (sectionJamos && sectionJamos.size > 0) {
          const usesSectionJamo = itemUsesAnyJamo(sent.target, sectionJamos);
          expect(
            usesSectionJamo,
            `Sentence "${sent.target}" in checkpoint "${cp.id}" must contain at least one Jamo from section: ${Array.from(sectionJamos).join(', ')}`,
          ).toBe(true);
        }
      }
    }
  });

  it('ensures every compound batchim Jamo has at least 10 authentic examples', () => {
    const compoundBatchims = ['ㄶ', 'ㄵ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㅄ', 'ㅀ', 'ㄳ', 'ㄾ', 'ㄿ', 'ㄽ'];
    for (const cb of compoundBatchims) {
      const vocab = MASTERY_JAMO_VOCABULARY[cb] || [];
      expect(
        vocab.length,
        `Expected at least 10 vocabulary items for compound batchim "${cb}", got ${vocab.length}`,
      ).toBeGreaterThanOrEqual(10);
    }
  });

  it('ensures every Shift key Jamo has at least 10 authentic examples', () => {
    const shiftKeys = ['ㄲ', 'ㅆ', 'ㄸ', 'ㅉ', 'ㅃ', 'ㅒ', 'ㅖ'];
    for (const sk of shiftKeys) {
      const vocab = MASTERY_JAMO_VOCABULARY[sk] || [];
      expect(
        vocab.length,
        `Expected at least 10 vocabulary items for Shift key "${sk}", got ${vocab.length}`,
      ).toBeGreaterThanOrEqual(10);
    }
  });

  it('contains valid author and work attributions for iconic literature and poetry items', () => {
    let attributedCount = 0;
    for (const checkpointId in MASTERY_CHECKPOINT_SENTENCES) {
      const list = MASTERY_CHECKPOINT_SENTENCES[checkpointId] || [];
      for (const item of list) {
        if (item.attribution) {
          attributedCount++;
          expect(typeof item.attribution).toBe('string');
          expect(item.attribution.length).toBeGreaterThan(3);
        }
      }
    }
    expect(
      attributedCount,
      'Expected at least 25 attributed poetry and literature items',
    ).toBeGreaterThanOrEqual(25);
  });
});
