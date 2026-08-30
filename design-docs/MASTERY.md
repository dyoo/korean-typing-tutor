# Mastery Mode Design Document

The **Mastery Mode** engine is an adaptive, spaced-repetition typing tutor designed to guide
English-speaking learners from zero Korean typing experience to fluent touch-typing on the standard
Dubeolsik (2-set) keyboard layout.

---

## 1. Design Objectives & Principles

1. **Muscle Memory Isolation:** Introduce new finger reaches one key at a time, moving outward
   ergonomically from the home-row index fingers.
2. **Immediate Authenticity:** Practice real Korean words from the very first key combination rather
   than random gibberish strings.
3. **Cognitive Load Management:**
   - **During Jamo Introduction:** Strictly restrict exercises to **short words and concise
     phrases** ($\le 12$ characters / 1–3 words) containing the target Jamo and previously mastered
     letters.
   - **Between Keyboard Sections:** Present dedicated **Sentence Milestone Checkpoints** where
     learners practice medium-to-long sentences to develop typing rhythm, spacebar timing, and
     sentence-level muscle memory.
4. **Graduated Mastery Thresholds:**
   - **Jamo Mastery:** 20 keystrokes evaluated on a sliding window with $\ge 95\%$ rolling accuracy.
   - **Sentence Checkpoint Mastery:** 15 completed sentences.
5. **Deterministic Gating:** Mathematically verify that every single character in an exercise
   belongs to the learner's unlocked letter set before presenting it.

---

## 2. Progression Structure & Sequence

The progression combines single-Jamo learning stages with interleaved sentence checkpoints:

```mermaid
flowchart TD
    subgraph Stage1 ["Stage 1: Home Row Index Keys"]
      J1["ㅓ (j)"] --> J2["ㅏ (k)"] --> J3["ㅇ (d)"] --> J4["ㄹ (f)"]
    end

    subgraph Stage2 ["Stage 2: Home Row Expansion & Vowels"]
      J5["ㅗ (h)"] --> J6["ㅣ (l)"] --> J7["ㅁ (a)"] --> J8["ㄴ (s)"] --> J9["ㅎ (g)"] --> J10["ㅜ (n)"] --> J11["ㅡ (m)"]
    end

    subgraph CP1 ["Sentence Milestone 1"]
      S_HR["Milestone: Home (15 completions)"]
    end

    subgraph Stage3 ["Stage 3: Top Row Keys"]
      J12["ㄱ (r)"] --> J13["ㅅ (t)"] --> J14["ㄷ (e)"] --> J15["ㅈ (w)"] --> J16["ㅂ (q)"]
      J17["ㅛ (y)"] --> J18["ㅕ (u)"] --> J19["ㅑ (i)"] --> J20["ㅐ (o)"] --> J21["ㅔ (p)"]
    end

    subgraph CP2 ["Sentence Milestone 2"]
      S_TH["Milestone: Top (15 completions)"]
    end

    subgraph Stage4 ["Stage 4: Bottom Row Keys"]
      J22["ㅋ (z)"] --> J23["ㅌ (x)"] --> J24["ㅊ (c)"] --> J25["ㅍ (v)"] --> J26["ㅠ (b)"]
    end

    subgraph CP3 ["Sentence Milestone 3"]
      S_FA["Milestone: Alphabet (15 completions)"]
    end

    subgraph Stage5 ["Stage 5: Shift Keys"]
      J27["ㄲ (R)"] --> J28["ㅆ (T)"] --> J29["ㄸ (E)"] --> J30["ㅉ (W)"] --> J31["ㅃ (Q)"] --> J32["ㅒ (O)"] --> J33["ㅖ (P)"]
    end

    subgraph CP4 ["Sentence Milestone 4"]
      S_SK["Milestone: Shift (15 completions)"]
    end

    subgraph Stage6 ["Stage 6: Compound Final Consonants (겹받침)"]
      J34["ㄶ"] --> J35["ㄵ"] --> J36["ㄺ"] --> J37["ㄻ"] --> J38["ㄼ"]
      J39["ㅄ"] --> J40["ㅀ"] --> J41["ㄳ"] --> J42["ㄾ"] --> J43["ㄿ"] --> J44["ㄽ"]
    end

    subgraph CP5 ["Sentence Milestone 5"]
      S_MA["Milestone: Mastery (15 completions)"]
    end

    Stage1 --> Stage2
    Stage2 --> CP1
    CP1 --> Stage3
    Stage3 --> CP2
    CP2 --> Stage4
    Stage4 --> CP3
    CP3 --> Stage5
    Stage5 --> CP4
    CP4 --> Stage6
    Stage6 --> CP5
```

---

## 3. Vocabulary Bank & Length Rules

### Jamo Learning Stages (Short Words & Phrases)

- Target length: $\le 12$ characters (typically 1–3 words).
- Each Jamo step has a dedicated curated bank of authentic words constructed strictly from the
  cumulative set of Jamos unlocked up to that step.
- Long sentences are explicitly excluded during Jamo introduction to prevent cognitive fatigue.

### Sentence Milestone Checkpoints (Medium-to-Long Sentences)

- Target length: $\ge 10$ characters (multi-word natural sentences).
- Focuses on conversational phrasing, honorifics, punctuation, and typing cadence.
- 15 completed sentences advance the learner to the next keyboard section.

---

## 4. Item Selection Algorithm (Two-Pass Selection)

When picking the next exercise in Mastery mode:

1. **Pass 1 — Focus Coin Flip (70% Focus Pool Bias):**
   - If the active stage is a Jamo stage with an unmastered frontier key, 70% of draws are
     restricted strictly to words containing the active Jamo.
   - 30% of draws draw from the entire cumulative unlocked vocabulary to reinforce previously
     learned keys.
2. **Pass 2 — Error-Weighted Random Sampling:**
   - **Base Weight:** `1.0`
   - **Struggling Jamo Bonus:** Continuous error-weighted boost for each constituent Jamo with
     rolling accuracy $< 95\%$:
     $$\text{Weight} = \text{BaseWeight} + \sum_{j \in \text{jamos}} \max(0, (0.95 - \text{Accuracy}_j) \times 8.0)$$
   - **Adaptive Length Multiplier:** Biases word lengths according to the active Jamo's progress
     (0–30%, 30–70%, 70–100%).
   - **No Immediate Repetition:** The item just completed is excluded from candidates whenever
     multiple eligible choices exist.

---

## 5. Error-Weighted Rolling Review Architecture

To ensure learners maintain long-term muscle memory across all previously unlocked keys without the
friction of calendar-based flashcard queues (Anki/SM-2 intervals), the tutor incorporates an
**autonomous rolling error-weighted review engine**:

1. **Continuous Weak Key Detection:** The prompt generator analyzes the 20-keystroke rolling history
   of every unlocked Jamo.
2. **Seamless In-Flow Reinforcement:** Rather than forcing the user into a separate "Review Mode" or
   presenting an intimidating backlog of "overdue" keys, vocabulary containing weaker or error-prone
   keys automatically receives higher sampling probability during standard mastery sessions.
3. **End-of-Stage Cumulative Checkpoints:** Each stage concludes with a 10-sentence Milestone
   checkpoint testing cumulative recall of all keys introduced so far in full authentic Korean
   sentences.

---

## 6. State Persistence & Manual Override

- **Persistence:** Progress is stored in `localStorage` under `korean_tutor_mastery` and debounced
  (30s inactivity or on page unload) to prevent mobile I/O overhead.
- **Manual Stage Selection:** The **Mastery Sidebar** allows learners to manually jump to any
  individual Jamo milestone or Sentence Checkpoint, automatically unlocking preceding keys.
- **Clean Slate Reset:** A reset option clears all Jamo history and sets progress back to Stage 1.

---

## 7. Graduation Celebration & Next Steps

Upon graduating the final Milestone (**Sentence Milestone 5 / Compound Batchim**):

1. **Celebration Dialog (`MasteryCompletionModal.svelte`):** A high-contrast modal dialog appears
   congratulating the learner on mastering all 44 Hangul Jamos and 5 Sentence Milestones.
2. **Actionable Pathways:**
   - **Switch to Free-form Mode:** Easily transition to practice the full 26-module library of
     authentic vocabulary, TOPIK levels, idioms, and literature without progression locks.
   - **Targeted Practice:** Open the Mastery Progress Drawer to jump to any specific stage or
     milestone to hone speed and accuracy on specific keyboard rows.
   - **Batchim Workshop:** Master all 11 complex compound double final consonants (ㄳ, ㄵ, ㄼ, etc.)
     with dedicated focus datasets.
   - **Continue in Master Level:** Keep practicing the rich mix of authentic master-level passages
     and public domain Korean poetry.
