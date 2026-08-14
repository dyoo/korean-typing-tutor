# Project Plan: Korean Typing Tutor

## Overview

A minimalist, distraction-free Progressive Web App (PWA) designed to help English speakers learn Korean through focused typing practice. The core focus is converting standard QWERTY keystrokes and native Korean OS inputs into Hangul syllables in real-time.

## Technical Stack

- **Framework:** Svelte 5 + Vite
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (v4)
- **Testing:** Vitest (110 / 110 passing unit tests across 13 test suites)
- **PWA:** `vite-plugin-pwa` (PWA manifest & service worker enabled)
- **Storage:** `LocalStorage` (for offline-first progress tracking)

## 🎯 Current Status Summary

Phases 1, 2, 3, and 4 are **COMPLETED**. The application features an authentic Hangul composition engine (QWERTY & native Korean OS 2-set support), strict distraction-free UI, dynamic character underline feedback, dual Romanization + Translation display, 1,000+ curriculum items across 21 categorized modules, modular Svelte component architecture, zero lint/dead-code warnings, and full `LocalStorage` persistence for settings, theme, font scaling, and multi-module curriculum filters.

---

## Detailed Roadmap & Progress

### Phase 1: The Hangul Composition Engine (The Brain) — COMPLETED

- [x] **QWERTY to Jamo Mapping:** Complete Dubeolsik (2-set) key mapping (Choseong, Jungseong, Jongseong, Shift keys).
- [x] **Universal Dual-Input Support:** Native support for both raw QWERTY keystrokes and native Korean OS 2-set keyboards (`'ㄱ'`, `'ㅏ'`, composed syllables).
- [x] **Standard Shift Key Fallbacks:** Dubeolsik Shift keys (`R`, `E`, `Q`, `T`, `W`, `O`, `P`) and fallback for unmapped Shift keys (`Shift+X` -> `ㅌ`).
- [x] **The State Machine:** Logic managing transitions between initial consonants, vowels, final consonants, compound vowels (`ㅘ`, `ㅝ`), compound final consonants (`ㄺ`, `ㅄ`), and liaison syllable splitting.
- [x] **Unicode Assembly:** Mathematical formula converting composed Jamo indices into Unicode Hangul Syllable code points (`(Cho * 21 + Jung) * 28 + Jong + 0xAC00`).
- [x] **Smart Partial Error Detection:** `isPartialOrExactMatch` partial prefix matching preventing false red error underlines during active syllable composition.
- [x] **Decomposed Architecture:** Modular engine files (`hangulTables.ts`, `hangulDecompose.ts`, `hangulMatch.ts`, `hangulEngine.ts`, `cursorHelper.ts`).
- [x] **Unit Testing:** 110 Vitest unit tests covering state machine transitions, backspace decomposition, Shift key fallbacks, spacing, and native OS keyboard inputs.

### Phase 2: Minimalist User Interface (The Face) — COMPLETED

- [x] **Distraction-Free Interface:** Clean, static target text display with giant typography, static layout height (zero CLS), zero animations, and zero automatic word jumps.
- [x] **Dual Mode Display:** Simultaneous presentation of Romanization and English translations (`sagwa · apple`).
- [x] **Real-Time Visual Feedback:** Main target display character underlines (neutral gray for untyped, blue for valid partial block, emerald for correct, red for incorrect).
- [x] **Mouse Text Selection & Copying:** Full support for highlighting and copying Korean words without focus stealing.
- [x] **Deliberate Progression & Practice Backspacing:** Requires Enter/Space to advance, while allowing Backspace to edit/re-type completed words.
- [x] **On-Screen Virtual Keyboard Helper:** Interactive Dubeolsik virtual keyboard layout highlighting active target keys for beginners with touch/click support and opposite-hand Shift chording recommendations.
- [x] **Modular UI Components:** Clean, decomposed Svelte components (`TopBar.svelte`, `TargetDisplay.svelte`, `InputDisplay.svelte`, `CharDisplay.svelte`, `VirtualKeyboard.svelte`, `VirtualKey.svelte`, `ShiftKey.svelte`, `CurriculumSidebar.svelte`, `CurriculumCategoryGroup.svelte`, `SettingsModal.svelte`).

### Phase 3: Curriculum & Content (The Lessons) — COMPLETED

- [x] **Data-Driven Content Aggregator (`src/content/index.ts`):** Dynamic modules array and items array importing from 21 per-module JSON files.
- [x] **Beginner Keystroke Modules:** Home row vowels, home row consonants, home row words, top row, bottom row, shift keys.
- [x] **Syllables & Batchim Modules:** Simple batchim, complex batchim.
- [x] **Vocabulary & Sentences:** Level 3 vocabulary, Level 4 verbs/adjectives, Level 5 phrases.
- [x] **Official TOPIK I & II Datasets:** TOPIK 1 Vocab, TOPIK 1 Verbs, TOPIK Grammar, TOPIK 2 Vocab, TOPIK 2 Passages.
- [x] **Cultural & Practical Content:** Sejong phrases, K-pop slang, Korean culture, Korean proverbs, tongue twisters.
- [x] **Categorized Curriculum Sidebar:** Multi-select categorized drawer with accordion groups and select/deselect all actions.

### Phase 4: Persistence & Settings (The Experience) — COMPLETED

- [x] **PWA Configuration:** Service worker and Web App Manifest configured via `vite-plugin-pwa`.
- [x] **LocalStorage Module Persistence:** Automatically saving and restoring selected curriculum modules and collapsed categories across browser reloads.
- [x] **User Settings Panel:** Theme toggling (System / Light / Dark), Romanization toggle, English translation toggle, Virtual keyboard toggle, Font size clamp slider, and Cursor accent color picker.

---

### Phase 5: Spaced-Repetition Jamo Mastery Mode (Adaptive Learning) — IN PROGRESS

#### 1. Jamo Progression Sequence (Home-Row Outward)
1. **Stage 1 (Home-Row Index Keys):** `ㅓ` (j), `ㅏ` (k), `ㅇ` (d), `ㄹ` (f)
2. **Stage 2 (Remaining Home-Row Keys):** `ㅗ` (h), `ㅣ` (l), `ㅁ` (a), `ㄴ` (s), `ㅎ` (g)
3. **Stage 3 (Top-Row Keys):** `ㄱ` (r), `ㅅ` (t), `ㄷ` (e), `ㅈ` (w), `ㅂ` (q), `ㅜ` (n), `ㅡ` (m), `ㅕ` (u), `ㅑ` (i), `ㅛ` (y), `ㅐ` (o), `ㅔ` (p)
4. **Stage 4 (Bottom-Row Keys):** `ㅋ` (z), `ㅌ` (x), `ㅊ` (c), `ㅍ` (v), `ㅠ` (b)
5. **Stage 5 (Shift-Key Double Consonants & Vowels):** `ㄲ` (R), `ㅆ` (T), `ㄸ` (E), `ㅉ` (W), `ㅃ` (Q), `ㅒ` (O), `ㅖ` (P)
6. **Stage 6 (Punctuation):** `,`, `.`

#### 2. Mastery Evaluation Criteria
- **Minimum Attempts:** At least 20 keystrokes evaluated on the active Jamo.
- **Accuracy Threshold:** $\ge 95\%$ rolling accuracy across the sliding window of the last 20 attempts.
- **Promotion:** When the current active Jamo achieves mastery, the next Jamo in the progression sequence is unlocked.

#### 3. Curriculum Vocabulary Filtering & Scheduling
- **Strict Inclusion:** An exercise item is eligible if and only if 100% of its constituent Jamos (`decomposeStringToJamos(item.target)`) are in the user's unlocked Jamo set.
- **Weighted Selection:** The queue biases item selection toward words containing newly unlocked or struggling Jamos to reinforce active learning.

#### 4. Dual-Mode User Interface Integration
- **Mode Switcher:** TopBar toggle between **Curriculum Mode** (manual module selection) and **Jamo Mastery Mode** (adaptive progression).
- **Mastery Progress Badge:** Header indicator displaying the current stage and unlocked Jamos count (e.g. `Jamo 6/33 • ㅓ,ㅏ,ㅇ,ㄹ,ㅗ,ㅣ`).
- **Virtual Keyboard Status:** Visual styling on keycaps distinguishing between **Locked** (muted), **Learning/Active** (highlighted), and **Mastered** (standard/badged) Jamos.
- **Persistence & Reset:** Storage in `LocalStorage` (`korean_tutor_mastery`) with an option in Settings to reset mastery progress.

---

## Current Work & Next Steps

1. **Create `src/types/mastery.ts`**: Types for Jamo mastery stats, state, progression items, and tutor modes.
2. **Implement `src/utils/jamoMastery.ts`**: Core progression array, mastery checking, curriculum filtering, and weighted item selection.
3. **Integrate into `src/lib/tutorSession.ts`**: Dual-mode session handling, Jamo telemetry tracking, and dynamic item scheduling.
4. **Update UI Components**:
   - `VirtualKey.svelte` & `VirtualKeyboard.svelte`: Mastery status keycap rendering.
   - `TopBar.svelte`: Dual-mode toggle and mastery badge.
   - `SettingsModal.svelte`: Reset mastery progress control.
   - `App.svelte`: Mode binding and state synchronization.
5. **Verify with Vitest & Lint**: Comprehensive unit tests covering mastery progression, filtering, and session transitions.
