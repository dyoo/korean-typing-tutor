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
    fn test_assemble_syllable_out_of_bounds() {
        // Initial consonant index out of bounds (>= 19)
        assert_eq!(assemble_syllable(19, 0, 0), None);
        // Vowel index out of bounds (>= 21)
        assert_eq!(assemble_syllable(0, 21, 0), None);
        // Final consonant index out of bounds (>= 28)
        assert_eq!(assemble_syllable(0, 0, 28), None);
    }
}
