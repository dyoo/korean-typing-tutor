/**
 * Clipboard helper module for space-preserving selection copying.
 */

/**
 * Handles copy events on any character-based display container (.target-display or .input-display).
 * Detects selected data-char spans and populates the clipboard with their exact string representation (preserving spaces).
 */
export function handleCopyEvent(
  e: ClipboardEvent,
  selection: Selection | null = typeof window !== 'undefined' ? window.getSelection() : null,
): boolean {
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return false;
  }

  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;
  const element =
    container.nodeType === Node.ELEMENT_NODE ? (container as HTMLElement) : container.parentElement;
  if (!element) {
    return false;
  }

  const wrapper = element.closest('.target-display, .input-display');
  if (!wrapper) {
    return false;
  }

  const spans = wrapper.querySelectorAll('[data-char]');
  const selectedChars: string[] = [];
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

    if (isSelected) {
      const charVal = span.getAttribute('data-char');
      if (charVal !== null) {
        selectedChars.push(charVal);
      }
    }
  });

  if (selectedChars.length > 0 && e.clipboardData) {
    e.clipboardData.setData('text/plain', selectedChars.join(''));
    e.preventDefault();
    return true;
  }

  return false;
}

/**
 * Backward-compatible wrapper for handleCopyEvent.
 */
export function handleTargetCopyEvent(e: ClipboardEvent, selection?: Selection | null): boolean {
  return handleCopyEvent(e, selection);
}
