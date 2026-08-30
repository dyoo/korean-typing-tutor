# Design Documents & Specifications

This directory contains technical design documents, architectural specifications, and implementation roadmaps for the Korean Typing Tutor project.

---

## Documents Index

### 1. [Typing Speed & Latency Analytics (`KPM.md`)](./KPM.md)
* **Topic**: Keystroke timing, speed diagnostics, and latency breakdown.
* **Key Concepts**:
  * Korean Keys-Per-Minute (KPM / 타수) stroke calculation rules (e.g. compound vowels, double consonants).
  * Inter-Keystroke Interval (IKI) latency recording and bigram transition tracking.
  * Idle threshold filtering (2.0s pause clamping) and first-stroke timer initialization.
  * Compact LocalStorage persistence schema (<55 KB).

### 2. [Jamo Mastery Progression Engine (`MASTERY.md`)](./MASTERY.md)
* **Topic**: Mastery Mode pedagogical progression, state machine, and spaced review.
* **Key Concepts**:
  * Home-row-outward 26-stage Jamo unlocking sequence.
  * Rolling 20-attempt accuracy evaluation ($\ge 90\%$ mastery threshold).
  * Error-weighted review sampling (70% focus Jamo / 30% spaced-repetition review).
  * Milestone checkpoints (Vowels, Consonants, Batchim consolidation drills).

### 3. [Project Architecture & Planning Roadmap (`PLANNING.md`)](./PLANNING.md)
* **Topic**: Multi-phase development roadmap, completed milestones, and upcoming feature specifications.
* **Key Concepts**:
  * Completed phase summaries (Hangul engine, virtual keyboard, curriculum expansion, mastery mode, TTS audio, custom Anki decks).
  * Phase 7 speed & latency diagnostics roadmap and progress review charts.
