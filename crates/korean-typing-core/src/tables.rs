//! Unicode constants and Jamo lookup tables for Hangul syllable arithmetic.

/// Unicode code point base offset for modern precomposed Hangul syllables ('가' = U+AC00).
pub const HANGUL_BASE: u32 = 0xAC00;

/// Count of initial consonants.
pub const INITIAL_CONSONANT_COUNT: u32 = 19;

/// Initial Consonants (Choseong) in standard canonical order.
pub const INITIAL_CONSONANTS: [char; INITIAL_CONSONANT_COUNT as usize] = [
    'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ',
    'ㅌ', 'ㅍ', 'ㅎ',
];

/// Count of vowels.
pub const VOWEL_COUNT: u32 = 21;

/// Vowels (Jungseong) in standard canonical order.
pub const VOWELS: [char; VOWEL_COUNT as usize] = [
    'ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ',
    'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ',
];

/// Count of final consonants (including the empty/no-batchim case)
pub const FINAL_CONSONANT_COUNT: u32 = 28;

/// Final consonants (Jongseong) in standard canonical order.
/// None represents the empty/no-batchim case.
pub const FINAL_CONSONANTS: [Option<char>; FINAL_CONSONANT_COUNT as usize] = [
    None,
    Some('ㄱ'),
    Some('ㄲ'),
    Some('ㄳ'),
    Some('ㄴ'),
    Some('ㄵ'),
    Some('ㄶ'),
    Some('ㄷ'),
    Some('ㄹ'),
    Some('ㄺ'),
    Some('ㄻ'),
    Some('ㄼ'),
    Some('ㄽ'),
    Some('ㄾ'),
    Some('ㄿ'),
    Some('ㅀ'),
    Some('ㅁ'),
    Some('ㅂ'),
    Some('ㅄ'),
    Some('ㅅ'),
    Some('ㅆ'),
    Some('ㅇ'),
    Some('ㅈ'),
    Some('ㅊ'),
    Some('ㅋ'),
    Some('ㅌ'),
    Some('ㅍ'),
    Some('ㅎ'),
];
