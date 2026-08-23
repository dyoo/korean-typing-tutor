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

  // Strip wrapping quotation marks if present
  text = text.trim();
  if (
    (text.startsWith('"') && text.endsWith('"') && text.length >= 2) ||
    (text.startsWith("'") && text.endsWith("'") && text.length >= 2)
  ) {
    text = text.slice(1, -1).trim();
  }

  return text;
}

/**
 * Parses raw text lines (from TSV, CSV, or Anki plain text note exports).
 */
export function parseTextFlashcards(
  content: string,
  filename: string = 'Custom Deck',
  deckId?: string,
): CustomDeck {
  const generatedId = deckId ?? `custom_deck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const title = filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Custom Flashcards';

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
    const lineDelimiter = delimiter ?? (rawLine.includes('\t') ? '\t' : rawLine.includes(';') ? ';' : ',');
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
    const target = fields[targetIndex];
    let translation: string | null = null;
    let explicitPronunciation: string | null = null;

    // Find translation among non-Hangul fields
    for (let f = 0; f < fields.length; f++) {
      if (f !== targetIndex) {
        if (!translation && !containsHangul(fields[f])) {
          translation = fields[f];
        } else if (!explicitPronunciation && f !== targetIndex) {
          explicitPronunciation = fields[f];
        }
      }
    }

    // Deduplicate by target string
    if (!target || seenTargets.has(target)) {
      continue;
    }
    seenTargets.add(target);

    const pronunciation = explicitPronunciation ?? romanize(target);

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
 * Parses an Anki `.apkg` binary package buffer.
 */
export async function parseAnkiPackage(
  buffer: ArrayBuffer,
  filename: string = 'Anki Deck.apkg',
  deckId?: string,
): Promise<CustomDeck> {
  const generatedId = deckId ?? `custom_deck_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const title = filename.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'Anki Deck';

  // 1. Extract collection.anki2 or collection.anki21 database file from ZIP
  const dbBytes = await extractFileFromZip(buffer, /collection\.anki2(1b?)?$/i);
  if (!dbBytes) {
    throw new Error('Invalid Anki package (.apkg): collection database not found inside archive.');
  }

  // 2. Scan SQLite database text blocks for note fields separated by 0x1f unit separator
  // In Anki's SQLite schema, the notes table contains the 'flds' column where fields are delimited by \x1f.
  const rawText = new TextDecoder('utf-8', { fatal: false }).decode(dbBytes);

  // Split by unit separator or extract patterns containing \x1f
  const items: LessonItem[] = [];
  const seenTargets = new Set<string>();

  // Find strings with \x1f field delimiters
  // eslint-disable-next-line no-control-regex
  const noteChunks = rawText.split(/(?:[\x00-\x08\x0e-\x1e]+)/);

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
    const target = fields[targetIndex];

    // Filter out long database artifacts / SQL strings
    if (target.length > 80 || target.includes('CREATE TABLE') || target.includes('INSERT INTO')) {
      continue;
    }

    let translation: string | null = null;
    let explicitPronunciation: string | null = null;

    for (let f = 0; f < fields.length; f++) {
      if (f !== targetIndex) {
        if (!translation && !containsHangul(fields[f])) {
          translation = fields[f];
        } else if (!explicitPronunciation && f !== targetIndex) {
          explicitPronunciation = fields[f];
        }
      }
    }

    if (!target || seenTargets.has(target)) {
      continue;
    }
    seenTargets.add(target);

    const pronunciation = explicitPronunciation ?? romanize(target);

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
