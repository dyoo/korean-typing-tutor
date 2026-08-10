/**
 * Clipboard helper module for space-preserving selection copying.
 */

/**
 * Given the target string and selected character indices,
 * returns the exact substring slice preserving all U+0020 spaces and character fidelity.
 */
export function getSelectedTargetText(
  targetString: string,
  indices: number[]
): string | null {
  if (indices.length === 0) return null;
  const minIdx = Math.min(...indices);
  const maxIdx = Math.max(...indices);
  return targetString.slice(minIdx, maxIdx + 1);
}

/**
 * Handles copy events on the target display.
 * Detects selected data-target-index spans and populates the clipboard with the exact target text slice.
 */
export function handleTargetCopyEvent(
  e: ClipboardEvent,
  targetString: string,
  selection: Selection | null
): boolean {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return false;

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element = container.nodeType === Node.ELEMENT_NODE ? (container as HTMLElement) : container.parentElement;
  if (!element) return false;

  const targetWrapper = element.closest('.target-display');
  if (!targetWrapper) return false;

  const spans = targetWrapper.querySelectorAll('[data-target-index]');
  const indices: number[] = [];
  spans.forEach((span) => {
    let isSelected = false;
    try {
      if (typeof selection.containsNode === 'function') {
        isSelected = selection.containsNode(span, true);
      }
    } catch {
      isSelected = false;
    }

    if (!isSelected && range) {
      try {
        if (typeof range.intersectsNode === 'function') {
          isSelected = range.intersectsNode(span);
        }
      } catch {
        isSelected = false;
      }
    }

    if (!isSelected && range) {
      isSelected = (
        span === range.startContainer ||
        span === range.endContainer ||
        span.contains(range.startContainer) ||
        span.contains(range.endContainer) ||
        range.commonAncestorContainer.contains(span)
      );
    }

    if (isSelected) {
      const idxStr = span.getAttribute('data-target-index');
      if (idxStr !== null) {
        indices.push(parseInt(idxStr, 10));
      }
    }
  });

  const textToCopy = getSelectedTargetText(targetString, indices);
  if (textToCopy && e.clipboardData) {
    e.clipboardData.setData('text/plain', textToCopy);
    e.preventDefault();
    return true;
  }

  return false;
}
