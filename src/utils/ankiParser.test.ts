import { describe, it, expect } from 'vitest';
import {
  sanitizeFlashcardText,
  containsHangul,
  parseTextFlashcards,
  parseDeckFromFile,
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

    it('parses Evita Korean Vocabulary deck format with HTML formatting and audio tags', () => {
      const evitaDeckExport = `
#separator:tab
#html:true
#tags:Evita::Vocabulary
<div><span style="color: #2b6cb0; font-weight: bold;">가족</span></div>\tfamily\t[sound:evita_korean_0012.mp3]\t<div>우리 <b>가족</b>은 네 명이에요.</div>\tOur family has four members.
<div><span style="color: #2b6cb0; font-weight: bold;">가을</span></div>\tautumn, fall\t[sound:evita_korean_0015.mp3]\t<div><b>가을</b>에는 단풍이 아름답습니다.</div>\tIn autumn, the autumn leaves are beautiful.
<div><span style="color: #2b6cb0; font-weight: bold;">감기</span></div>\tcold, flu\t[sound:evita_korean_0023.mp3]\t<div><b>감기</b>에 걸려서 병원에 갔어요.</div>\tI caught a cold and went to the hospital.
`;
      const deck = parseTextFlashcards(evitaDeckExport, 'Evita_Korean_Vocabulary.txt');
      expect(deck.title).toBe('Evita Korean Vocabulary');
      expect(deck.itemCount).toBe(3);
      expect(deck.items[0].target).toBe('가족');
      expect(deck.items[0].translation).toBe('family');
      expect(deck.items[1].target).toBe('가을');
      expect(deck.items[1].translation).toBe('autumn, fall');
      expect(deck.items[2].target).toBe('감기');
      expect(deck.items[2].translation).toBe('cold, flu');
    });

    it('parses Talk To Me In Korean (TTMIK) multi-column lesson exports', () => {
      const ttmikExport = `
Level 1\tLesson 1\t안녕하세요\tHello / Hi / Good day\t안녕하세요! 저는 민수입니다.\tHello! I am Minsu.
Level 1\tLesson 2\t감사합니다\tThank you\t도와주셔서 감사합니다.\tThank you for helping me.
Level 1\tLesson 3\t죄송합니다\tI am sorry\t늦어서 죄송합니다.\tI am sorry for being late.
`;
      const deck = parseTextFlashcards(ttmikExport, 'TTMIK_Level_1_Vocabulary.tsv');
      expect(deck.itemCount).toBe(3);
      expect(deck.items[0].target).toBe('안녕하세요');
      expect(deck.items[0].translation).toBe('Level 1'); // Non-Hangul field
      expect(deck.items[1].target).toBe('감사합니다');
      expect(deck.items[2].target).toBe('죄송합니다');
    });

    it('parses Korean Grammar In Use (KGIU) dialogue cards with Hanja and brackets', () => {
      const kgiuExport = `
"도서관 (圖書館)","library","[명사] 책을 빌리는 곳","가: 어디에 가요? 나: 도서관에 가요."
"식당 (食堂)","restaurant","[명사] 밥을 먹는 곳","가: 점심 먹으러 식당에 가자."
"선생님 (先生님)","teacher","[명사] 학생을 가르치는 분","선생님께서 질문하셨다."
`;
      const deck = parseTextFlashcards(kgiuExport, 'KGIU_Beginning_Nouns.csv');
      expect(deck.itemCount).toBe(3);
      expect(deck.items[0].target).toBe('도서관 (圖書館)');
      expect(deck.items[0].translation).toBe('library');
      expect(deck.items[1].target).toBe('식당 (食堂)');
      expect(deck.items[1].translation).toBe('restaurant');
    });

    it('parses Retro 2000 Essential Korean Words format with cloze deletions', () => {
      const retroExport = `
{{c1::약속}}이 있어서 먼저 가볼게요.\tI have an appointment, so I will leave first.\t약속 (約束) [yak-sok]\tnoun
내일 친구를 {{c1::만나다}}.\tI meet a friend tomorrow.\t만나다 [man-na-da]\tverb
`;
      const deck = parseTextFlashcards(retroExport, 'Retro_2000_Essential.tsv');
      expect(deck.itemCount).toBe(2);
      expect(deck.items[0].target).toBe('약속이 있어서 먼저 가볼게요.');
      expect(deck.items[0].translation).toBe('I have an appointment, so I will leave first.');
      expect(deck.items[1].target).toBe('내일 친구를 만나다.');
      expect(deck.items[1].translation).toBe('I meet a friend tomorrow.');
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

    it('extracts and parses SQLite notes from a DEFLATE-compressed ZIP package', async () => {
      const fileName = 'collection.anki2';
      const fileNameBytes = new TextEncoder().encode(fileName);
      const rawDbContent = new TextEncoder().encode(
        'HeaderBlock\x00\x00행복\x1fhappiness\x1fhaengbok\x00\x00사랑\x1flove\x1fsarang\x00\x00FooterBlock',
      );

      // Compress dbContent using CompressionStream('deflate-raw')
      const cs = new CompressionStream('deflate-raw');
      const writer = cs.writable.getWriter();
      writer.write(rawDbContent);
      writer.close();
      const compressedBuffer = await new Response(cs.readable).arrayBuffer();
      const compressedBytes = new Uint8Array(compressedBuffer);

      // Construct ZIP Local File Header with DEFLATE (method 8)
      const zipBuffer = new ArrayBuffer(30 + fileNameBytes.length + compressedBytes.length);
      const view = new DataView(zipBuffer);
      const uint8 = new Uint8Array(zipBuffer);

      view.setUint32(0, 0x04034b50, true);
      view.setUint16(8, 8, true); // compressionMethod: 8 (deflate)
      view.setUint32(18, compressedBytes.length, true); // compressedSize
      view.setUint32(22, rawDbContent.length, true); // uncompressedSize
      view.setUint16(26, fileNameBytes.length, true); // fileNameLength
      view.setUint16(28, 0, true); // extraFieldLength

      uint8.set(fileNameBytes, 30);
      uint8.set(compressedBytes, 30 + fileNameBytes.length);

      const deck = await parseAnkiPackage(zipBuffer, 'Evita_Grammar_Sentences.apkg');
      expect(deck.title).toBe('Evita Grammar Sentences');
      expect(deck.itemCount).toBe(2);
      expect(deck.items[0].target).toBe('행복');
      expect(deck.items[0].translation).toBe('happiness');
      expect(deck.items[1].target).toBe('사랑');
      expect(deck.items[1].translation).toBe('love');
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
});
