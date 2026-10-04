use crate::tables::{
    FINAL_CONSONANT_COUNT, FinalIndex, HANGUL_BASE, INITIAL_CONSONANT_COUNT, InitialIndex,
    VOWEL_COUNT, VowelIndex,
};

pub fn assemble_syllable(
    initial_index: InitialIndex,
    vowel_index: VowelIndex,
    final_index: FinalIndex,
) -> char {
    let offset = (vowel_index.as_u32() + initial_index.as_u32() * VOWEL_COUNT)
        * FINAL_CONSONANT_COUNT
        + final_index.as_u32();

    // The unwrap is safe because we bound the indices by construction.
    char::from_u32(HANGUL_BASE + offset).unwrap()
}

const SYLLABLES_PER_INITIAL: u32 = VOWEL_COUNT * FINAL_CONSONANT_COUNT;
const TOTAL_SYLLABLES: u32 = INITIAL_CONSONANT_COUNT * SYLLABLES_PER_INITIAL;

/// Decomposes a precomposed modern Hangul syllable character into its constituent
/// initial consonant (0..=18), vowel (0..=20), and final consonant (0..=27) indices.
///
/// Returns `None` if the character is not a precomposed Hangul syllable (U+AC00..=U+D7A3).
pub fn decompose_syllable(ch: char) -> Option<(InitialIndex, VowelIndex, FinalIndex)> {
    let code = u32::from(ch);
    if code < HANGUL_BASE {
        return None;
    }

    let offset = code - HANGUL_BASE;
    if offset >= TOTAL_SYLLABLES {
        return None;
    }

    let initial_index = InitialIndex::new(offset / SYLLABLES_PER_INITIAL)?;
    let vowel_index = VowelIndex::new((offset % SYLLABLES_PER_INITIAL) / FINAL_CONSONANT_COUNT)?;
    let final_index = FinalIndex::new(offset % FINAL_CONSONANT_COUNT)?;

    Some((initial_index, vowel_index, final_index))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_assemble_syllable_boundary_syllables() {
        // First syllable without batchim: '가' (U+AC00)
        assert_eq!(
            assemble_syllable(
                0.try_into().unwrap(),
                0.try_into().unwrap(),
                FinalIndex::NONE,
            ),
            '가'
        );

        // First syllable with batchim: '각' (U+AC01)
        assert_eq!(
            assemble_syllable(
                0.try_into().unwrap(),
                0.try_into().unwrap(),
                1.try_into().unwrap()
            ),
            '각'
        );

        // Common syllable: '한' (ㅎ=18, ㅏ=0, ㄴ=4 -> U+D55C)
        assert_eq!(
            assemble_syllable(
                18.try_into().unwrap(),
                0.try_into().unwrap(),
                4.try_into().unwrap()
            ),
            '한'
        );

        // Last modern Hangul syllable: '힣' (ㅎ=18, ㅣ=20, ㅎ=27 -> U+D7A3)
        assert_eq!(
            assemble_syllable(
                18.try_into().unwrap(),
                20.try_into().unwrap(),
                27.try_into().unwrap()
            ),
            '힣'
        );
    }

    #[test]
    fn test_yoo_assemble() {
        assert_eq!(
            assemble_syllable(
                11.try_into().unwrap(),
                17.try_into().unwrap(),
                FinalIndex::NONE
            ),
            '유'
        );
    }

    #[test]
    fn test_decompose_syllable_boundary_syllables() {
        // First syllable without batchim: '가' -> (0, 0, 0)
        assert_eq!(
            decompose_syllable('가'),
            Some((
                0.try_into().unwrap(),
                0.try_into().unwrap(),
                FinalIndex::NONE
            ))
        );
        // First syllable with batchim: '각' -> (0, 0, 1)
        assert_eq!(
            decompose_syllable('각'),
            Some((
                0.try_into().unwrap(),
                0.try_into().unwrap(),
                1.try_into().unwrap()
            ))
        );
        // Common syllable: '한' -> (18, 0, 4)
        assert_eq!(
            decompose_syllable('한'),
            Some((
                18.try_into().unwrap(),
                0.try_into().unwrap(),
                4.try_into().unwrap()
            ))
        );
        // Last modern Hangul syllable: '힣' -> (18, 20, 27)
        assert_eq!(
            decompose_syllable('힣'),
            Some((
                18.try_into().unwrap(),
                20.try_into().unwrap(),
                27.try_into().unwrap()
            ))
        );
    }
    #[test]
    fn test_decompose_syllable_non_hangul() {
        // ASCII characters
        assert_eq!(decompose_syllable('A'), None);
        assert_eq!(decompose_syllable('1'), None);
        assert_eq!(decompose_syllable(' '), None);
        // Standalone Compatibility Jamo (not precomposed syllables)
        assert_eq!(decompose_syllable('ㄱ'), None);
        assert_eq!(decompose_syllable('ㅏ'), None);
        // Just past the end of the modern Hangul Syllables block (U+D7A4)
        assert_eq!(decompose_syllable('\u{D7A4}'), None);
    }

    #[test]
    fn test_yoo_disassemble() {
        assert_eq!(
            decompose_syllable('유'),
            Some((
                11.try_into().unwrap(),
                17.try_into().unwrap(),
                FinalIndex::NONE
            ))
        );
    }

    #[test]
    fn test_roundtrip() {
        let mut seen_chars = HashSet::with_capacity(TOTAL_SYLLABLES as usize);
        let mut seen_tuples = HashSet::with_capacity(TOTAL_SYLLABLES as usize);

        for offset in 0..TOTAL_SYLLABLES {
            let code = HANGUL_BASE + offset;
            let ch = char::from_u32(code).expect("Hangul character");

            let (i, v, f) = decompose_syllable(ch).expect("decomposed indices");
            seen_tuples.insert((i, v, f));

            // Verify individual index bounds
            assert!(i.as_u32() < INITIAL_CONSONANT_COUNT);
            assert!(v.as_u32() < VOWEL_COUNT);
            assert!(f.as_u32() < FINAL_CONSONANT_COUNT);

            // Verify round-tripping:
            let assembled_ch = assemble_syllable(i, v, f);
            seen_chars.insert(assembled_ch);
            assert_eq!(assembled_ch, ch);
        }

        // Make sure the observed unique elements are what we expect.
        assert_eq!(seen_tuples.len(), TOTAL_SYLLABLES as usize);
        assert_eq!(seen_chars.len(), TOTAL_SYLLABLES as usize);
    }
}
