/**
 * @file jamoTestUtils.ts
 * @description Test-only Hangul linguistic inspection utilities.
 * Used exclusively in test suites and dataset verification to validate
 * vowel, consonant, and batchim composition without shipping overhead to production.
 */

import { computeJamoMetadata } from '../utils/jamoMastery';

/**
 * Checks whether a text string contains the specified final consonant (받침) in any syllable.
 */
export function hasBatchim(text: string, batchim: string): boolean {
  if (!text || !batchim) {
    return false;
  }
  return computeJamoMetadata(text).batchims.has(batchim);
}

/**
 * Checks whether a text string contains the specified vowel in any syllable.
 */
export function hasVowel(text: string, vowel: string): boolean {
  if (!text || !vowel) {
    return false;
  }
  return computeJamoMetadata(text).allJamos.has(vowel);
}

/**
 * Checks whether a text string contains the specified consonant in any syllable.
 */
export function hasConsonant(text: string, consonant: string): boolean {
  if (!text || !consonant) {
    return false;
  }
  return computeJamoMetadata(text).allJamos.has(consonant);
}

/**
 * Checks if a Hangul target string contains at least one Jamo from the specified set of Jamos.
 * Accounts for initial consonants, vowels, and final consonants.
 */
export function itemUsesAnyJamo(text: string, targetJamos: ReadonlySet<string>): boolean {
  if (!text || targetJamos.size === 0) {
    return false;
  }
  const meta = computeJamoMetadata(text);
  for (const j of targetJamos) {
    if (meta.allJamos.has(j)) {
      return true;
    }
  }
  return false;
}
