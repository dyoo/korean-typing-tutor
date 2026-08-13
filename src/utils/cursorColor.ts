export type CursorColorMode = 'amber' | 'sky' | 'emerald' | 'blue';

/**
 * Returns Tailwind CSS background color utility classes for the cursor based on the selected mode.
 *
 * @param cursorColor - Selected cursor color mode ('amber' | 'sky' | 'emerald' | 'blue').
 * @returns Tailwind CSS background class string.
 */
export function getCursorColorClass(cursorColor: CursorColorMode = 'amber'): string {
  switch (cursorColor) {
    case 'sky':
      return 'bg-sky-400 dark:bg-sky-300';
    case 'emerald':
      return 'bg-emerald-600 dark:bg-emerald-400';
    case 'blue':
      return 'bg-blue-600 dark:bg-blue-500';
    case 'amber':
    default:
      return 'bg-amber-500 dark:bg-amber-400';
  }
}
