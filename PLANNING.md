# Project Plan: Korean Typing Tutor

## Overview
A minimalist Progressive Web App (PWA) designed to help English speakers learn Korean through focused typing practice. The core focus is converting standard QWERTY keystrokes into Hangul syllables in real-time.

## Technical Stack
- **Framework:** Svelte + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Testing:** Vitest
- **PWA:** `vite-plugin-pwa`
- **Storage:** `LocalStorage` (for offline-first progress tracking)

## 🎯 Current Objective: QWERTY to Jamo Mapping
We are building the foundation of the **Hangul Composition Engine**. The immediate goal is to create a robust, production-ready mapping of the Dubeolsik (2-set) keyboard layout.

### Implementation Details:
1.  **Mapping Dictionary:** Create a comprehensive `Record<string, { type: 'choseong' | 'jungseong' | 'jongseong'; index: number }>` that maps every QWERTY key to its specific Jamo role and index.
2.  **Handling Case Sensitivity:** Ensuring both lowercase and uppercase (e.g., 'r' and 'Q') map correctly to their respective Jamo.
3.  **Character Categorization:** Distinguishing between:
    *   **Choseong (Initial):** Keys that start a syllable.
    *   **Jungseong (Vowel):** Keys that add a vowel to a syllable.
    *   **Jongseong (Final):** Keys that add a final consonant to a syllable.
4.  **Integration:** This mapping will be used by the `HangulEngine` to drive the state machine.

---

## Detailed Roadmap

### Phase 1: The Hangul Composition Engine (The Brain)
*The most critical and complex phase. We will implement a state machine to handle the lifecycle of a syllable.*
- [ ] **QWERTY to Jamo Mapping:** Create a complete mapping of English keys to Korean Jamo (Choseong, Jungseong, Jongseong).
- [ ] **The State Machine:** Implement logic to manage the transition between composing an initial consonant, adding a vowel, and adding a final consonant.
- [ ] **Unicode Assembly:** Implement the mathematical formula to convert composed Jamo indices into the correct Unicode Hangul Syllable code points.
- [ ] **Error Detection Logic:** Real-time comparison between the user's current composition and the target syllable.
- [ ] **Unit Testing:** Exhaustive testing with `vitest` to ensure every key combination results in the correct character.

### Phase 2: Minimalist User Interface (The Face)
- [ ] **Typing Interface:** A clean, distraction-free component to render the target text.
- [ ] **Dual Mode Display:**
    - **Syllable Mode:** Target Syllable + English Pronunciation.
    - **Word/Sentence Mode:** Target Text + English Translation.
- [ ] **Visual Feedback:** Implement the "underline error" requirement using CSS classes.
- [ ] **Progress Visualization:** A simple progress bar and accuracy meter.

### Phase 3: Curriculum & Content (The Lessons)
- [ ] **Content Schema:** Define a JSON structure for hierarchical learning.
- [ ] **Level 1 (Syllables):** Single character practice.
- [ ] **Level 2 (Words):** Simple vocabulary.
- [ ] **Level 3 (Sentences):** Basic grammar and short phrases.
- [ ] **Level 4 (Stories):** TOPIK-style passages for advanced learners.

### Phase 4: Persistence & PWA (The Experience)
- [ ] **Local Storage Manager:** Saving user progress (Accuracy, WPM, Level) locally.
- [ ] **PWA Configuration:** Setting up the Web App Manifest and Service Worker for offline installation.

## Key Technical Challenges
- **The Math of Hangul:** Handling the Unicode arithmetic for syllable assembly.
- **State Management:** Managing a complex typing state (what part of the syllable is currently being edited) within a reactive Svelte framework.
- **Zero-Latency Feedback:** Ensuring the composition feels "instant" to the user.
