# Mastery Engine

The mastery engine is a **spaced-repetition typing tutor** that teaches the entire Dubeolsik Korean keyboard layout to English speakers through progressive, one-at-a-time key introduction.

## Goal

Take a learner from **zero Korean typing ability** to **fluent touch-typing of all 44 Dubeolsik Jamo targets** (26 basic Jamos, 7 double consonants/shifted vowels, 11 compound batchim) — drilling each new finger motion on authentic Korean vocabulary, scaling from single syllables to full sentences.

## Core Mechanics

### 1. Progressive Unlock (7 Stages)

The learner begins with 4 home-row index keys (`ㅓ, ㅏ, ㅇ, ㄹ`) — the minimum set to form real Korean syllables. New keys unlock **one at a time**, radiating outward from the home row:

| Stage | Keys | Cumulative Count |
| :--- | :--- | :--- |
| 1 | Home Index (`ㅓ, ㅏ, ㅇ, ㄹ`) | 4 |
| 2 | Full Home Row + Basic Vowels (`ㅗ, ㅣ, ㅁ, ㄴ, ㅎ, ㅜ, ㅡ`) | 11 |
| 3 | Top Row (`ㄱ, ㅅ, ㄷ, ㅈ, ㅂ, ㅛ, ㅕ, ㅑ, ㅐ, ㅔ`) | 21 |
| 4 | Bottom Row (`ㅋ, ㅌ, ㅊ, ㅍ, ㅠ`) | 26 |
| 5 | Shift Keys (`ㄲ, ㅆ, ㄸ, ㅉ, ㅃ, ㅒ, ㅖ`) | 33 |
| 6 | Compound Batchim (`ㄶ, ㄵ, ㄺ, ㄻ, ㄼ, ㅄ, ㅀ, ㄳ, ㄾ, ㄿ, ㄽ`) | 44 |

### 2. Rolling 20-Attempt Accuracy Window

Each Jamo is evaluated on a sliding window of the most recent 20 keystrokes targeting it. Mastery requires:

- **≥ 20 total attempts** on the Jamo.
- **≥ 95% accuracy** within the rolling window.

When a Jamo graduates, the next one in the progression automatically unlocks.

### 3. Vocabulary Gating

`isItemEligible()` in `src/utils/jamoMastery.ts` ensures the learner only sees words whose **every constituent Jamo** (including compound batchim like `ㄺ` in `닭`) is already unlocked. This prevents overwhelming the learner with characters they haven't encountered.

### 4. Adaptive Word Length Ramping

`getAdaptiveLengthMultiplier()` in `src/utils/jamoMastery.ts` scales target difficulty based on the active Jamo's progress:

- **0–30% progress**: Heavily biases 1–2 character words (e.g. `우유`, `하나`) — isolate the finger reflex.
- **30–70% progress**: Prioritizes 2–4 character vocabulary (e.g. `할머니`, `도서관`) — build rhythm.
- **70–100% progress**: Opens full curriculum including phrases and sentences — validate fluency.

### 5. Weighted Item Selection

`selectNextMasteryItem()` in `src/utils/jamoMastery.ts` picks exercises using weighted random sampling that favors:

- Words containing the **active learning Jamo** (3× weight).
- Words containing **struggling Jamos** with < 90% accuracy (2× weight).
- Words containing the **active compound batchim** in syllable finals (6× weight).
- Appropriate word length per the adaptive ramping above.

### 6. Manual Override

The "Unlock Up To" dropdown in Settings lets learners jump to any stage or individual Jamo position, skipping ahead if the one-at-a-time pace feels too slow.

## Design Principles

- **Muscle memory isolation**: One new finger reach at a time prevents motor confusion.
- **Real words from day one**: Korean's combinatorial syllable system means even 4 Jamos produce dozens of authentic words.
- **No distractions**: Static UI, no animations, no auto-advance — the learner controls the pace.
- **Exponential vocabulary growth**: Each unlocked Jamo opens 15–40 new words without any manual configuration.
