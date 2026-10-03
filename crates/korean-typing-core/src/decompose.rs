use crate::tables;

pub fn assemble_syllable(
    initial_consonant_idx: u32,
    vowel_idx: u32,
    final_consonant_idx: u32,
) -> Option<char> {
    if initial_consonant_idx < tables::INITIAL_CONSONANT_COUNT
        && vowel_idx < tables::VOWEL_COUNT
        && final_consonant_idx < tables::FINAL_CONSONANT_COUNT
    {
        let offset = (vowel_idx + initial_consonant_idx * tables::VOWEL_COUNT)
            * tables::FINAL_CONSONANT_COUNT
            + final_consonant_idx;
        char::from_u32(tables::HANGUL_BASE + offset)
    } else {
        None
    }
}

const SYLLABLES_PER_INITIAL: u32 = tables::VOWEL_COUNT * tables::FINAL_CONSONANT_COUNT;
const TOTAL_SYLLABLES: u32 = tables::INITIAL_CONSONANT_COUNT * SYLLABLES_PER_INITIAL;

/// Decomposes a precomposed modern Hangul syllable character into its constituent
/// initial consonant (0..=18), vowel (0..=20), and final consonant (0..=27) indices.
///
/// Returns `None` if the character is not a precomposed Hangul syllable (U+AC00..=U+D7A3).
pub fn decompose_syllable(ch: char) -> Option<(u32, u32, u32)> {
    let code = u32::from(ch);
    if code < tables::HANGUL_BASE {
        return None;
    }

    let offset = code - tables::HANGUL_BASE;
    if offset >= TOTAL_SYLLABLES {
        return None;
    }

    let initial_index = offset / SYLLABLES_PER_INITIAL;
    let vowel_index = (offset % SYLLABLES_PER_INITIAL) / tables::FINAL_CONSONANT_COUNT;
    let final_index = offset % tables::FINAL_CONSONANT_COUNT;

    Some((initial_index, vowel_index, final_index))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_assemble_syllable_boundary_syllables() {
        // First syllable without batchim: '가' (U+AC00)
        assert_eq!(assemble_syllable(0, 0, 0), Some('가'));

        // First syllable with batchim: '각' (U+AC01)
        assert_eq!(assemble_syllable(0, 0, 1), Some('각'));

        // Common syllable: '한' (ㅎ=18, ㅏ=0, ㄴ=4 -> U+D55C)
        assert_eq!(assemble_syllable(18, 0, 4), Some('한'));

        // Last modern Hangul syllable: '힣' (ㅎ=18, ㅣ=20, ㅎ=27 -> U+D7A3)
        assert_eq!(assemble_syllable(18, 20, 27), Some('힣'));
    }

    #[test]
    fn test_yoo_assemble() {
        assert_eq!(assemble_syllable(11, 17, 0), Some('유'));
    }

    #[test]
    fn test_assemble_syllable_out_of_bounds() {
        // Initial consonant index out of bounds (>= 19)
        assert_eq!(assemble_syllable(19, 0, 0), None);
        // Vowel index out of bounds (>= 21)
        assert_eq!(assemble_syllable(0, 21, 0), None);
        // Final consonant index out of bounds (>= 28)
        assert_eq!(assemble_syllable(0, 0, 28), None);
    }

    #[test]
    fn test_decompose_syllable_boundary_syllables() {
        // First syllable without batchim: '가' -> (0, 0, 0)
        assert_eq!(decompose_syllable('가'), Some((0, 0, 0)));
        // First syllable with batchim: '각' -> (0, 0, 1)
        assert_eq!(decompose_syllable('각'), Some((0, 0, 1)));
        // Common syllable: '한' -> (18, 0, 4)
        assert_eq!(decompose_syllable('한'), Some((18, 0, 4)));
        // Last modern Hangul syllable: '힣' -> (18, 20, 27)
        assert_eq!(decompose_syllable('힣'), Some((18, 20, 27)));
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
        assert_eq!(decompose_syllable('유'), Some((11, 17, 0)));
    }

    #[test]
    fn test_roundtrip() {
        for offset in 0..TOTAL_SYLLABLES {
            let code = tables::HANGUL_BASE + offset;
            let ch = char::from_u32(code).expect("Hangul character");

            let (i, v, f) = decompose_syllable(ch).expect("decomposed indices");

            // Verify individual index bounds
            assert!(i < tables::INITIAL_CONSONANT_COUNT);
            assert!(v < tables::VOWEL_COUNT);
            assert!(f < tables::FINAL_CONSONANT_COUNT);

            // Verify round-tripping:
            assert_eq!(assemble_syllable(i, v, f), Some(ch));
        }
    }
}
