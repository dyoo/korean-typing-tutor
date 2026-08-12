import { describe, it, expect, beforeEach } from 'vitest';
import { handleTargetCopyEvent, handleCopyEvent } from './clipboard';

describe('Clipboard Space Preservation DOM Tests', () => {
  const sampleSentence = '안녕하세요 저는 한국어를 배우고 있습니다';

  describe('DOM Selection & Copy Event Handler', () => {
    let targetWrapper: HTMLDivElement;

    beforeEach(() => {
      document.body.innerHTML = '';
      targetWrapper = document.createElement('div');
      targetWrapper.className = 'target-display';

      sampleSentence.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.setAttribute('data-target-index', String(i));
        span.setAttribute('data-char', char);
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
          },
        },
        preventDefault: () => {
          defaultPrevented = true;
        },
      } as unknown as ClipboardEvent;

      const handled = handleTargetCopyEvent(fakeCopyEvent, selection);

      expect(handled).toBe(true);
      expect(defaultPrevented).toBe(true);
      expect(copiedText).toBe('안녕하세요 저는 한국어를 배우고 있습니다');
      expect(copiedText.split(' ').length).toBe(5);
    });

    it('populates clipboard with exact typed input text including spaces on input-display selection copy', () => {
      const inputWrapper = document.createElement('div');
      inputWrapper.className = 'input-display';
      const typedText = '안녕 하세요';
      typedText.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.setAttribute('data-target-index', String(i));
        span.setAttribute('data-char', char);
        span.textContent = char;
        inputWrapper.appendChild(span);
      });
      document.body.appendChild(inputWrapper);

      const range = document.createRange();
      range.selectNodeContents(inputWrapper);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);

      let copiedText = '';
      let defaultPrevented = false;

      const fakeCopyEvent = {
        clipboardData: {
          setData: (_type: string, val: string) => {
            copiedText = val;
          },
        },
        preventDefault: () => {
          defaultPrevented = true;
        },
      } as unknown as ClipboardEvent;

      const handled = handleCopyEvent(fakeCopyEvent, selection);

      expect(handled).toBe(true);
      expect(defaultPrevented).toBe(true);
      expect(copiedText).toBe('안녕 하세요');
      expect(copiedText).toContain(' ');
    });
  });
});
