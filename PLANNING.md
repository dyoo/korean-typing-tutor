# Project Plan: Korean Typing Tutor

## Overview

A minimalist, distraction-free Progressive Web App (PWA) designed to help English speakers learn
Korean through focused typing practice. The core focus is converting standard QWERTY keystrokes and
native Korean OS inputs into Hangul syllables in real-time.

## Technical Stack

- **Framework:** Svelte 5 + Vite
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (v4)
- **Testing:** Vitest (124 / 124 passing unit tests across 14 test suites)
- **PWA:** `vite-plugin-pwa` (PWA manifest & service worker enabled)
- **Storage:** `LocalStorage` (for offline-first progress tracking)

## 🎯 Current Status Summary

Phases 1, 2, 3, 4, and 5 are **COMPLETED**. The application features an authentic Hangul composition
engine (QWERTY & native Korean OS 2-set support), strict distraction-free UI, dual Free-form vs.
Spaced-Repetition Mastery modes, liquid progress gauge keycaps, prominent focus Jamo indicator,
1,428 authentic curriculum items across 21 categorized modules, modular Svelte 5 component
architecture, zero lint/dead-code warnings, and full `LocalStorage` persistence.

---

## Detailed Roadmap & Progress

### Phase 1: The Hangul Composition Engine (The Brain) — COMPLETED

- [x] **QWERTY to Jamo Mapping:** Complete Dubeolsik (2-set) key mapping (Choseong, Jungseong,
      Jongseong, Shift keys).
- [x] **Universal Dual-Input Support:** Native support for both raw QWERTY keystrokes and native
      Korean OS 2-set keyboards (`'ㄱ'`, `'ㅏ'`, composed syllables).
- [x] **Standard Shift Key Fallbacks:** Dubeolsik Shift keys (`R`, `E`, `Q`, `T`, `W`, `O`, `P`) and
      fallback for unmapped Shift keys (`Shift+X` -> `ㅌ`).
- [x] **The State Machine:** Logic managing transitions between initial consonants, vowels, final
      consonants, compound vowels (`ㅘ`, `ㅝ`), compound final consonants (`ㄺ`, `ㅄ`), and liaison
      syllable splitting.
- [x] **Unicode Assembly:** Mathematical formula converting composed Jamo indices into Unicode
      Hangul Syllable code points (`(Cho * 21 + Jung) * 28 + Jong + 0xAC00`).
- [x] **Smart Partial Error Detection:** `isPartialOrExactMatch` partial prefix matching preventing
      false red error underlines during active syllable composition.
- [x] **Decomposed Architecture:** Modular engine files (`hangulTables.ts`, `hangulDecompose.ts`,
      `hangulMatch.ts`, `hangulEngine.ts`, `cursorHelper.ts`).
- [x] **Unit Testing:** Comprehensive Vitest unit tests covering state machine transitions,
      backspace decomposition, Shift key fallbacks, spacing, and native OS keyboard inputs.

### Phase 2: Minimalist User Interface (The Face) — COMPLETED

- [x] **Distraction-Free Interface:** Clean, static target text display with giant typography,
      static layout height (zero CLS), zero animations, and zero automatic word jumps.
- [x] **Dual Mode Display:** Simultaneous presentation of Romanization and English translations
      (`sagwa · apple`).
- [x] **Real-Time Visual Feedback:** Main target display character underlines (neutral gray for
      untyped, blue for valid partial block, emerald for correct, red for incorrect).
- [x] **Mouse Text Selection & Copying:** Full support for highlighting and copying Korean words
      without focus stealing.
- [x] **Deliberate Progression & Practice Backspacing:** Requires Enter/Space to advance, while
      allowing Backspace to edit/re-type completed words.
- [x] **Persistent Caret:** Input cursor remains visible at the end of completed words.
- [x] **On-Screen Virtual Keyboard Helper:** Interactive Dubeolsik virtual keyboard layout
      highlighting active target keys for beginners with touch/click support and opposite-hand Shift
      chording recommendations.
- [x] **Modular UI Components:** Clean, decomposed Svelte components (`TopBar.svelte`,
      `TargetDisplay.svelte`, `InputDisplay.svelte`, `CharDisplay.svelte`, `VirtualKeyboard.svelte`,
      `VirtualKey.svelte`, `ShiftKey.svelte`, `CurriculumSidebar.svelte`,
      `CurriculumCategoryGroup.svelte`, `SettingsModal.svelte`).

### Phase 3: Curriculum & Content (The Lessons) — COMPLETED

- [x] **Data-Driven Content Aggregator (`src/content/index.ts`):** Dynamic modules array and items
      array importing from 21 per-module JSON files (1,428 total items).
- [x] **Beginner Keystroke Modules:** Home row vowels, home row consonants, home row words (100%
      home row letters), top row, bottom row, shift keys.
- [x] **Syllables & Batchim Modules:** Simple batchim, complex batchim.
- [x] **Vocabulary & Sentences:** Level 3 vocabulary, Level 4 verbs/adjectives, Level 5 phrases.
- [x] **Official TOPIK I & II Datasets:** TOPIK 1 Vocab, TOPIK 1 Verbs, TOPIK Grammar, TOPIK 2
      Vocab, TOPIK 2 Passages.
- [x] **Cultural & Practical Content:** Sejong phrases, K-pop slang, Korean culture, Korean
      proverbs, tongue twisters.
- [x] **Free-form Modules Sidebar:** Multi-select categorized drawer with accordion groups and
      select/deselect all actions.

### Phase 4: Persistence & Settings (The Experience) — COMPLETED

- [x] **PWA Configuration:** Service worker and Web App Manifest configured via `vite-plugin-pwa`.
- [x] **LocalStorage Module Persistence:** Automatically saving and restoring selected modules and
      collapsed categories across browser reloads.
- [x] **User Settings Panel:** Theme toggling (System / Light / Dark), Romanization toggle, English
      translation toggle, Virtual keyboard toggle, Font size clamp slider, and Cursor accent color
      picker.

### Phase 5: Spaced-Repetition Jamo Mastery Mode (Adaptive Learning) — COMPLETED

- [x] **Home-Row Outward Progression Sequence (35 keys):**
  1. _Stage 1 (Home Index):_ `ㅓ`, `ㅏ`, `ㅇ`, `ㄹ`
  2. _Stage 2 (Remaining Home Row):_ `ㅗ`, `ㅣ`, `ㅁ`, `ㄴ`, `ㅎ`
  3. _Stage 3 (Top Row):_ `ㄱ`, `ㅅ`, `ㄷ`, `ㅈ`, `ㅂ`, `ㅜ`, `ㅡ`, `ㅕ`, `ㅑ`, `ㅛ`, `ㅐ`, `ㅔ`
  4. _Stage 4 (Bottom Row):_ `ㅋ`, `ㅌ`, `ㅊ`, `ㅍ`, `ㅠ`
  5. _Stage 5 (Shift Keys):_ `ㄲ`, `ㅆ`, `ㄸ`, `ㅉ`, `ㅃ`, `ㅒ`, `ㅖ`
  6. _Stage 6 (Punctuation):_ `,`, `.`
- [x] **Mastery Evaluation Criteria:** 20 evaluated attempts with $\ge 95\%$ rolling accuracy on the
      sliding window.
- [x] **Vocabulary Filtering with Non-Hangul Tolerance:** Real-time eligibility checking allowing
      spaces, dashes, and punctuation while strictly verifying all constituent Hangul Jamos belong
      to the unlocked set.
- [x] **Active Learning Biased Selection:** Weighted random selection prioritizing exercises
      containing the active learning key and struggling Jamos without immediate word repetitions.
- [x] **Stable Exercise Lifecycle:** Active exercise item remains stable during typing; vocabulary
      array refreshes occur exclusively upon exercise completion in `advanceLevel()`.
- [x] **Visual Progress Gauges:** Liquid vertical fill overlays on virtual keyboard keycaps
      displaying progress towards mastery.
- [x] **Prominent Focus Jamo Badge:** High-contrast Focus indicator pill in the top navigation bar.
- [x] **Mastery Settings Progression Controls:** Manual stage and individual Jamo milestone jump
      selector (`Unlock Up To:`) plus full reset control.

---

### Phase 6: Mastery Mode Experience Improvements (Curated Jamo Banks & Interleaved Sentence Checkpoints) — COMPLETED

- [x] **Curated Stage-Specific Jamo Word Banks (`src/content/masteryVocabulary.ts`):** Ensure every
      Jamo in the progression sequence has authentic Korean words/short expressions constructed
      strictly from cumulative unlocked keys (expanded to $\ge 10$ authentic items per Jamo across
      all Compound Batchims and Shift Keys).
- [x] **Mastery Progression Banks in Free-Form Mode:** Added 5 dedicated curriculum modules
      (`Home Row Mastery`, `Top Row Mastery`, `Bottom Row Mastery`, `Shift Keys Mastery`,
      `Compound Batchim Mastery`) as a category right after Final Consonants in Free-form mode.
- [x] **Iconic Public Domain Literature & Poetry:** Integrated famous poems and literary quotes by
      King Sejong, Yun Dong-ju, Kim Sowol, Han Yong-un, Jeong Ji-yong, Yi Yuk-sa, and Hwang Jin-i
      into the Sentence Milestone Checkpoints.
- [x] **Length-Restricted Jamo Introduction:** Avoid long sentences while introducing new letter
      keys by restricting the exercise pool during Jamo stages to short words ($\le 12$ characters /
      1–3 words).
- [x] **Interleaved Sentence Milestone Checkpoints:** Add dedicated Sentence Checkpoints (`Home`,
      `Top`, `Alphabet`, `Shift`, `Mastery`) between major keyboard sections featuring authentic
      sentences.
- [x] **Sentence Mastery Completion Tracking:** Implement a 15-completed-sentence requirement to
      graduate each sentence checkpoint and advance to the next keyboard section.
- [x] **Mastery Completion Modal Dialog (`MasteryCompletionModal.svelte`):** Congratulate the
      learner upon completing the entire mastery path and provide clear, one-click pathways to
      switch to Free-form mode or open the Mastery Drawer to review or reset progression.
- [x] **Mastery Sidebar & TopBar Milestone Updates:** Render sentence checkpoints with `Milestone:`
      prefix in the sidebar, live completion counters (`X/15`), single-line responsive layouts, and
      dedicated TopBar milestone pills.

---

### Phase 7: Speed & Accuracy Analytics Panel — CURRENT PRIORITY

- [ ] **Real-Time WPM / SPM Calculation:** Character-per-minute (CPM) / Syllables-per-minute (SPM)
      and Words-per-minute (WPM) calculation.
- [ ] **Distraction-Free Toggle:** Optional setting to hide typing speed metrics during practice to
      preserve a minimalist experience.
- [ ] **Performance Review Summary:** Post-session analytics displaying rolling accuracy, keystroke
      speed, and trouble keys.

---

### Phase 8: Kokoro TTS Voice Synthesis (WebAssembly & Web Worker) — COMPLETED

Add local, high-fidelity Korean text-to-speech pronunciation support using Kokoro-82M via
`korean-kokoro` and `kokoro-js`.

- [x] **Stage 1: Dependencies & Settings Infrastructure**
  - [x] Add `korean-kokoro` and `kokoro-js` to `package.json`.
  - [x] Extend `TutorSettings` in `src/lib/settings.ts` with:
    - `enableTTS: boolean` (default: `false` — disabled by default).
    - `ttsVoice: string` (default: `'jf_nezumi'`).
    - `ttsSpeed: number` (default: `1.0`).

- [x] **Stage 2: Dedicated TTS Web Worker (`src/workers/tts.worker.ts`)**
  - [x] Initialize `KoreanSpeaker` with WASM backend & multi-threading inside a Dedicated Worker.
  - [x] Implement Worker message protocol (`LOAD_MODEL`, `SYNTHESIZE`, `CHECK_CACHE`, `CLEAR_CACHE`,
        `PROGRESS`).
  - [x] Run phonology conversion (Hangul-to-IPA) and ONNX WASM model inference entirely off the main
        thread.

- [x] **Stage 3: Main Thread TTS Controller Service (`src/utils/ttsController.svelte.ts`)**
  - [x] Manage Worker lifecycle, audio playback cache for prompt sentences, and error handling.
  - [x] Reactive state tracking (`isModelLoaded`, `isLoading`, `downloadProgress`, `isSpeaking`).
  - [x] Provide unified `speak(text)`, `preload(text)`, and `stop()` methods with in-memory caching.

- [x] **Stage 4: Download Consent Modal & Settings UI**
  - [x] Build `TTSDownloadModal.svelte` confirmation dialog explaining the ~80MB one-time model
        download when the user toggles Voice Synthesis on.
  - [x] Live visual download progress bar in the modal during first-time loading.
  - [x] Add Voice Synthesis section in `SettingsModal.svelte` via `TTSSettingsControl.svelte`:
    - Enable/disable toggle (triggers consent modal if model is not yet downloaded).
    - Voice selection dropdown & playback speed slider.
    - "Clear Offline TTS Cache (~80MB)" button to free browser storage.

- [x] **Stage 5: UI Exercise Prompt Integration & Audio Controls**
  - [x] Embed `TTSAudioButton.svelte` inline with the Romanization and translation subtext line for
        manual on-demand pronunciation playback.
  - [x] Automatic background preloading and caching so clicking the button plays audio immediately
        with zero latency.
  - [x] Optional "Speak on completion" setting allowing speech to play synchronously under user
        typing gestures when an item is completed.
