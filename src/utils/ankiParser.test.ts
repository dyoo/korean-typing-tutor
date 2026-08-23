import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sanitizeFlashcardText,
  containsHangul,
  parseTextFlashcards,
  parseDeckFromFile,
  parseDeckFromUrl,
  parseAnkiPackage,
} from './ankiParser';

describe('Anki and Flashcard Parser Engine', () => {
  describe('sanitizeFlashcardText', () => {
    it('strips HTML tags and unescapes entities', () => {
      const raw = '<div><b>안녕하세요</b> &amp; 반갑습니다&nbsp;!</div>';
      expect(sanitizeFlashcardText(raw)).toBe('안녕하세요 & 반갑습니다 !');
    });

    it('cleans cloze deletion tags', () => {
      const cloze = '나는 {{c1::한국어::language}}를 공부합니다.';
      expect(sanitizeFlashcardText(cloze)).toBe('나는 한국어를 공부합니다.');
    });

    it('strips sound tags', () => {
      const withSound = '사과 [sound:apple_korean.mp3]';
      expect(sanitizeFlashcardText(withSound)).toBe('사과');
    });

    it('strips outer wrapping quotes and trims whitespace', () => {
      expect(sanitizeFlashcardText('  " 고양이 " ')).toBe('고양이');
      expect(sanitizeFlashcardText(" '강아지' ")).toBe('강아지');
    });
  });

  describe('containsHangul', () => {
    it('detects Korean syllables, Jamos, and mixed text', () => {
      expect(containsHangul('한국어')).toBe(true);
      expect(containsHangul('Hello 한국')).toBe(true);
      expect(containsHangul('ㄱㄴㄷ')).toBe(true);
      expect(containsHangul('English only 123')).toBe(false);
      expect(containsHangul('')).toBe(false);
    });
  });

  describe('parseTextFlashcards', () => {
    it('parses tab-separated (TSV) flashcards', () => {
      const tsv = `
#separator:tab
#html:true
사과\tapple
학교\tschool
바나나\tbanana
`;
      const deck = parseTextFlashcards(tsv, 'TopikVocab.tsv');
      expect(deck.title).toBe('TopikVocab');
      expect(deck.itemCount).toBe(3);
      expect(deck.items[0]).toMatchObject({
        target: '사과',
        translation: 'apple',
        pronunciation: 'sagwa',
      });
      expect(deck.items[1]).toMatchObject({
        target: '학교',
        translation: 'school',
      });
    });

    it('parses comma-separated (CSV) flashcards and auto-detects reverse column order', () => {
      const csv = `
"cat","고양이"
"dog","강아지"
`;
      const deck = parseTextFlashcards(csv, 'Animals.csv');
      expect(deck.itemCount).toBe(2);
      expect(deck.items[0].target).toBe('고양이');
      expect(deck.items[0].translation).toBe('cat');
      expect(deck.items[1].target).toBe('강아지');
      expect(deck.items[1].translation).toBe('dog');
    });

    it('filters out non-Korean lines and deduplicates targets', () => {
      const text = `
apple\tfruit
사과\tapple
사과\tapple (duplicate)
water\t물
`;
      const deck = parseTextFlashcards(text, 'Mixed.txt');
      expect(deck.itemCount).toBe(2);
      expect(deck.items.map((i) => i.target)).toEqual(['사과', '물']);
    });
  });

  describe('parseAnkiPackage (.apkg)', () => {
    it('extracts and parses SQLite notes from an uncompressed in-memory ZIP package', async () => {
      // Create an uncompressed in-memory ZIP containing "collection.anki2"
      const fileName = 'collection.anki2';
      const fileNameBytes = new TextEncoder().encode(fileName);
      const dbContent = new TextEncoder().encode(
        'HeaderBlock\x00\x00사과\x1fapple\x1fsagwa\x00\x00바다\x1focean\x1fbada\x00\x00FooterBlock',
      );

      // Construct ZIP Local File Header (30 bytes + name + content)
      const zipBuffer = new ArrayBuffer(30 + fileNameBytes.length + dbContent.length);
      const view = new DataView(zipBuffer);
      const uint8 = new Uint8Array(zipBuffer);

      // Signature PK\x03\x04
      view.setUint32(0, 0x04034b50, true);
      view.setUint16(8, 0, true); // compressionMethod: 0 (store)
      view.setUint32(18, dbContent.length, true); // compressedSize
      view.setUint32(22, dbContent.length, true); // uncompressedSize
      view.setUint16(26, fileNameBytes.length, true); // fileNameLength
      view.setUint16(28, 0, true); // extraFieldLength

      uint8.set(fileNameBytes, 30);
      uint8.set(dbContent, 30 + fileNameBytes.length);

      const deck = await parseAnkiPackage(zipBuffer, 'KoreanCore.apkg');
      expect(deck.title).toBe('KoreanCore');
      expect(deck.itemCount).toBe(2);
      expect(deck.items[0].target).toBe('사과');
      expect(deck.items[0].translation).toBe('apple');
      expect(deck.items[1].target).toBe('바다');
      expect(deck.items[1].translation).toBe('ocean');
    });

    it('throws informative error if collection database is missing from ZIP', async () => {
      const emptyBuffer = new ArrayBuffer(30);
      await expect(parseAnkiPackage(emptyBuffer, 'corrupted.apkg')).rejects.toThrow(
        /collection database not found/i,
      );
    });
  });

  describe('parseDeckFromFile', () => {
    it('parses File object correctly', async () => {
      const file = new File(['사과\tapple\n우유\tmilk'], 'food.tsv', { type: 'text/tab-separated-values' });
      const deck = await parseDeckFromFile(file);
      expect(deck.itemCount).toBe(2);
      expect(deck.items[0].target).toBe('사과');
    });

    it('throws error if file contains no Hangul', async () => {
      const file = new File(['hello\tworld'], 'english.tsv', { type: 'text/plain' });
      await expect(parseDeckFromFile(file)).rejects.toThrow(/no valid korean flashcards/i);
    });
  });

  describe('parseDeckFromUrl', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('fetches and parses remote TSV file from URL', async () => {
      const mockTsv = '컴퓨터\tcomputer\n마우스\tmouse';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => mockTsv,
      } as Response);

      const deck = await parseDeckFromUrl('https://example.com/decks/technology.tsv');
      expect(deck.title).toBe('technology');
      expect(deck.itemCount).toBe(2);
      expect(deck.items[0].target).toBe('컴퓨터');
    });

    it('throws error for invalid URL protocol', async () => {
      await expect(parseDeckFromUrl('ftp://invalid.url')).rejects.toThrow(/invalid url/i);
    });

    it('throws error when server returns non-200 HTTP status', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      await expect(parseDeckFromUrl('https://example.com/missing.tsv')).rejects.toThrow(
        /server returned http 404/i,
      );
    });
  });
});
