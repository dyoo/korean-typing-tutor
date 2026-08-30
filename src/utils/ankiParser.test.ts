import { describe, it, expect } from 'vitest';
import {
  sanitizeFlashcardText,
  cleanKoreanTarget,
  isTypeableKoreanTarget,
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

  describe('cleanKoreanTarget', () => {
    it('strips parenthesized and bracketed Hanja glosses', () => {
      expect(cleanKoreanTarget('창문 (窓門)')).toBe('창문');
      expect(cleanKoreanTarget('학교 [學校]')).toBe('학교');
      expect(cleanKoreanTarget('도서관(圖書館)')).toBe('도서관');
      expect(cleanKoreanTarget('학생 (學生 / Student)')).toBe('학생');
    });

    it('strips English glosses and leading tildes', () => {
      expect(cleanKoreanTarget('(to eat) 먹다')).toBe('먹다');
      expect(cleanKoreanTarget('[Sino-Korean #12] 도시')).toBe('도시');
      expect(cleanKoreanTarget('~지 않다')).toBe('지 않다');
    });

    it('rejects grammar placeholder prefixes', () => {
      expect(cleanKoreanTarget('(noun)~')).toBe('');
      expect(cleanKoreanTarget('(V stem)~')).toBe('');
    });
  });

  describe('isTypeableKoreanTarget', () => {
    it('accepts genuine Hangul sentences and vocabulary', () => {
      expect(isTypeableKoreanTarget('안녕하세요')).toBe(true);
      expect(isTypeableKoreanTarget('창문')).toBe(true);
      expect(isTypeableKoreanTarget('밥을 먹었습니다.')).toBe(true);
    });

    it('rejects targets containing untypeable Hanja or foreign CJK characters', () => {
      expect(isTypeableKoreanTarget('창문 (窓門)')).toBe(false);
      expect(isTypeableKoreanTarget('窓門')).toBe(false);
      expect(isTypeableKoreanTarget('학교 學校')).toBe(false);
      expect(isTypeableKoreanTarget('日本語と한국어')).toBe(false);
    });

    it('rejects English quiz instructions and prompts', () => {
      expect(isTypeableKoreanTarget('Conjugate the verb 먹다')).toBe(false);
      expect(isTypeableKoreanTarget('(noun) placeholder')).toBe(false);
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
      expect(deck.items[0].translation).toBe('Hello / Hi / Good day');
      expect(deck.items[1].target).toBe('감사합니다');
      expect(deck.items[1].translation).toBe('Thank you');
      expect(deck.items[2].target).toBe('죄송합니다');
      expect(deck.items[2].translation).toBe('I am sorry');
    });

    it('parses Korean Grammar In Use (KGIU) dialogue cards with Hanja and brackets', () => {
      const kgiuExport = `
"도서관 (圖書館)","library","[명사] 책을 빌리는 곳","가: 어디에 가요? 나: 도서관에 가요."
"식당 (食堂)","restaurant","[명사] 밥을 먹는 곳","가: 점심 먹으러 식당에 가자."
"선생님 (先生님)","teacher","[명사] 학생을 가르치는 분","선생님께서 질문하셨다."
`;
      const deck = parseTextFlashcards(kgiuExport, 'KGIU_Beginning_Nouns.csv');
      expect(deck.itemCount).toBe(3);
      expect(deck.items[0].target).toBe('도서관');
      expect(deck.items[0].translation).toBe('library');
      expect(deck.items[1].target).toBe('식당');
      expect(deck.items[1].translation).toBe('restaurant');
      expect(deck.items[2].target).toBe('선생님');
      expect(deck.items[2].translation).toBe('teacher');
    });

    it('parses Korean Core 5k deck format with dictionary links and example sentences', () => {
      const core5kExport = `
시간\ttime, hour\t[sound:core5k_001.mp3]\t時間\tnoun\thttps://korean.dict.naver.com\t지금 몇 시예요?\tWhat time is it now?
사람\tperson, human\t[sound:core5k_002.mp3]\t\tnoun\thttps://korean.dict.naver.com\t착한 사람이에요.\tHe is a good person.
`;
      const deck = parseTextFlashcards(core5kExport, 'Korean_Core_5000.tsv');
      expect(deck.itemCount).toBe(2);
      expect(deck.items[0].target).toBe('시간');
      expect(deck.items[0].translation).toBe('time, hour');
      expect(deck.items[1].target).toBe('사람');
      expect(deck.items[1].translation).toBe('person, human');
    });

    it('parses TTMIK First 500 Korean Words format with images and pronunciation fields', () => {
      const ttmik500Export = `
물\twater\t[mul]\t[sound:ttmik_water.mp3]\t<img src="water_glass.jpg" />
밥\trice, meal\t[bap]\t[sound:ttmik_rice.mp3]\t<img src="rice_bowl.jpg" />
`;
      const deck = parseTextFlashcards(ttmik500Export, 'TTMIK_First_500_Words.tsv');
      expect(deck.itemCount).toBe(2);
      expect(deck.items[0].target).toBe('물');
      expect(deck.items[0].translation).toBe('water');
      expect(deck.items[1].target).toBe('밥');
      expect(deck.items[1].translation).toBe('rice, meal');
    });

    it('parses Joseph 11K Korean Deck format with frequency rankings and Hanja', () => {
      const joseph11kExport = `
기억하다\tto remember\t記憶하다\t142\tverb
생각하다\tto think\t生覺하다\t85\tverb
`;
      const deck = parseTextFlashcards(joseph11kExport, 'Joseph_11k_Korean.tsv');
      expect(deck.itemCount).toBe(2);
      expect(deck.items[0].target).toBe('기억하다');
      expect(deck.items[0].translation).toBe('to remember');
      expect(deck.items[1].target).toBe('생각하다');
      expect(deck.items[1].translation).toBe('to think');
    });

    it('filters out untypeable grammar formulas and English quiz instructions', () => {
      const grammarTsv = `
일 [Sino-Korean #]\tone\t[il]
먹다 (to eat)\tto eat\t[meok-da]
(noun)~은\t[eun]\ttopic particle
(V stem)~ㄹ 수 있다 Sample: 볼 수 있다 can\tcan do\tgrammar formula
Conjugate using which ending? • present tense • verb stem ending in "하다"\t[yeo-yo]\tquiz
Location marking particle "~에" has two primary roles:\tlocation at/in\tgrammar explanation
~지 않다\tdo not\tnegative verb ending
`;
      const deck = parseTextFlashcards(grammarTsv, 'TTMIK_Grammar_Patterns.tsv');
      expect(deck.itemCount).toBe(3);
      expect(deck.items[0].target).toBe('일');
      expect(deck.items[0].translation).toBe('one');
      expect(deck.items[1].target).toBe('먹다');
      expect(deck.items[1].translation).toBe('to eat');
      expect(deck.items[2].target).toBe('지 않다');
      expect(deck.items[2].translation).toBe('do not');
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

    it('extracts correct English translation when cards contain index codes, audio tags, and Hanja', async () => {
      const fileName = 'collection.anki2';
      const fileNameBytes = new TextEncoder().encode(fileName);
      // Realistic note chunk matching 2000 Essential format with SQLite binary prefix on field 0
      const dbContent = new TextEncoder().encode(
        'HeaderBlock\x00\x00e\x84hR\x92b1_0\x1f가족\x1f\x1ffamily\x1f\x1f[sound:1_0_가족.mp3]\x1f家族\x1fnoun\x00\x00FooterBlock',
      );

      const zipBuffer = new ArrayBuffer(30 + fileNameBytes.length + dbContent.length);
      const view = new DataView(zipBuffer);
      const uint8 = new Uint8Array(zipBuffer);

      view.setUint32(0, 0x04034b50, true);
      view.setUint16(8, 0, true);
      view.setUint32(18, dbContent.length, true);
      view.setUint32(22, dbContent.length, true);
      view.setUint16(26, fileNameBytes.length, true);
      view.setUint16(28, 0, true);

      uint8.set(fileNameBytes, 30);
      uint8.set(dbContent, 30 + fileNameBytes.length);

      const deck = await parseAnkiPackage(zipBuffer, '2000_Essential.apkg');
      expect(deck.itemCount).toBe(1);
      expect(deck.items[0].target).toBe('가족');
      expect(deck.items[0].translation).toBe('family');
      expect(deck.items[0].pronunciation).toBe('gajok');
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
      const file = new File(['사과\tapple\n우유\tmilk'], 'food.tsv', {
        type: 'text/tab-separated-values',
      });
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
