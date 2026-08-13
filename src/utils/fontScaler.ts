/**
 * Font Scaler Utility Module
 *
 * Provides functions for calculating character-length tiered CSS font-size
 * and font-weight classes for the Korean Typing Tutor target display.
 */

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
  const effectiveLength = targetLength + (displayTextLength > 0 ? displayTextLength * 0.35 : 0);

  if (effectiveLength <= 15) {
    return 'text-giant';
  } else if (effectiveLength <= 35) {
    return 'text-longsentence';
  } else if (effectiveLength <= 75) {
    return 'text-sentence';
  } else {
    return 'text-paragraph';
  }
}

/**
 * Determines the font weight class for the target display based on target length.
 *
 * @param targetLength - Length of primary target text.
 * @returns Tailwind font-weight class string.
 */
export function getTargetFontWeightClass(targetLength: number): string {
  if (targetLength <= 15) {
    return 'font-bold';
  } else if (targetLength <= 35) {
    return 'font-semibold';
  } else {
    return 'font-medium';
  }
}

/**
 * Determines the subtitle/translation CSS font size class based on target length.
 *
 * @param targetLength - Length of primary target text.
 * @returns Subtitle CSS font size class string.
 */
export function getSubtextFontSizeClass(targetLength: number): string {
  if (targetLength <= 15) {
    return 'text-subgiant';
  } else if (targetLength <= 35) {
    return 'text-base md:text-lg';
  } else {
    return 'text-sm md:text-base';
  }
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

  const effectiveLength = targetLength + (displayTextLength > 0 ? displayTextLength * 0.35 : 0);
  let baseMin: number;
  let baseMax: number;
  let vwScale: string;

  if (effectiveLength <= 15) {
    baseMin = 2.75;
    baseMax = 5.5;
    vwScale = '6vw';
  } else if (effectiveLength <= 35) {
    baseMin = 2.0;
    baseMax = 3.5;
    vwScale = '4.5vw';
  } else if (effectiveLength <= 75) {
    baseMin = 1.5;
    baseMax = 2.25;
    vwScale = '3vw';
  } else {
    baseMin = 1.25;
    baseMax = 1.75;
    vwScale = '2.25vw';
  }

  const effectiveMin = Math.max(minFontSizeRem, baseMin);
  const effectiveMax = Math.min(maxFontSizeRem, baseMax);

  if (effectiveMin >= effectiveMax) {
    return `font-size: ${effectiveMin}rem;`;
  }

  return `font-size: clamp(${effectiveMin}rem, ${vwScale}, ${effectiveMax}rem);`;
}
