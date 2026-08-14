# Project Plan: Korean Typing Tutor

## Overview

A minimalist, distraction-free Progressive Web App (PWA) designed to help English speakers learn Korean through focused typing practice. The core focus is converting standard QWERTY keystrokes and native Korean OS inputs into Hangul syllables in real-time.

## Technical Stack

- **Framework:** Svelte 5 + Vite
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (v4)
- **Testing:** Vitest (124 / 124 passing unit tests across 14 test suites)
- **PWA:** `vite-plugin-pwa` (PWA manifest & service worker enabled)
- **Storage:** `LocalStorage` (for offline-first progress tracking)

## 🎯 Current Status Summary

Phases 1, 2, 3, 4, and 5 are **COMPLETED**. The application features an authentic Hangul composition engine (QWERTY & native Korean OS 2-set support), strict distraction-free UI, dual Free-form vs. Spaced-Repetition Mastery modes, liquid progress gauge keycaps, prominent focus Jamo indicator, 1,428 authentic curriculum items across 21 categorized modules, modular Svelte 5 component architecture, zero lint/dead-code warnings, and full `LocalStorage` persistence.

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
- [x] **Unit Testing:** Comprehensive Vitest unit tests covering state machine transitions, backspace decomposition, Shift key fallbacks, spacing, and native OS keyboard inputs.

### Phase 2: Minimalist User Interface (The Face) — COMPLETED

- [x] **Distraction-Free Interface:** Clean, static target text display with giant typography, static layout height (zero CLS), zero animations, and zero automatic word jumps.
- [x] **Dual Mode Display:** Simultaneous presentation of Romanization and English translations (`sagwa · apple`).
- [x] **Real-Time Visual Feedback:** Main target display character underlines (neutral gray for untyped, blue for valid partial block, emerald for correct, red for incorrect).
- [x] **Mouse Text Selection & Copying:** Full support for highlighting and copying Korean words without focus stealing.
- [x] **Deliberate Progression & Practice Backspacing:** Requires Enter/Space to advance, while allowing Backspace to edit/re-type completed words.
- [x] **Persistent Caret:** Input cursor remains visible at the end of completed words.
- [x] **On-Screen Virtual Keyboard Helper:** Interactive Dubeolsik virtual keyboard layout highlighting active target keys for beginners with touch/click support and opposite-hand Shift chording recommendations.
- [x] **Modular UI Components:** Clean, decomposed Svelte components (`TopBar.svelte`, `TargetDisplay.svelte`, `InputDisplay.svelte`, `CharDisplay.svelte`, `VirtualKeyboard.svelte`, `VirtualKey.svelte`, `ShiftKey.svelte`, `CurriculumSidebar.svelte`, `CurriculumCategoryGroup.svelte`, `SettingsModal.svelte`).

### Phase 3: Curriculum & Content (The Lessons) — COMPLETED

- [x] **Data-Driven Content Aggregator (`src/content/index.ts`):** Dynamic modules array and items array importing from 21 per-module JSON files (1,428 total items).
- [x] **Beginner Keystroke Modules:** Home row vowels, home row consonants, home row words (100% home row letters), top row, bottom row, shift keys.
- [x] **Syllables & Batchim Modules:** Simple batchim, complex batchim.
- [x] **Vocabulary & Sentences:** Level 3 vocabulary, Level 4 verbs/adjectives, Level 5 phrases.
- [x] **Official TOPIK I & II Datasets:** TOPIK 1 Vocab, TOPIK 1 Verbs, TOPIK Grammar, TOPIK 2 Vocab, TOPIK 2 Passages.
- [x] **Cultural & Practical Content:** Sejong phrases, K-pop slang, Korean culture, Korean proverbs, tongue twisters.
- [x] **Free-form Modules Sidebar:** Multi-select categorized drawer with accordion groups and select/deselect all actions.

### Phase 4: Persistence & Settings (The Experience) — COMPLETED

- [x] **PWA Configuration:** Service worker and Web App Manifest configured via `vite-plugin-pwa`.
- [x] **LocalStorage Module Persistence:** Automatically saving and restoring selected modules and collapsed categories across browser reloads.
- [x] **User Settings Panel:** Theme toggling (System / Light / Dark), Romanization toggle, English translation toggle, Virtual keyboard toggle, Font size clamp slider, and Cursor accent color picker.

### Phase 5: Spaced-Repetition Jamo Mastery Mode (Adaptive Learning) — COMPLETED

- [x] **Home-Row Outward Progression Sequence (35 keys):**
  1. *Stage 1 (Home Index):* `ㅓ`, `ㅏ`, `ㅇ`, `ㄹ`
  2. *Stage 2 (Remaining Home Row):* `ㅗ`, `ㅣ`, `ㅁ`, `ㄴ`, `ㅎ`
  3. *Stage 3 (Top Row):* `ㄱ`, `ㅅ`, `ㄷ`, `ㅈ`, `ㅂ`, `ㅜ`, `ㅡ`, `ㅕ`, `ㅑ`, `ㅛ`, `ㅐ`, `ㅔ`
  4. *Stage 4 (Bottom Row):* `ㅋ`, `ㅌ`, `ㅊ`, `ㅍ`, `ㅠ`
  5. *Stage 5 (Shift Keys):* `ㄲ`, `ㅆ`, `ㄸ`, `ㅉ`, `ㅃ`, `ㅒ`, `ㅖ`
  6. *Stage 6 (Punctuation):* `,`, `.`
- [x] **Mastery Evaluation Criteria:** 20 evaluated attempts with $\ge 95\%$ rolling accuracy on the sliding window.
- [x] **Vocabulary Filtering with Non-Hangul Tolerance:** Real-time eligibility checking allowing spaces, dashes, and punctuation while strictly verifying all constituent Hangul Jamos belong to the unlocked set.
- [x] **Active Learning Biased Selection:** Weighted random selection prioritizing exercises containing the active learning key and struggling Jamos without immediate word repetitions.
- [x] **Stable Exercise Lifecycle:** Active exercise item remains stable during typing; vocabulary array refreshes occur exclusively upon exercise completion in `advanceLevel()`.
- [x] **Visual Progress Gauges:** Liquid vertical fill overlays on virtual keyboard keycaps displaying progress towards mastery.
- [x] **Prominent Focus Jamo Badge:** High-contrast Focus indicator pill in the top navigation bar.
- [x] **Mastery Settings Progression Controls:** Manual stage and individual Jamo milestone jump selector (`Unlock Up To:`) plus full reset control.

---

### Phase 6: Speed & Accuracy Analytics Panel — NEXT PRIORITY

- [ ] **Real-Time WPM / SPM Calculation:** Character-per-minute (CPM) / Syllables-per-minute (SPM) and Words-per-minute (WPM) calculation.
- [ ] **Distraction-Free Toggle:** Optional setting to hide typing speed metrics during practice to preserve a minimalist experience.
- [ ] **Performance Review Summary:** Post-session analytics displaying rolling accuracy, keystroke speed, and trouble keys.
