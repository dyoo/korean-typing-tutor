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

## 🎯 Current Objective: User Interface Polish & Virtual Keyboard
We have completed Phase 1 (The Hangul Composition Engine). The next goal is enhancing the **Typing Interface** with dual-mode display, WPM calculations, and an interactive Dubeolsik Virtual Keyboard guide.

---

## Detailed Roadmap

### Phase 1: The Hangul Composition Engine (The Brain)
- [x] **QWERTY to Jamo Mapping:** Create a complete mapping of English keys to Korean Jamo (Choseong, Jungseong, Jongseong).
- [x] **The State Machine:** Implement logic to manage the transition between composing an initial consonant, adding a vowel, and adding a final consonant.
- [x] **Unicode Assembly:** Implement the mathematical formula to convert composed Jamo indices into the correct Unicode Hangul Syllable code points.
- [x] **Error Detection Logic:** Real-time comparison between the user's current composition and the target syllable.
- [x] **Unit Testing:** Exhaustive testing with `vitest` to ensure every key combination results in the correct character.

### Phase 2: Minimalist User Interface (The Face)
- [ ] **Typing Interface:** A clean, distraction-free component to render target text.
- [ ] **Virtual Keyboard Helper:** An interactive on-screen Dubeolsik keyboard layout highlighting active keys in real time.
- [ ] **Dual Mode Display:**
    - **Syllable Mode:** Target Syllable + English Pronunciation.
    - **Word/Sentence Mode:** Target Text + English Translation.
- [ ] **Visual Feedback:** Implement target character error styling and active cursor feedback.
- [ ] **Progress & Analytics:** Real-time WPM (Words/Syllables Per Minute) and Accuracy tracking.

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
