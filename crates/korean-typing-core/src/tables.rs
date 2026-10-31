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

/// An index into `INITIAL_CONSONANTS`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct InitialIndex(u8);

impl InitialIndex {
    pub const fn new(val: u32) -> Option<Self> {
        if val < INITIAL_CONSONANT_COUNT {
            Some(Self(val as u8))
        } else {
            None
        }
    }

    pub const fn as_u8(self) -> u8 {
        self.0
    }

    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    pub const fn as_u32(self) -> u32 {
        self.0 as u32
    }

    pub const fn as_char(self) -> char {
        INITIAL_CONSONANTS[self.0 as usize]
    }

    pub const fn from_char(ch: char) -> Option<Self> {
        let mut i = 0;
        while i < INITIAL_CONSONANT_COUNT as usize {
            if INITIAL_CONSONANTS[i] == ch {
                return Some(Self(i as u8));
            }
            i += 1;
        }
        None
    }
}

impl TryFrom<u8> for InitialIndex {
    type Error = ();
    fn try_from(val: u8) -> Result<Self, Self::Error> {
        Self::new(val as u32).ok_or(())
    }
}

/// An index into `VOWELS`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct VowelIndex(u8);

impl VowelIndex {
    pub const fn new(val: u32) -> Option<Self> {
        if val < VOWEL_COUNT {
            Some(Self(val as u8))
        } else {
            None
        }
    }

    pub const fn as_u8(self) -> u8 {
        self.0
    }

    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    pub const fn as_u32(self) -> u32 {
        self.0 as u32
    }

    pub const fn as_char(self) -> char {
        VOWELS[self.0 as usize]
    }

    pub const fn from_char(ch: char) -> Option<Self> {
        let mut i = 0;
        while i < VOWEL_COUNT as usize {
            if VOWELS[i] == ch {
                return Some(Self(i as u8));
            }
            i += 1;
        }
        None
    }
}

impl TryFrom<u8> for VowelIndex {
    type Error = ();
    fn try_from(val: u8) -> Result<Self, Self::Error> {
        Self::new(val as u32).ok_or(())
    }
}

/// An index into `FINAL_CONSONANTS`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash)]
pub struct FinalIndex(u8);

impl FinalIndex {
    pub const fn new(val: u32) -> Option<Self> {
        if val < FINAL_CONSONANT_COUNT {
            Some(Self(val as u8))
        } else {
            None
        }
    }

    /// Represents the absence of a final consonant.
    pub const NONE: Self = Self(0);

    pub const fn as_u8(self) -> u8 {
        self.0
    }

    pub const fn as_usize(self) -> usize {
        self.0 as usize
    }

    pub const fn as_u32(self) -> u32 {
        self.0 as u32
    }

    pub const fn as_char(self) -> Option<char> {
        FINAL_CONSONANTS[self.0 as usize]
    }

    pub const fn from_char(ch: char) -> Option<Self> {
        let mut i = 0;
        while i < FINAL_CONSONANT_COUNT as usize {
            if let Some(c) = FINAL_CONSONANTS[i]
                && c == ch
            {
                return Some(Self(i as u8));
            }
            i += 1;
        }
        None
    }
}

impl TryFrom<u8> for FinalIndex {
    type Error = ();
    fn try_from(val: u8) -> Result<Self, Self::Error> {
        Self::new(val as u32).ok_or(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    pub fn test_construction() {
        // Valid initial index (0..=18)
        assert!(InitialIndex::new(0).is_some());
        assert!(InitialIndex::new(18).is_some());
        assert_eq!(InitialIndex::new(19), None);
        // Valid vowel index (0..=20)
        assert!(VowelIndex::new(0).is_some());
        assert!(VowelIndex::new(20).is_some());
        assert_eq!(VowelIndex::new(21), None);
        // Valid final index (0..=27)
        assert!(FinalIndex::new(0).is_some());
        assert!(FinalIndex::new(27).is_some());
        assert_eq!(FinalIndex::new(28), None);
        assert_eq!(FinalIndex::NONE.as_u8(), 0);
    }

    #[test]
    pub fn test_as_char() {
        assert_eq!(InitialIndex::new(0).unwrap().as_char(), 'ㄱ');
        assert_eq!(InitialIndex::new(1).unwrap().as_char(), 'ㄲ');
        assert_eq!(InitialIndex::new(18).unwrap().as_char(), 'ㅎ');

        assert_eq!(VowelIndex::new(0).unwrap().as_char(), 'ㅏ');
        assert_eq!(VowelIndex::new(1).unwrap().as_char(), 'ㅐ');
        assert_eq!(VowelIndex::new(20).unwrap().as_char(), 'ㅣ');

        assert_eq!(FinalIndex::NONE.as_char(), None);
        assert_eq!(FinalIndex::new(1).unwrap().as_char(), Some('ㄱ'));
        assert_eq!(FinalIndex::new(2).unwrap().as_char(), Some('ㄲ'));
        assert_eq!(FinalIndex::new(3).unwrap().as_char(), Some('ㄳ'));
        assert_eq!(FinalIndex::new(27).unwrap().as_char(), Some('ㅎ'));
    }

    #[test]
    pub fn test_from_char() {
        assert_eq!(InitialIndex::from_char('ㄱ'), InitialIndex::new(0));
        assert_eq!(InitialIndex::from_char('ㄲ'), InitialIndex::new(1));
        assert_eq!(InitialIndex::from_char('ㄳ'), None);
        assert_eq!(InitialIndex::from_char('ㅎ'), InitialIndex::new(18));
        assert_eq!(InitialIndex::from_char('ㅏ'), None);

        assert_eq!(VowelIndex::from_char('ㅏ'), VowelIndex::new(0));
        assert_eq!(VowelIndex::from_char('ㅐ'), VowelIndex::new(1));
        assert_eq!(VowelIndex::from_char('ㅣ'), VowelIndex::new(20));
        assert_eq!(VowelIndex::from_char('ㄱ'), None);

        assert_eq!(FinalIndex::from_char('ㄱ'), FinalIndex::new(1));
        assert_eq!(FinalIndex::from_char('ㄲ'), FinalIndex::new(2));
        assert_eq!(FinalIndex::from_char('ㄳ'), FinalIndex::new(3));
        assert_eq!(FinalIndex::from_char('ㅎ'), FinalIndex::new(27));
        assert_eq!(FinalIndex::from_char('ㅏ'), None);
    }
}
