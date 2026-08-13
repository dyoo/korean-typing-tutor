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
 * Computes an inline font-size style override if minFontSizeRem exceeds default floor.
 *
 * @param targetLength - Length of primary target text.
 * @param displayTextLength - Length of secondary display text.
 * @param minFontSizeRem - User-configured minimum font size in rem (default: 1.25rem).
 * @returns Inline CSS font-size style string or empty string.
 */
export function getTargetFontSizeStyle(
  targetLength: number,
  displayTextLength: number = 0,
  minFontSizeRem: number = 1.25,
): string {
  if (!minFontSizeRem || minFontSizeRem <= 1.25) return '';

  const effectiveLength = targetLength + (displayTextLength > 0 ? displayTextLength * 0.35 : 0);
  let clampStr: string;
  if (effectiveLength <= 15) {
    clampStr = 'clamp(2.75rem, 6vw, 5.5rem)';
  } else if (effectiveLength <= 35) {
    clampStr = 'clamp(2rem, 4.5vw, 3.5rem)';
  } else if (effectiveLength <= 75) {
    clampStr = 'clamp(1.5rem, 3vw, 2.25rem)';
  } else {
    clampStr = 'clamp(1.25rem, 2.25vw, 1.75rem)';
  }

  return `font-size: max(${minFontSizeRem}rem, ${clampStr});`;
}
