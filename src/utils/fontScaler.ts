/**
 * Font Scaler Utility Module
 *
 * Provides functions for calculating character-length tiered CSS font-size
 * and font-weight classes for the Korean Typing Tutor target display.
 */

interface FontTierConfig {
  maxEffectiveLength: number;
  fontSizeClass: string;
  fontWeightClass: string;
  subtextFontSizeClass: string;
  baseMin: number;
  baseMax: number;
  vwScale: string;
}

const FONT_TIERS: FontTierConfig[] = [
  {
    maxEffectiveLength: 15,
    fontSizeClass: 'text-giant',
    fontWeightClass: 'font-bold',
    subtextFontSizeClass: 'text-subgiant',
    baseMin: 2.75,
    baseMax: 5.5,
    vwScale: '6vw',
  },
  {
    maxEffectiveLength: 35,
    fontSizeClass: 'text-longsentence',
    fontWeightClass: 'font-semibold',
    subtextFontSizeClass: 'text-base md:text-lg',
    baseMin: 2.0,
    baseMax: 3.5,
    vwScale: '4.5vw',
  },
  {
    maxEffectiveLength: 75,
    fontSizeClass: 'text-sentence',
    fontWeightClass: 'font-medium',
    subtextFontSizeClass: 'text-sm md:text-base',
    baseMin: 1.5,
    baseMax: 2.25,
    vwScale: '3vw',
  },
  {
    maxEffectiveLength: Infinity,
    fontSizeClass: 'text-paragraph',
    fontWeightClass: 'font-medium',
    subtextFontSizeClass: 'text-sm md:text-base',
    baseMin: 1.25,
    baseMax: 1.75,
    vwScale: '2.25vw',
  },
];

function getEffectiveLength(targetLength: number, displayTextLength: number = 0): number {
  return targetLength + (displayTextLength > 0 ? displayTextLength * 0.35 : 0);
}

function getTier(length: number): FontTierConfig {
  return FONT_TIERS.find((tier) => length <= tier.maxEffectiveLength) ?? FONT_TIERS[FONT_TIERS.length - 1];
}

/**
 * Determines the target display CSS font size utility class based on character lengths.
 *
 * @param targetLength - Total length of the primary target Korean text.
 * @param displayTextLength - Length of the secondary translation or pronunciation text (if visible).
 * @returns Tailwind/CSS utility class name for font size.
 */
export function getTargetFontSizeClass(
  targetLength: number,
  displayTextLength: number = 0,
): string {
  return getTier(getEffectiveLength(targetLength, displayTextLength)).fontSizeClass;
}

/**
 * Determines the font weight class for the target display based on target length.
 *
 * @param targetLength - Length of primary target text.
 * @returns Tailwind font-weight class string.
 */
export function getTargetFontWeightClass(targetLength: number): string {
  return getTier(targetLength).fontWeightClass;
}

/**
 * Determines the subtitle/translation CSS font size class based on target length.
 *
 * @param targetLength - Length of primary target text.
 * @returns Subtitle CSS font size class string.
 */
export function getSubtextFontSizeClass(targetLength: number): string {
  return getTier(targetLength).subtextFontSizeClass;
}

/**
 * Computes an inline font-size style string enforcing user-configured minimum, maximum,
 * and locked font size bounds.
 *
 * @param targetLength - Length of primary target text.
 * @param displayTextLength - Length of secondary display text.
 * @param minFontSizeRem - User-configured minimum font size floor in rem (default: 1.25rem).
 * @param maxFontSizeRem - User-configured maximum font size ceiling in rem (default: 5.5rem).
 * @param lockFontSize - Whether font sizes are locked to a fixed size.
 * @returns Inline CSS font-size style string or empty string.
 */
export function getTargetFontSizeStyle(
  targetLength: number,
  displayTextLength: number = 0,
  minFontSizeRem: number = 1.25,
  maxFontSizeRem: number = 5.5,
  lockFontSize: boolean = false,
): string {
  if (lockFontSize) {
    return `font-size: ${minFontSizeRem}rem;`;
  }

  const isCustomMin = typeof minFontSizeRem === 'number' && minFontSizeRem > 1.25;
  const isCustomMax = typeof maxFontSizeRem === 'number' && maxFontSizeRem < 5.5;

  if (!isCustomMin && !isCustomMax) {
    return '';
  }

  const tier = getTier(getEffectiveLength(targetLength, displayTextLength));
  const effectiveMin = Math.max(minFontSizeRem, tier.baseMin);
  const effectiveMax = Math.min(maxFontSizeRem, tier.baseMax);

  if (effectiveMin >= effectiveMax) {
    return `font-size: ${effectiveMin}rem;`;
  }

  return `font-size: clamp(${effectiveMin}rem, ${tier.vwScale}, ${effectiveMax}rem);`;
}
