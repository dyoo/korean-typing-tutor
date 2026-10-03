# Native Rust Port: Living Progress Tracker

*Last Updated: 2026-09-13*
*Status: Phase 1 (Foundations & Unicode Arithmetic)*

---

## Working Model: Driver & Navigator

- **User (Driver)**: Writes the Rust code, interacts with `rustc`, and runs `cargo test`.
- **Assistant (Navigator)**: Provides architectural design, type signatures, test specifications, mental models, and compiler error guidance.

---

## Current Status Overview

| Phase | Milestone Description | Status | Tests Passing |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Hangul Tables, Arithmetic, & Decomposition | **In Progress** (Step 4 / 4) | 5 / 5 |
| **Phase 2** | Hangul IME State Machine (`HangulEngine`) | Planned | — |
| **Phase 3** | Spaced-Repetition Mastery Engine (Rolling 20) | Planned | — |
| **Phase 4** | Curriculum Deserialization & SQLite Storage | Planned | — |
| **Phase 5** | Native Korean Audio & TTS (`tts` crate) | Planned | — |
| **Phase 6** | Native Desktop Window & Slint GUI (`.slint`) | Planned | — |

---

## Phase 1: Unicode Math & Decomposition Breakdown

- [x] **Step 0**: Repository setup, Jujutsu bookmark `native-rust-port`, root workspace `Cargo.toml`, and crate initialization (`crates/korean-typing-core`).
- [x] **Step 1**: Hangul Unicode constants (`S_BASE`, `L_COUNT`, `V_COUNT`, `T_COUNT`) and standalone Jamo arrays in `crates/korean-typing-core/src/tables.rs`.
- [x] **Step 2**: Syllable assembly function (`assemble_syllable(initial, vowel, final) -> Option<char>`) with unit tests in `crates/korean-typing-core/src/decompose.rs`.
- [x] **Step 3**: Syllable decomposition function (`decompose_syllable(ch) -> Option<(u8, u8, u8)>`) with unit tests.
- [ ] **Step 4**: Full Unicode round-trip property test across all 11,172 modern Hangul syllables (`U+AC00` to `U+D7A3`).

---

## Rust Concepts Mastered Cheat Sheet

* **Cargo Workspace**: Managing multi-crate projects via a root `Cargo.toml` with `[workspace]`.
* **Crate Structure**: Difference between library crates (`src/lib.rs`) and binary crates (`src/main.rs`).
* **Unit Testing with Cargo**: Built-in test runner using `#[cfg(test)]` and `#[test]`.

---

## Next Driver Exercise (Phase 1, Step 1)

**File to create**: `crates/korean-typing-core/src/tables.rs`
**Module link**: Add `pub mod tables;` in `crates/korean-typing-core/src/lib.rs`.

**Your Goal**:
Define the foundational Hangul Unicode arithmetic constants and Jamo lookup tables in Rust:
1. `S_BASE`: Unicode start of modern precomposed Hangul syllables (`0xAC00`).
2. `L_COUNT`: Total initial consonants (19).
3. `V_COUNT`: Total vowels (21).
4. `T_COUNT`: Total final consonants including "no batchim" (28).
5. `N_COUNT`: Syllables per initial consonant (`V_COUNT * T_COUNT` = 588).
6. `S_COUNT`: Total Hangul precomposed syllables (`L_COUNT * N_COUNT` = 11,172).
7. `INITIAL_CONSONANTS`: Array of 19 `char`s (`['ㄱ', 'ㄲ', 'ㄴ', ...]`).
8. `VOWELS`: Array of 21 `char`s (`['ㅏ', 'ㅐ', 'ㅑ', ...]`).
9. `FINAL_CONSONANTS`: Array of 28 `Option<char>`s (`[None, Some('ㄱ'), Some('ㄲ'), ...]`).
