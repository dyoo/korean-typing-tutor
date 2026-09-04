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
 * Also strips parenthesized/bracketed Hanja glosses in ASCII and CJK bracket pairs.
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

  // Strip parenthesized / bracketed glosses containing Hanja (e.g. "(先生님)", "[圖書館]", "（失手）", "【漢字】")
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
  target = target.replace(
    /（[^（）]*[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF][^（）]*）/g,
    '',
  );
  target = target.replace(
    /［[^［］]*[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF][^［］]*］/g,
    '',
  );
  target = target.replace(
    /【[^【】]*[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF][^【】]*】/g,
    '',
  );
  target = target.replace(
    /〔[^〔〕]*[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF][^〔〕]*〕/g,
    '',
  );

  // Strip trailing or delimited Hanja annotations (e.g. "실수 / 失手", "실수 - 失手", "실수 失手")
  target = target.replace(
    /\s*[/:\-–—·~|]\s*[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF\s]+$/g,
    '',
  );
  target = target.replace(
    /\s+[\u4E00-\u9FFF\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF]+$/g,
    '',
  );

  // Strip trailing or embedded parenthesized / bracketed non-Hangul glosses (e.g. "[Sino-Korean #]", "(to eat)", "（polite）")
  target = target.replace(/\[[^[\]\uAC00-\uD7A3\u3131-\u318E]*\]/g, '');
  target = target.replace(/\([^()\uAC00-\uD7A3\u3131-\u318E]*\)/g, '');
  target = target.replace(/\{[^{}\uAC00-\uD7A3\u3131-\u318E]*\}/g, '');
  target = target.replace(/（[^（）\uAC00-\uD7A3\u3131-\u318E]*）/g, '');
  target = target.replace(/［[^［］\uAC00-\uD7A3\u3131-\u318E]*］/g, '');
  target = target.replace(/【[^【】\uAC00-\uD7A3\u3131-\u318E]*】/g, '');

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
