# Project Plan: Korean Typing Tutor

## Overview
A minimalist Progressive Web App (PWA) designed to help English speakers learn Korean through focused typing practice. The app focuses on converting English QWERTY keystrokes into Korean Jamo and then assembling them into syllables.

## Technical Stack
- **Framework:** Svelte (with Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **PWA:** `vite-plugin-pwa`
- **Storage:** `LocalStorage` (Local-only, no backend)

## Project Phases

### Phase 1: Core Engine (In Progress)
- [x] Project scaffolding (Svelte + Vite + TS + Tailwind).
- [ ] **The Korean Composition Engine**: Mapping QWERTY $\rightarrow$ Jamo $\rightarrow$ Syllable.
- [ ] **Error Detection**: Identifying character-level mismatches during syllable composition.

### Phase 2: User Interface (Prototype stage)
- [x] Basic minimalist UI with Tailwind.
- [ ] **Content Modes**:
    - **Beginner**: Syllable + Pronunciation.
    - **Intermediate**: Word/Sentence + Translation.
- [ ] **Visual Feedback**: Real-time error underlining.

### Phase 3: Content & Curriculum
- [x] Scalable JSON structure for curriculum.
- [ ] **Curriculum levels**:
    - Level 1: Single Syllables.
    - Level 2: Words.
    - Level 3: Sentences.
    - Level 4: Short stories (TOPIK preparation).

### Phase 4: Persistence & PWA
- [ ] **Local Persistence**: Saving progress (accuracy, WPM, levels) to `LocalStorage`.
- [ ] **PWA Deployment**: Configuring Service Workers and Manifest for offline use and installation.

## Key Challenges
- **Hangul Composition**: The most complex part is the math-heavy conversion of Jamo into Unicode syllables.
- **Offline Syncing**: Ensuring progress is saved correctly while offline for later session resumption.
