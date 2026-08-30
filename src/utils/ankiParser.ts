import { romanize } from './romanizer';
import type { LessonItem } from '../types/korean';
import type { CustomDeck } from '../types/customDecks';

/** Regular expression matching any Korean Hangul syllables, Jamos, or compatibility characters. */
const HANGUL_REGEX = /[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/;

/**
 * Checks if a string contains any Korean Hangul characters.
 */
export function containsHangul(text: string): boolean {
  return HANGUL_REGEX.test(text);
}

/**
 * Cleans and sanitizes raw flashcard field text by stripping HTML tags,
 * unescaping HTML entities, removing cloze deletion markup, and trimming sound tags.
 */
export function sanitizeFlashcardText(raw: string): string {
  if (!raw) {
    return '';
  }

  let text = raw;

  // Remove sound tags: [sound:filename.mp3]
  text = text.replace(/\[sound:[^\]]+\]/gi, '');

  // Remove cloze deletions: {{c1::answer::hint}} -> answer, {{c1::answer}} -> answer
  text = text.replace(/\{\{c\d+::([^:}]+)(?:::([^}]+))?\}\}/g, '$1');

  // Replace line break tags with spaces
  text = text.replace(/<(br|p|div|tr)[^>]*>/gi, ' ');

  // Strip all other HTML tags: <b>, <i>, <span>, etc.
  text = text.replace(/<[^>]+>/g, '');

  // Unescape standard HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'");

  // Collapse multiple whitespace characters into single spaces
  text = text.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ');

  // Strip non-printable ASCII / SQLite binary noise characters from edges
  text = text
    .replace(/^[^\x20-\x7E\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F\u4E00-\u9FFF]+/, '')
    .trim();

  // Strip wrapping quotation marks if present
  if (
    (text.startsWith('"') && text.endsWith('"') && text.length >= 2) ||
    (text.startsWith("'") && text.endsWith("'") && text.length >= 2)
  ) {
    text = text.slice(1, -1).trim();
  }

  return text;
}

/**
 * Cleans grammar metadata, English placeholder annotations, bracketed notes, and leading tildes.
 */
export function cleanKoreanTarget(raw: string): string {
  if (!raw) {
    return '';
  }
  let target = raw.trim();

  // If the target starts with a grammar placeholder like (noun)~ or (V stem)~, reject it
  if (
    /^\((?:noun|verb|v stem|a\/v|adj|adjective|object|subject|place|v|n|a)\)\s*~?/i.test(target)
  ) {
    return '';
  }

  // Strip parenthesized / bracketed glosses containing Hanja (e.g. "(先生님)", "[圖書館]", "(漢字/한자)")
  target = target.replace(
    /\[[^[\]]*[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF][^[\]]*\]/g,
    '',
  );
  target = target.replace(
    /\([^()]*[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF][^()]*\)/g,
    '',
  );
  target = target.replace(
    /\{[^{}]*[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF][^{}]*\}/g,
    '',
  );

  // Strip trailing or embedded parenthesized / bracketed non-Hangul glosses (e.g. "[Sino-Korean #]", "(to eat)", "[polite]")
  target = target.replace(/\[[^[\]\uAC00-\uD7A3\u3131-\u318E]*\]/g, '');
  target = target.replace(/\([^()\uAC00-\uD7A3\u3131-\u318E]*\)/g, '');
  target = target.replace(/\{[^{}\uAC00-\uD7A3\u3131-\u318E]*\}/g, '');

  // Strip leading tilde affixes (e.g. "~지 않다" -> "지 않다")
  target = target.replace(/^~+\s*/, '');

  target = target.replace(/\s{2,}/g, ' ').trim();
  return target;
}

/**
 * Validates whether a candidate target string is a genuine, typeable Korean typing exercise.
 * Filters out English quiz prompts, questions with English instructions, and detached Jamos.
 */
export function isTypeableKoreanTarget(target: string): boolean {
  if (!target || target.length < 1 || target.length > 120) {
    return false;
  }

  // Must contain at least one complete composable Hangul syllable
  const hangulSyllables = target.match(/[\uAC00-\uD7A3]/g) || [];
  if (hangulSyllables.length === 0) {
    return false;
  }

  // Reject untypeable Hanja (CJK Ideographs) and Japanese Kana
  if (
    /[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF\u3040-\u309F\u30A0-\u30FF]/.test(target)
  ) {
    return false;
  }

  // Count Latin letters vs Hangul syllables
  const latinLetters = target.match(/[a-zA-Z]/g) || [];
  if (latinLetters.length > hangulSyllables.length) {
    return false;
  }

  // Reject placeholder grammar patterns like (noun)~, (verb)~, (V stem)~, (A/V)~
  if (
    /^\((?:noun|verb|v stem|a\/v|adj|adjective|object|subject|place|v|n|a)\)/i.test(target) ||
    /\b(?:v stem|noun stem)\b/i.test(target)
  ) {
    return false;
  }

  // Reject English grammar prompt instructions and quiz questions
  if (
    /(?:conjugate|tense|verb stem|noun stem|placeholder|marking particle|indicates a placeholder|sample:|sentence structure)/i.test(
      target,
    )
  ) {
    return false;
  }

  // Reject bullet prompt lists containing English
  if (target.includes('•') && latinLetters.length > 0) {
    return false;
  }

  // Reject floating Jamo affixes at start (e.g. ~ㄹ, ~ㄴ, ㄹ 수 있다)
  if (/^[~]?[\u3131-\u318E\u1100-\u11FF]/.test(target)) {
    return false;
  }

  return true;
}

/**
 * Validates if a field candidate looks like an English translation or definition,
 * filtering out URLs, Hangul text, audio IDs, numeric indexes, and bare POS tags.
 */
function isUsefulTranslation(text: string): boolean {
  if (!text || containsHangul(text)) {
    return false;
  }
  if (text.startsWith('http://') || text.startsWith('https://')) {
    return false;
  }
  // Exclude single index/ID codes like "b1_0", "1_0", "ehRb1_0", "123"
  if (/^[a-zA-Z0-9_.-]{1,15}$/.test(text) && /\d/.test(text)) {
    return false;
  }
  if (/^(noun|verb|adjective|adverb|pronoun|particle|interjection|affix)$/i.test(text)) {
    return false;
  }
  return /[a-zA-Z]/.test(text);
}

/**
 * Selects the best English translation from note fields, scanning fields after the target first.
 */
function findBestTranslation(fields: string[], targetIndex: number): string | null {
  // First, check fields after target (where translation usually resides)
  for (let i = targetIndex + 1; i < fields.length; i++) {
    if (isUsefulTranslation(fields[i])) {
      return fields[i];
    }
  }
  // Then check fields before target (for English -> Korean reverse decks)
  for (let i = 0; i < targetIndex; i++) {
    if (isUsefulTranslation(fields[i])) {
      return fields[i];
    }
  }
  return null;
}

/**
 * Parses raw text lines (from TSV, CSV, or Anki plain text note exports).
 */
export function parseTextFlashcards(
  content: string,
  filename: string = 'Custom Deck',
  deckId?: string,
): CustomDeck {
  const generatedId =
    deckId ?? `custom_deck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const title =
    filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim() || 'Custom Flashcards';

  const lines = content.split(/\r?\n/);
  const items: LessonItem[] = [];
  const seenTargets = new Set<string>();

  let delimiter: string | null = null;

  // Check for Anki #separator comment
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('#separator:')) {
      const sepValue = trimmed.slice(11).trim().toLowerCase();
      if (sepValue === 'tab') {
        delimiter = '\t';
      } else if (sepValue === 'comma') {
        delimiter = ',';
      } else if (sepValue === 'semicolon') {
        delimiter = ';';
      } else if (sepValue === 'pipe') {
        delimiter = '|';
      }
      break;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine || rawLine.startsWith('#')) {
      continue; // Skip comments and empty lines
    }

    // Auto-detect delimiter if not specified
    const lineDelimiter =
      delimiter ?? (rawLine.includes('\t') ? '\t' : rawLine.includes(';') ? ';' : ',');
    const rawFields = rawLine.split(lineDelimiter);
    if (rawFields.length < 1) {
      continue;
    }

    const fields = rawFields.map(sanitizeFlashcardText).filter((f) => f.length > 0);
    if (fields.length === 0) {
      continue;
    }

    // Identify which field is Korean (target) vs translation
    const hangulIndices: number[] = [];
    for (let f = 0; f < fields.length; f++) {
      if (containsHangul(fields[f])) {
        hangulIndices.push(f);
      }
    }

    if (hangulIndices.length === 0) {
      continue; // No Korean in this card
    }

    // First Hangul field is target
    const targetIndex = hangulIndices[0];
    const rawTarget = fields[targetIndex];
    const target = cleanKoreanTarget(rawTarget);

    if (!isTypeableKoreanTarget(target)) {
      continue;
    }

    const translation = findBestTranslation(fields, targetIndex);

    // Deduplicate by target string
    if (!target || seenTargets.has(target)) {
      continue;
    }
    seenTargets.add(target);

    const pronunciation = romanize(target);

    items.push({
      id: `${generatedId}_item_${items.length + 1}`,
      moduleId: generatedId,
      target,
      translation: translation || null,
      pronunciation,
    });
  }

  return {
    id: generatedId,
    title,
    filename,
    itemCount: items.length,
    importedAt: Date.now(),
    items,
  };
}

/**
 * Extracts a named file from a ZIP archive ArrayBuffer using native DecompressionStream.
 */
async function extractFileFromZip(
  zipBuffer: ArrayBuffer,
  targetFileNameRegex: RegExp,
): Promise<Uint8Array | null> {
  const bytes = new Uint8Array(zipBuffer);
  const dataView = new DataView(zipBuffer);
  let offset = 0;

  while (offset < bytes.length - 30) {
    // Check Local File Header signature 0x04034b50 ("PK\x03\x04")
    if (
      bytes[offset] === 0x50 &&
      bytes[offset + 1] === 0x4b &&
      bytes[offset + 2] === 0x03 &&
      bytes[offset + 3] === 0x04
    ) {
      const compressionMethod = dataView.getUint16(offset + 8, true);
      const compressedSize = dataView.getUint32(offset + 18, true);
      const fileNameLength = dataView.getUint16(offset + 26, true);
      const extraFieldLength = dataView.getUint16(offset + 28, true);

      const fileNameBytes = bytes.subarray(offset + 30, offset + 30 + fileNameLength);
      const fileName = new TextDecoder('utf-8').decode(fileNameBytes);

      const fileDataStart = offset + 30 + fileNameLength + extraFieldLength;
      const fileDataEnd = fileDataStart + compressedSize;

      if (targetFileNameRegex.test(fileName)) {
        const compressedData = bytes.subarray(fileDataStart, fileDataEnd);

        if (compressionMethod === 0) {
          // Stored uncompressed
          return compressedData;
        } else if (compressionMethod === 8) {
          // DEFLATE compressed: decompress using DecompressionStream
          try {
            const ds = new DecompressionStream('deflate-raw');
            const stream = new Response(compressedData).body?.pipeThrough(ds);
            if (stream) {
              const decompressedBuffer = await new Response(stream).arrayBuffer();
              return new Uint8Array(decompressedBuffer);
            }
          } catch (e) {
            console.warn('[AnkiParser] DecompressionStream error, falling back:', e);
          }
        }
      }

      offset = fileDataEnd;
    } else {
      offset += 1;
    }
  }

  return null;
}

/**
 * Decodes a SQLite 3 variable-length integer (varint) from a Uint8Array buffer.
 */
function readVarint(bytes: Uint8Array, offset: number): { value: number; bytesRead: number } {
  let result = 0;
  let bytesRead = 0;
  for (let i = 0; i < 9; i++) {
    if (offset + i >= bytes.length) {
      break;
    }
    const byte = bytes[offset + i];
    bytesRead++;
    if (i === 8) {
      result = (result << 8) | byte;
      break;
    }
    result = (result << 7) | (byte & 0x7f);
    if ((byte & 0x80) === 0) {
      break;
    }
  }
  return { value: result, bytesRead };
}

/**
 * Extracts note `flds` strings directly from SQLite 3 B-Tree leaf table pages.
 */
function extractSqliteNotes(dbBytes: Uint8Array): string[] {
  if (dbBytes.length < 100) {
    return [];
  }
  const pageSize = (dbBytes[16] << 8) | dbBytes[17] || 4096;
  const numPages = Math.floor(dbBytes.length / pageSize);
  const notesFlds: string[] = [];

  for (let p = 0; p < numPages; p++) {
    const pageOffset = p * pageSize;
    const headerOffset = p === 0 ? 100 : 0;
    if (pageOffset + headerOffset + 8 > dbBytes.length) {
      continue;
    }
    const pageType = dbBytes[pageOffset + headerOffset];

    // Leaf table B-tree page flag is 0x0D (13)
    if (pageType !== 0x0d) {
      continue;
    }

    const cellCount =
      (dbBytes[pageOffset + headerOffset + 3] << 8) | dbBytes[pageOffset + headerOffset + 4];
    const cellPointersOffset = pageOffset + headerOffset + 8;

    for (let c = 0; c < cellCount; c++) {
      if (cellPointersOffset + c * 2 + 1 >= dbBytes.length) {
        continue;
      }
      const cellPtr =
        (dbBytes[cellPointersOffset + c * 2] << 8) | dbBytes[cellPointersOffset + c * 2 + 1];
      let cellOffset = pageOffset + cellPtr;

      if (cellOffset >= dbBytes.length) {
        continue;
      }

      // 1. Read payload length
      const vPayload = readVarint(dbBytes, cellOffset);
      cellOffset += vPayload.bytesRead;

      // 2. Read rowid
      const vRowId = readVarint(dbBytes, cellOffset);
      cellOffset += vRowId.bytesRead;

      // 3. Read record header length
      const recordStart = cellOffset;
      const vHeaderLen = readVarint(dbBytes, cellOffset);
      cellOffset += vHeaderLen.bytesRead;
      const headerEnd = recordStart + vHeaderLen.value;

      // 4. Read serial types for columns
      const serialTypes: number[] = [];
      while (cellOffset < headerEnd && cellOffset < dbBytes.length) {
        const vSerial = readVarint(dbBytes, cellOffset);
        cellOffset += vSerial.bytesRead;
        serialTypes.push(vSerial.value);
      }

      // 5. Read column values
      let bodyOffset = headerEnd;
      for (const st of serialTypes) {
        if (st >= 13 && st % 2 === 1) {
          const strLen = (st - 13) / 2;
          if (strLen > 0 && bodyOffset + strLen <= dbBytes.length) {
            const strBytes = dbBytes.subarray(bodyOffset, bodyOffset + strLen);
            // In Anki's notes table, the `flds` column contains unit separator 0x1f
            if (strBytes.includes(0x1f)) {
              const str = new TextDecoder('utf-8', { fatal: false }).decode(strBytes);
              notesFlds.push(str);
            }
          }
          bodyOffset += strLen;
        } else if (st >= 12 && st % 2 === 0) {
          bodyOffset += (st - 12) / 2;
        } else if (st >= 1 && st <= 4) {
          bodyOffset += st;
        } else if (st === 5) {
          bodyOffset += 6;
        } else if (st === 6 || st === 7) {
          bodyOffset += 8;
        }
      }
    }
  }

  return notesFlds;
}

/**
 * Parses an Anki `.apkg` binary package buffer.
 */
export async function parseAnkiPackage(
  buffer: ArrayBuffer,
  filename: string = 'Anki Deck.apkg',
  deckId?: string,
): Promise<CustomDeck> {
  const generatedId =
    deckId ?? `custom_deck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const title =
    filename
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim() || 'Anki Deck';

  // 1. Extract collection.anki2 or collection.anki21 database file from ZIP
  const dbBytes = await extractFileFromZip(buffer, /collection\.anki2(1b?)?$/i);
  if (!dbBytes) {
    throw new Error('Invalid Anki package (.apkg): collection database not found inside archive.');
  }

  // 2. Extract note fields directly from SQLite records
  let noteChunks = extractSqliteNotes(dbBytes);

  // Fallback: if database is not structured with standard SQLite B-tree pages, scan by unit separator
  if (noteChunks.length === 0) {
    const rawText = new TextDecoder('utf-8', { fatal: false }).decode(dbBytes);
    // eslint-disable-next-line no-control-regex
    noteChunks = rawText.split(/(?:[\x00-\x08\x0e-\x1e]+)/).filter((c) => c.includes('\x1f'));
  }

  const items: LessonItem[] = [];
  const seenTargets = new Set<string>();

  for (const chunk of noteChunks) {
    if (!chunk.includes('\x1f')) {
      continue;
    }

    const rawFields = chunk.split('\x1f');
    const fields = rawFields.map(sanitizeFlashcardText).filter((f) => f.length > 0);
    if (fields.length === 0) {
      continue;
    }

    // Find Hangul fields
    const hangulIndices: number[] = [];
    for (let f = 0; f < fields.length; f++) {
      if (containsHangul(fields[f])) {
        hangulIndices.push(f);
      }
    }

    if (hangulIndices.length === 0) {
      continue;
    }

    const targetIndex = hangulIndices[0];
    const rawTarget = fields[targetIndex];
    const target = cleanKoreanTarget(rawTarget);

    // Filter out long database artifacts / SQL strings or non-typeable targets
    if (
      target.length > 80 ||
      target.includes('CREATE TABLE') ||
      target.includes('INSERT INTO') ||
      !isTypeableKoreanTarget(target)
    ) {
      continue;
    }

    const translation = findBestTranslation(fields, targetIndex);

    if (!target || seenTargets.has(target)) {
      continue;
    }
    seenTargets.add(target);

    const pronunciation = romanize(target);

    items.push({
      id: `${generatedId}_item_${items.length + 1}`,
      moduleId: generatedId,
      target,
      translation: translation || null,
      pronunciation,
    });
  }

  if (items.length === 0) {
    throw new Error('No valid Korean flashcard items found in this Anki package.');
  }

  return {
    id: generatedId,
    title,
    filename,
    itemCount: items.length,
    importedAt: Date.now(),
    items,
  };
}

/**
 * Universal deck parser for local File objects (.apkg, .txt, .tsv, .csv).
 */
export async function parseDeckFromFile(file: File): Promise<CustomDeck> {
  const filename = file.name;
  const isApkg = filename.toLowerCase().endsWith('.apkg');

  if (isApkg) {
    const buffer = await file.arrayBuffer();
    return parseAnkiPackage(buffer, filename);
  }

  const text = await file.text();
  const deck = parseTextFlashcards(text, filename);
  if (deck.items.length === 0) {
    throw new Error(`No valid Korean flashcards found in "${filename}".`);
  }
  return deck;
}
