# Project Plan: Korean Typing Tutor

## Overview
A minimalist, distraction-free Progressive Web App (PWA) designed to help English speakers learn Korean through focused typing practice. The core focus is converting standard QWERTY keystrokes and native Korean OS inputs into Hangul syllables in real-time.

## Technical Stack
- **Framework:** Svelte 5 + Vite
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (v4)
- **Testing:** Vitest (27 / 27 passing unit tests)
- **PWA:** `vite-plugin-pwa` (PWA manifest & service worker enabled)
- **Storage:** `LocalStorage` (for offline-first progress tracking)

## 🎯 Current Status Summary
Phases 1, 2, and 3 are **COMPLETED**. The application features an authentic Hangul composition engine (QWERTY & native Korean OS 2-set support), strict distraction-free UI, dynamic character underline feedback, dual Romanization + Translation display, 100+ curriculum items (including official TOPIK Level 1 modules), and randomized practice order.

---

## Detailed Roadmap & Progress

### Phase 1: The Hangul Composition Engine (The Brain) — COMPLETED
- [x] **QWERTY to Jamo Mapping:** Complete Dubeolsik (2-set) key mapping (Choseong, Jungseong, Jongseong, Shift keys).
- [x] **Universal Dual-Input Support:** Native support for both raw QWERTY keystrokes and native Korean OS 2-set keyboards (`'ㄱ'`, `'ㅏ'`, composed syllables).
- [x] **Standard Shift Key Fallbacks:** Dubeolsik Shift keys (`R`, `E`, `Q`, `T`, `W`, `O`, `P`) and fallback for unmapped Shift keys (`Shift+X` -> `ㅌ`).
- [x] **The State Machine:** Logic managing transitions between initial consonants, vowels, final consonants, compound vowels (`ㅘ`, `ㅝ`), compound final consonants (`ㄺ`, `ㅄ`), and liaison syllable splitting.
- [x] **Unicode Assembly:** Mathematical formula converting composed Jamo indices into Unicode Hangul Syllable code points (`(Cho * 21 + Jung) * 28 + Jong + 0xAC00`).
- [x] **Smart Partial Error Detection:** `isPartialOrExactMatch` partial prefix matching preventing false red error underlines during active syllable composition.
- [x] **Unit Testing:** 27 Vitest unit tests covering state machine transitions, backspace decomposition, Shift key fallbacks, spacing, and native OS keyboard inputs.

### Phase 2: Minimalist User Interface (The Face) — COMPLETED
- [x] **Distraction-Free Interface:** Clean, static target text display with giant typography, static layout height (zero CLS), zero animations, and zero automatic word jumps.
- [x] **Dual Mode Display:** Simultaneous presentation of Romanization and English translations (`sagwa · apple`).
- [x] **Real-Time Visual Feedback:** Main target display character underlines (neutral gray for untyped, blue for valid partial block, emerald for correct, red for incorrect).
- [x] **Mouse Text Selection & Copying:** Full support for highlighting and copying Korean words without focus stealing.
- [x] **Deliberate Progression & Practice Backspacing:** Requires Enter/Space to advance, while allowing Backspace to edit/re-type completed words.
- [x] **On-Screen Virtual Keyboard Helper:** Interactive Dubeolsik virtual keyboard layout highlighting active target keys for beginners with touch/click support.

### Phase 3: Curriculum & Content (The Lessons) — COMPLETED
- [x] **Data-Driven Content Schema (`src/content.json`):** Dynamic modules array and items array.
- [x] **Level 1 (Basic Syllables):** 28 single character practice items (`가`–`하`, `고`–`조`, `구`–`두`, `기`–`니`).
- [x] **Level 2 (Final Consonants / 받침):** 20 single & compound final consonant items (`산`, `달`, `닭`, `값`, `흙`, etc.).
- [x] **Level 3 (Essential Vocabulary):** 27 everyday nouns (food, animals, places, family, objects).
- [x] **Level 4 (Verbs & Adjectives):** 17 high-frequency action verbs and descriptive adjectives (`먹다`, `마시다`, `크다`, `좋다`).
- [x] **Level 5 (Sentences & Expressions):** 15 daily conversational phrases and expressions (`안녕하세요`, `사과를 먹어요`).
- [x] **Official TOPIK I Modules:** 3 dedicated TOPIK Level 1 modules:
  * **TOPIK I — Essential Nouns** (47 items)
  * **TOPIK I — Verbs & Adjectives** (28 items)
  * **TOPIK I — Grammar & Sentences** (14 items)
- [x] **Level Selector & Shuffling:** Dropdown module picker with Fisher-Yates randomized practice order.

### Phase 4: Persistence & PWA (The Experience) — IN PROGRESS
- [x] **PWA Configuration:** Service worker and Web App Manifest configured via `vite-plugin-pwa`.
- [ ] **LocalStorage Module Persistence (Next Step):** Persisting selected module filter and completed level index in browser `LocalStorage`.
- [ ] **Analytics Stats Panel (Optional Next Step):** Collapsible WPM/SPM (Syllables Per Minute) speed panel for analytical feedback.

### Phase 5: Jamo Spaced Repetition (SRS) Engine (Adaptive Learning) — PLANNED
- [ ] **Jamo Telemetry Engine**: Keystroke-level outcome tracking (first-try accuracy, reaction time latency in ms, Shift modifier correctness) for each individual Jamo (`ㄱ`, `ㄲ`, `ㅖ`, etc.) during typing practice.
- [ ] **Jamo SRS Memory Model & Persistence**: Maintain stability ($S$), difficulty ($D$), and review history per Jamo using an adapted SM-2 / FSRS algorithm persisted in `LocalStorage`.
- [ ] **Automated Quality Rating**: Derive standard SRS recall quality scores (0–5) automatically from typing performance (e.g. fast first-try = 5, hesitant = 3, error/corrected = 1–2).
- [ ] **Adaptive Practice Queue Scheduler**: Compute memory retrievability ($R = e^{-\Delta t / S}$) to dynamically calculate priority scores and build custom practice queues targeting weak Jamos.
- [ ] **Smart Content Selector**: Filter curriculum items from `content.json` that feature weak/due Jamos or dynamically construct targeted Jamo drill sets.
- [ ] **Distraction-Free Keyboard Heatmap**: Optional static color coding on virtual keyboard keycaps to visualize Jamo stability and retention levels without cluttering the main typing UI.

---

## What's Left to Do?

1. **LocalStorage Module Persistence:**
   * Automatically save and restore the user's selected module filter (`topik1_vocab`, `l3`, etc.) across browser reloads.
2. **Speed Analytics Panel (Optional):**
   * An optional toggleable panel calculating Syllables Per Minute (SPM) or Words Per Minute (WPM) without cluttering the main distraction-free typing area.
3. **Jamo Spaced Repetition Engine (Phase 5):**
   * Implement automated Jamo telemetry, SM-2/FSRS retention scheduler, adaptive practice queues, and virtual keyboard heatmap visualization.
