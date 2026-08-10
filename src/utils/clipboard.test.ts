import { describe, it, expect, beforeEach } from 'vitest';
import { getSelectedTargetText, handleTargetCopyEvent } from './clipboard';

describe('Clipboard Space Preservation DOM Tests', () => {
  const sampleSentence = '안녕하세요 저는 한국어를 배우고 있습니다';

  it('preserves spaces when full sentence is selected via indices', () => {
    const allIndices = Array.from({ length: sampleSentence.length }, (_, i) => i);
    const result = getSelectedTargetText(sampleSentence, allIndices);
    expect(result).toBe('안녕하세요 저는 한국어를 배우고 있습니다');
    expect(result?.split(' ').length).toBe(5);
  });

  it('preserves spaces for partial phrase selection', () => {
    const indices = [0, 1, 2, 3, 4, 5, 6, 7];
    const result = getSelectedTargetText(sampleSentence, indices);
    expect(result).toBe('안녕하세요 저는');
    expect(result).toContain(' ');
  });

  it('preserves leading space in selection', () => {
    const indices = [5, 6, 7];
    const result = getSelectedTargetText(sampleSentence, indices);
    expect(result).toBe(' 저는');
  });

  it('returns null when no indices are provided', () => {
    const result = getSelectedTargetText(sampleSentence, []);
    expect(result).toBeNull();
  });

  describe('DOM Selection & Copy Event Handler', () => {
    let targetWrapper: HTMLDivElement;

    beforeEach(() => {
      document.body.innerHTML = '';
      targetWrapper = document.createElement('div');
      targetWrapper.className = 'target-display';

      sampleSentence.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.setAttribute('data-target-index', String(i));
        span.textContent = char;
        targetWrapper.appendChild(span);
      });
      document.body.appendChild(targetWrapper);
    });

    it('populates clipboard with exact target text including spaces on selection copy', () => {
      const range = document.createRange();
      range.selectNodeContents(targetWrapper);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      let copiedText = '';
      let defaultPrevented = false;

      const fakeCopyEvent = {
        clipboardData: {
          setData: (_type: string, val: string) => {
            copiedText = val;
          }
        },
        preventDefault: () => {
          defaultPrevented = true;
        }
      } as unknown as ClipboardEvent;

      const handled = handleTargetCopyEvent(fakeCopyEvent, sampleSentence, selection);

      expect(handled).toBe(true);
      expect(defaultPrevented).toBe(true);
      expect(copiedText).toBe('안녕하세요 저는 한국어를 배우고 있습니다');
      expect(copiedText.split(' ').length).toBe(5);
    });
  });
});
