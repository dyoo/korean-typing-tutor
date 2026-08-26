# Korean Keys-Per-Minute (KPM / 타수) & Inter-Keystroke Latency Specification

## 1. Overview & Objectives

This document defines the metrics, mathematical formulas, timing mechanics, data storage structures, and **bounded memory guarantees** for tracking typing speed (Keys-Per-Minute / Strokes-Per-Minute / 타수), **Inter-Keystroke Interval (IKI)** latency diagnostics, and **Bigram Transition Friction** in the Korean Typing Tutor.

The goals are:
- **Traditional Alignment**: Adhere to standard Korean typing benchmarks (Hancom 타자연습 타수 / 타/분 standards).
- **Educational Fairness**: Measure active typing effort without penalizing reading, preparation, or external interruptions.
- **Accuracy & Speed Dual-Tracking**: Record both gross motor throughput and effective net production rate.
- **Inter-Keystroke Latency (IKI) & Bigram Diagnostics**: Track transition latency and error rates between consecutive key transitions (e.g. `ㅅ` $\rightarrow$ `ㄱ`, `ㅗ` $\rightarrow$ `ㅐ`, `ㄹ` $\rightarrow$ `ㄱ`) to identify finger travel friction, awkward same-hand stretches, and compound Jamo bottlenecks.
- **Strict Bounded Memory & Storage**: All persistent metrics and in-memory caches have mathematically provable $O(1)$ upper bounds, ensuring the entire dataset never exceeds **~50 KB** in `localStorage` regardless of lifetime usage.

---

## 2. Core Metrics & Formulas

### 2.1 Numerator: Stroke Definition (타수)

Korean typing speed is measured in **Canonical Target Strokes (타수)** rather than arbitrary physical keydowns:

1. **Simple Jamo**: 1 stroke (e.g., `ㄱ`, `ㄴ`, `ㅏ`, `ㅣ`).
2. **Shifted Jamo (Tense Consonants & Shifted Vowels)**: 1 stroke (e.g., `ㄲ`, `ㄸ`, `ㅃ`, `ㅆ`, `ㅉ`, `ㅒ`, `ㅖ`).
   * *Rationale*: `Shift` is a chorded modifier, counting as 1 functional input action matching standard Korean typing benchmarks.
3. **Compound Vowels**: 2 strokes (or 3 for `ㅙ`).
   * `ㅘ` (`ㅗ` + `ㅏ`) = 2 strokes.
   * `ㅝ` (`ㅜ` + `ㅓ`) = 2 strokes.
   * `ㅙ` (`ㅗ` + `ㅐ`) = 3 strokes (decomposed key sequence).
4. **Compound Final Consonants (Double Batchim)**: 2 strokes.
   * `ㄳ` (`ㄱ` + `ㅅ`) = 2 strokes.
   * `ㄵ` (`ㄴ` + `ㅈ`) = 2 strokes.
   * `ㄼ` (`ㄹ` + `ㅂ`) = 2 strokes.
   * `ㄾ` (`ㄹ` + `ㅌ`) = 2 strokes.
5. **Whitespace & Punctuation**: 1 stroke per Space, comma, period, question mark, or exclamation point.

---

### 2.2 Denominator: Timing & Active Duration Mechanics

1. **Timer Start**:
   * The clock starts on the **first keystroke** of an exercise prompt.
   * Reading, translating, or inspecting the keyboard before typing the first key incurs **zero time penalty**.
2. **Timer End**:
   * The clock stops on the **final keystroke** completing the prompt.
3. **Pause Clamping (Idle Threshold)**:
   * To prevent external distractions (coffee breaks, phone calls, looking away) from artificially tanking statistics, inter-keystroke intervals (IKI, $\Delta t = t_i - t_{i-1}$) are clamped:
     $$\Delta t_{\text{effective}} = \min(\Delta t, 2000\text{ ms})$$
   * Pauses up to **2.0 seconds** are recorded in full to capture authentic cognitive hesitation and key-searching latency.
   * Any idle time exceeding 2.0 seconds is capped at 2.0 seconds.
4. **Active Typing Time Calculation**:
   $$\text{Active Duration (ms)} = \sum_{i=1}^{N-1} \min(t_i - t_{i-1}, 2000\text{ ms})$$
   where $t_0, t_1, \dots, t_{N-1}$ are the timestamps of all physical keystrokes made during the exercise.
   * If $\text{Active Duration} < 50\text{ ms}$ or $N < 2$, a minimal baseline of $100\text{ ms}$ is used to prevent division by zero.

---

### 2.3 Mathematical Formulas

* **Net KPM (Effective 타/분)**:
  $$\text{Net KPM} = \frac{\text{Canonical Target Strokes}}{\text{Active Duration (ms)} / 60000}$$

* **Gross KPM (Raw Finger Throughput)**:
  $$\text{Gross KPM} = \frac{\text{Total Raw Keystrokes (including errors & backspaces)}}{\text{Active Duration (ms)} / 60000}$$

* **Typing Accuracy / Efficiency**:
  $$\text{Accuracy (\%)} = \frac{\text{Canonical Target Strokes}}{\text{Total Raw Keystrokes}} \times 100\%$$

* **Natural Error Penalty**:
  * Errors are not mathematically deducted from Net KPM with an arbitrary multiplier because correcting mistakes via Backspace naturally increases $\text{Active Duration}$ and inflates $\text{Total Raw Keystrokes}$, lowering both Net KPM and Accuracy organically.

---

### 2.4 Operational Edge Cases

1. **Prompt Length Filtering & Outlier Protection**:
   * Single-character or 1–2 stroke prompts (e.g., individual Jamo drills like `ㄱ` in early stages) are filtered out from per-exercise KPM logs to avoid extreme numerical spikes ($>1000$ KPM on 100ms single presses).
   * Minimum Stroke Count: Only prompts with **$\ge 3$ canonical strokes** (e.g., full syllables like `한` or multi-syllable words) generate standalone exercise history records.
   * Cumulative Totals: Keystrokes and active time from all prompts are still accumulated into lifetime aggregate counters.
2. **Error Latency Attribution**:
   * When an error occurs, the transition latency is recorded in the exercise buffer, but **only correct target transitions** update the latency maps (`JamoLatencyMap` & `BigramTransitionMap`) to ensure wandering mistakes do not distort authentic key transition profiles. Errors increment the bigram's `errorCount`.
3. **Prompt Abandonment / Mode Switching**:
   * If a user switches modules or modes midway through typing an incomplete prompt, the active exercise keystroke buffer is discarded without logging a corrupted record or skewing lifetime averages.

---

## 3. Inter-Keystroke Interval (IKI) & Bigram Diagnostics

### 3.1 Intra-Exercise Keystroke Event Model
During active typing of an exercise prompt, each keystroke captures a lightweight transition event in memory:

```typescript
export interface KeystrokeEvent {
  key: string;            // Physical/virtual key (e.g. 'r', 'k', 'Backspace', 'Shift')
  jamo?: string;          // Target Jamo resolved (e.g. 'ㄱ', 'ㅏ', 'ㄲ')
  fromJamo?: string;      // Preceding Jamo in the sequence
  timestamp: number;      // High-precision or Epoch timestamp (ms)
  rawIkiMs: number;       // Raw elapsed ms since prior keystroke
  clampedIkiMs: number;   // min(rawIkiMs, 2000)
  isCorrect: boolean;     // Whether keystroke matched target expectations
}
```

### 3.2 Per-Jamo Latency Aggregates (O(1) Map)
A rolling dictionary tracking latency metrics per Jamo character:

```typescript
export interface JamoLatencyStats {
  totalAttempts: number;    // Total times this Jamo was typed
  totalIkiMs: number;       // Cumulative clamped IKI (ms)
  averageIkiMs: number;     // Mean latency (ms) to reach and type this Jamo
  fastestIkiMs: number;     // Best recorded IKI (ms)
  recentIki: number[];      // Rolling last 10 attempts for sparklines (bounded: length <= 10)
}

export type JamoLatencyMap = Record<string, JamoLatencyStats>;
```

### 3.3 Bigram Transition Friction Map (O(1) Bounded Key Pairs)
A dictionary tracking transition speed and error frequency between consecutive key pairs (e.g., `"ㅅ->ㄱ"`, `"ㅗ->ㅐ"`, `"ㄹ->ㄱ"`):

```typescript
export interface BigramTransitionStats {
  fromJamo: string;         // Preceding Jamo (e.g. 'ㅅ')
  toJamo: string;           // Target Jamo typed (e.g. 'ㄱ')
  totalAttempts: number;    // Total times this transition was executed
  totalIkiMs: number;       // Cumulative clamped transition latency (ms)
  averageIkiMs: number;     // Mean transition latency (ms)
  errorCount: number;       // Mistakes made when attempting this transition
}

export type BigramTransitionMap = Record<string, BigramTransitionStats>;
```

---

## 4. Persistent Storage Schema & Bounded Memory Guarantees

### 4.1 Bounded Memory Proof & Sizing Limits

| Data Structure | Storage Location | Sizing Bound / Invariant | Worst-Case Max Size |
|---|---|---|---|
| **Cumulative Lifetime Totals** (`totalTargetStrokes`, `totalActiveTimeMs`, `totalErrors`, etc.) | `localStorage` | Exactly **8 scalar numbers** | **~100 bytes** ($O(1)$) |
| **Per-Jamo Latency Map** (`JamoLatencyMap`) | `localStorage` | Capped at the **35 standard Dubeolsik keys**; `recentIki` capped at **max 10 elements** | $35 \times \approx 120\text{ B} \approx \mathbf{4.2\text{ KB}}$ ($O(1)$) |
| **Bigram Transition Map** (`BigramTransitionMap`) | `localStorage` | Capped at **max 300 natural Korean bigram pairs**; pruned to top frequent/slow pairs if bound exceeded | $300 \times \approx 90\text{ B} \approx \mathbf{27\text{ KB}}$ ($O(1)$) |
| **Exercise History Buffer** (`recentHistory`) | `localStorage` | Fixed **FIFO ring buffer** strictly capped at **max 200 records** | $200 \times \approx 120\text{ B} \approx \mathbf{24\text{ KB}}$ ($O(N), N=200$) |
| **Intra-Exercise Keystroke Stream** (`KeystrokeEvent[]`) | RAM only | In-memory only; **flushed and reset to `[]` on every prompt completion or switch** | **< 2 KB** in RAM |

**Total Persistent Footprint:** Never exceeds **~55 KB** ($< 1.1\%$ of the standard 5 MB `localStorage` quota) regardless of years of use.

### 4.2 Storage Schema

Stored under versioned `localStorage` key `'korean_typing_tutor_speed_metrics_v1'`:

```typescript
export interface ExerciseSpeedRecord {
  id: string;              // Unique record UUID
  timestamp: number;       // Unix epoch ms
  targetText: string;      // Completed exercise prompt
  targetStrokes: number;   // Canonical strokes (타수)
  rawKeystrokes: number;   // Total physical keys pressed
  activeDurationMs: number;// Filtered active typing duration
  errorCount: number;      // Mistakes made
  backspaceCount: number;  // Backspaces used
  netKpm: number;          // Effective KPM
  grossKpm: number;        // Gross KPM
  accuracy: number;        // Accuracy percentage (0 - 100)
  medianIkiMs: number;     // Median inter-keystroke interval for this exercise
  moduleId?: string;       // Curriculum module ID (Free-form)
  jamoId?: string;         // Focus Jamo ID (Mastery mode)
}

export interface SpeedMetricsStore {
  version: 1;
  totalTargetStrokes: number;
  totalRawKeystrokes: number;
  totalActiveTimeMs: number;
  totalErrors: number;
  totalBackspaces: number;
  totalExercisesCompleted: number;
  bestNetKpm: number;
  jamoLatency: JamoLatencyMap;
  bigramLatency: BigramTransitionMap;
  recentHistory: ExerciseSpeedRecord[]; // Max 200 FIFO records
}
```

---

## 5. Benchmark Reference (타/분)

| Net KPM (타/분) | Skill Level | Description |
|---|---|---|
| **< 100** | Beginner | Learning Jamo key positions and keyboard layout. |
| **100 – 199** | Elementary | Basic syllable formation without constant keyboard searching. |
| **200 – 299** | Intermediate | Fluent word and short phrase typing. |
| **300 – 449** | Advanced | Standard native Korean touch-typist speed. |
| **450 – 599** | Expert | Fast fluent typist with high muscle memory. |
| **600+** | Master | Professional high-speed transcription level. |

---

## 6. User-Facing Measurements & Future Visualizations

The gathered data enables clear, actionable, and non-distracting educational feedback:

### 6.1 Speed & Accuracy Progress Over Time (Trend Charts)
- **Moving Average Sparklines**: Plotting the rolling 10-exercise Net KPM and Accuracy % across the 200-item history buffer.
- **Session Delta**: Indicating progress within the current session (e.g. `+18 KPM vs. session start`).
- **All-Time Peak vs. Current**: Displaying current rolling speed alongside the user's `bestNetKpm` record.

### 6.2 Key-Specific Diagnostics (Heatmaps & Trouble Keys)
- **Virtual Keyboard Latency Heatmap**: Color-coding virtual keyboard keycaps from emerald (fast, low IKI $< 200\text{ms}$) to amber/coral (hesitation $> 600\text{ms}$).
- **"Top 5 Slowest Keys" Spotlight**: Directing user awareness to specific Jamo keys that have the highest average search latency (e.g., `ㅖ`, `ㅉ`, `ㅍ`).

### 6.3 Bigram Friction & Transition Bottlenecks
- **"Top Trouble Transitions" List**: Surfacing the 5 key pairs with the highest hesitation or error rates (e.g., `ㅅ -> ㄱ`, `ㅗ -> ㅐ`, `ㄹ -> ㄱ`).
- **Physical Hand Movement Insights**: Categorizing friction into same-hand reach vs. cross-hand coordination.

### 6.4 Lifetime Practice & Effort Milestones
- **Total Lifetime 타수**: Total canonical strokes completed (e.g. `48,250 타`).
- **Active Time Spent Typing**: Cumulative focused typing duration (e.g. `3h 42m`).
- **Typing Efficiency**: Overall lifetime accuracy ratio (`Total Target Strokes / Total Keystrokes`).

### 6.5 Live In-Practice Feedback (Optional / Distraction-Free)
- **Minimalist Top Bar Badge**: Optional compact indicator (e.g. `245 타/분 · 98%`) toggleable in Settings to ensure typists who prefer pure silence/minimalism can keep it hidden.
