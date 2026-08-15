# Mastery Engine

The mastery engine is a **spaced-repetition typing tutor** that teaches the entire Dubeolsik Korean
keyboard layout to English speakers through progressive, one-at-a-time key introduction.

## Goal

Take a learner from **zero Korean typing ability** to **fluent touch-typing of all 44 Dubeolsik Jamo
targets** (26 basic Jamos, 7 double consonants/shifted vowels, 11 compound batchim) — drilling each
new finger motion on authentic Korean vocabulary, scaling from single syllables to full sentences.

## Core Mechanics

### 1. Progressive Unlock (6 Stages)

The learner begins with 4 home-row index keys (`ㅓ, ㅏ, ㅇ, ㄹ`) — the minimum set to form real
Korean syllables. New keys unlock **one at a time**, radiating outward from the home row:

| Stage | Stage Name              | Keys                                         | Cumulative Count |
| :---- | :---------------------- | :------------------------------------------- | :--------------- |
| 1     | Home Row Index Keys     | `ㅓ, ㅏ, ㅇ, ㄹ`                             | 4                |
| 2     | Home Row + Basic Vowels | `ㅗ, ㅣ, ㅁ, ㄴ, ㅎ, ㅜ, ㅡ`                 | 11               |
| 3     | Top Row                 | `ㄱ, ㅅ, ㄷ, ㅈ, ㅂ, ㅛ, ㅕ, ㅑ, ㅐ, ㅔ`     | 21               |
| 4     | Bottom Row              | `ㅋ, ㅌ, ㅊ, ㅍ, ㅠ`                         | 26               |
| 5     | Shift Keys              | `ㄲ, ㅆ, ㄸ, ㅉ, ㅃ, ㅒ, ㅖ`                 | 33               |
| 6     | Compound Batchim        | `ㄶ, ㄵ, ㄺ, ㄻ, ㄼ, ㅄ, ㅀ, ㄳ, ㄾ, ㄿ, ㄽ` | 44               |

### 2. Rolling 20-Attempt Accuracy Window

Each Jamo is evaluated on a sliding window of the most recent 20 keystrokes targeting it. Mastery
requires:

- **≥ 20 total attempts** on the Jamo.
- **≥ 95% accuracy** within the rolling window.

When a Jamo graduates, the next one in the progression automatically unlocks.

### 3. Vocabulary Gating

`isItemEligible()` in [`src/utils/jamoMastery.ts`](src/utils/jamoMastery.ts) ensures the learner
only sees words whose **every constituent Jamo** (including compound batchim like `ㄺ` in `닭`) is
already unlocked. Eligibility is checked in two passes:

1. **Basic Jamo check** — all decomposed Jamos from `decomposeStringToJamos()` must be in the
   unlocked set.
2. **Compound batchim check** — any syllable whose final consonant slot is a member of
   `COMPOUND_BATCHIM_SET` must have that compound batchim explicitly unlocked.

A built-in fallback list of simple syllables (`어, 아, 얼, 라, 알, …`) is used when the curriculum
contains no eligible multi-character words for the current unlock level, preventing the learner from
ever getting stuck with an empty practice queue.

### 4. Adaptive Word Length Ramping

`getAdaptiveLengthMultiplier()` in [`src/utils/jamoMastery.ts`](src/utils/jamoMastery.ts) scales
target difficulty based on the active Jamo's mastery progress percentage:

| Progress Band | Bias                                           | Multipliers                                                 |
| :------------ | :--------------------------------------------- | :---------------------------------------------------------- |
| 0 – 30%       | Strongly biases 1–2 character words            | ≤2 chars → 4.0×, ≤4 chars → 1.0×, else 0.2×                 |
| 30 – 70%      | Biases 2–4 character core vocabulary           | 2–4 chars → 3.0×, 1 char → 1.5×, ≤8 chars → 1.0×, else 0.5× |
| 70 – 100%     | Opens full breadth including phrases/sentences | ≥3 chars → 1.5×, shorter → 1.0×                             |

### 5. Two-Pass Item Selection

`selectNextMasteryItem()` in [`src/utils/jamoMastery.ts`](src/utils/jamoMastery.ts) picks the next
exercise via a two-pass approach:

**Pass 1 — Pool decision (40% focus-jamo bias):** A coin flip with `FOCUS_JAMO_PROBABILITY = 0.4`
decides whether to restrict candidates to words containing the active learning Jamo. When the flip
lands on "focus" (40% of the time) and a non-empty focus pool exists, only those words enter the
weighted draw — ensuring the new Jamo appears regularly without dominating every exercise.

**Pass 2 — Weighted random pick:** Within the chosen pool, each item receives a composite weight:

- **Base weight:** `1`
- **Struggling-Jamo bonus:** `+2` for each decomposed Jamo in the word that has > 0 attempts and <
  90% rolling accuracy.
- **Adaptive length multiplier:** Applied via `getAdaptiveLengthMultiplier()` based on the active
  Jamo's current progress percentage.

The immediately-prior item is excluded from the candidate pool (when >1 item is available) to
prevent immediate repetition.

### 6. Manual Override

The **Mastery Sidebar** ([`src/lib/MasterySidebar.svelte`](src/lib/MasterySidebar.svelte)) lets
learners jump to any specific Jamo in the 44-item progression without waiting for automatic unlock.
Selecting a new level via the radio list calls `setMasteryProgressionLevel()`, which:

- Sets `unlockedCount` to the chosen position (clamped to 4–44).
- Marks all preceding Jamos as mastered.
- Resets the frontier key (and all locked keys beyond it) to zero attempts, so the chosen Jamo is
  actively drilled as the candidate.
- If `level === 4` (Stage 1 clean slate), **all** stats are cleared.

## Persistence

Mastery state is serialized to `localStorage` under the key `korean_tutor_mastery` by
`saveMasteryState()` and rehydrated by `loadMasteryState()`. The schema includes:

| Field           | Type                        | Description                                   |
| :-------------- | :-------------------------- | :-------------------------------------------- |
| `mode`          | `'mastery' \| 'curriculum'` | Last active tutor mode                        |
| `unlockedCount` | `number` (4–44)             | Number of unlocked Jamos in progression order |
| `jamoStats`     | `Record<string, JamoStats>` | Per-Jamo keystroke history and mastery flag   |

Each `JamoStats` entry carries `totalAttempts`, `correctAttempts`, a boolean `recentHistory[]`
ring-buffer (max 20 entries), `isMastered`, and an optional `lastPracticed` Unix timestamp.
Corrupted or missing storage gracefully falls back to `createDefaultMasteryState()` (Stage 1
unlocked, all stats zeroed).

## Key Exports from `jamoMastery.ts`

| Export                          | Purpose                                                                      |
| :------------------------------ | :--------------------------------------------------------------------------- |
| `JAMO_PROGRESSION_ORDER`        | Ordered array of 44 `JamoProgressionItem` objects defining the full sequence |
| `COMPOUND_BATCHIM_SET`          | `Set<string>` of the 11 compound final consonants (겹받침)                   |
| `createDefaultMasteryState()`   | Constructs a fresh `MasteryState` with Stage 1 unlocked                      |
| `loadMasteryState()`            | Loads and validates state from LocalStorage                                  |
| `saveMasteryState()`            | Persists `MasteryState` to LocalStorage                                      |
| `getUnlockedJamos()`            | Returns a `Set<string>` of currently unlocked Jamo characters                |
| `getActiveLearningJamo()`       | Returns the newest unlocked `JamoProgressionItem` not yet mastered           |
| `setMasteryProgressionLevel()`  | Manual-override: jump to a specific unlock level                             |
| `recordJamoAttempt()`           | Records a keystroke outcome and triggers mastery promotion if criteria met   |
| `calculateJamoAccuracy()`       | Rolling accuracy ratio from `recentHistory`                                  |
| `calculateJamoProgress()`       | 0–100% progress score blending attempt ratio and accuracy                    |
| `isItemEligible()`              | Validates that all of a word's Jamos are unlocked                            |
| `getEligibleMasteryItems()`     | Filters the full curriculum to unlocked-only items (with fallback)           |
| `getAdaptiveLengthMultiplier()` | Length-bias multiplier based on active Jamo progress band                    |
| `selectNextMasteryItem()`       | Two-pass item selector: focus-pool coin flip + weighted random draw          |
| `isHangulJamo()`                | Tests whether a character is a Unicode Hangul Jamo codepoint                 |

## Design Principles

- **Muscle memory isolation**: One new finger reach at a time prevents motor confusion.
- **Real words from day one**: Korean's combinatorial syllable system means even 4 Jamos produce
  dozens of authentic words.
- **No distractions**: Static UI, no animations, no auto-advance — the learner controls the pace.
- **Exponential vocabulary growth**: Each unlocked Jamo opens 15–40 new words without any manual
  configuration.
- **Robust persistence**: Graceful LocalStorage fallback ensures progress is never lost silently.
