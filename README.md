# Korean Typing Tutor

A minimalist, high-performance Progressive Web App (PWA) designed to help English speakers learn
Korean through focused typing practice.

[View the application at https://dyoo.github.io/korean-typing-tutor/](https://dyoo.github.io/korean-typing-tutor/)

## Core Features

- **Distraction-Free Design**:
  - **Zero Animations**: No bouncing, flashing, pulsing, or motion effects. The interface remains
    static, clean, and focused on learning without cognitive overload.
  - **Deliberate Progression**: The user must explicitly press <kbd>Enter</kbd> or <kbd>Space</kbd>
    to advance to the next word, allowing time to inspect and understand their typed input.
- **Universal Dual-Input Engine**:
  - Seamlessly supports both **English QWERTY keystrokes** (converting `r` `k` $\rightarrow$ `가`)
    and **Native Korean 2-set OS Keyboards** (converting `ㄱ` `ㅏ` $\rightarrow$ `가`).
- **Contextual Learning**:
  - Displays Romanized English pronunciation alongside Hangul characters.
  - Displays English translations for words, sentences, reading passages, and proverbs.
- **On-Device Neural Voice Synthesis (TTS)**:
  - High-fidelity Korean speech pronunciation powered by [Kokoro-82M ONNX](https://github.com/dannyyoo/korean-kokoro) and WebAssembly multi-threading.
  - Generates speech 100% locally in the browser with no external network calls or cloud dependencies after one-time offline weight caching.
  - Instant on-demand playback via the audio play icon and optional automatic pronunciation upon exercise completion.
- **Dual Typing Modes**:
  - **Free-form**: Practice specific modules or the entire curriculum with randomized order.
  - **Mastery**: A structured progression system that unlocks new Jamos as you improve,
    automatically selecting relevant practice items.
- **Progressive Web App**:
  - Installable on mobile and desktop devices with full offline support.

---

## Curriculum & Educational Sources

Our curriculum dataset
([`src/content/modules/*.json`](file:///Users/dyoo/work/korean-typing-tutor/src/content/modules))
contains over **1,451+ practice items** across 21 structured modules. Much of the
curriculum—including beginner row-by-row progression drills, expanded vocabulary, K-Pop slang,
single-sentence reading passage splits, and Revised Romanization—was generated, structured, and
curated in collaboration with **Antigravity** (Google DeepMind's agentic AI coding assistant).

### Educational Sources & Standards:

1. **[NIIED (National Institute for International Education)](https://www.niied.go.kr/) —
   [Official TOPIK Portal](https://www.topik.go.kr/)**:
   - **TOPIK I (Beginner Level 1 & 2):** Official vocabulary covering numbers, time, calendar,
     places, transport, body parts, food, and daily routines.
   - **TOPIK II (Intermediate Level 3 & 4):** Official vocabulary covering work, technology,
     society, economics, emotions, academic topics, and single-sentence reading passages.
2. **[National Institute of Korean Language (국립국어원 - NIKL)](https://www.korean.go.kr/) —
   [Basic Korean Dictionary for Learners (한국어기초사전)](https://krdict.korean.go.kr/)**:
   - Standardized vocabulary and official English translations from the open-access _한국어기초사전_
     (Basic Korean Dictionary for Learners, licensed under CC BY-SA 2.0 KR).
3. **[King Sejong Institute Foundation (세종학당재단)](https://www.ksif.or.kr/) —
   [Sejonghakdang Online Learning Portal](https://www.sejonghakdang.org/)**:
   - Practical situational conversation modules (ordering food at cafes/restaurants, taking the
     subway, asking for directions, shopping, hospital/pharmacy symptoms) and intermediate reading
     passages.
4. **[Korean Proverbs & Sayings (속담 / 사자성어)](https://krdict.korean.go.kr/)**:
   - Classic Korean proverbs and idioms with literal and figurative English translations
     (`식은 죽 먹기`, `티끌 모아 태산`), cross-referenced with the
     **[National Institute of Korean Language (국립국어원)](https://krdict.korean.go.kr/)** and the
     **[Academy of Korean Studies Encyclopedia of Korean Culture (한국민족문화대백과사전)](https://encykorea.aks.ac.kr/Article/E0030198)**.
5. **[Traditional Korean Tongue Twisters (잰말놀이 / 타자 쌘문장)](https://folkency.nfm.go.kr/)**:
   - Traditional Korean tongue twisters and speed-typing challenge sentences curated from the
     **[National Folk Museum of Korea — Encyclopedia of Korean Folk Culture (국립민속박물관 - 한국민속대백과사전)](https://folkency.nfm.go.kr/)**
     folklore archives, speech therapy exercises, and classic typing practice materials
     (`한컴타자연습`, `타닥타닥`).
6. **AI-Generated & Curated Curriculum Expansion**:
   - Comprehensive beginner row progression levels (`b1` through `b6`), 100+ K-Pop slang items, 150+
     TOPIK II reading passages, and dynamic Revised Romanization phonetics generated and verified by
     **Antigravity**.

---

## Related Korean Typing Resources

For additional practice and alternative tools, here are other great web applications for learning
how to type Korean:

- **[Sam's Korean Typing Practice](https://type.sam.today/)** – A clean, web-based Korean typing
  practice tool.
- **[Hancom Taja (한컴타자)](https://www.hancomtaja.com/en/)** – The online web edition of Korea's
  classic Hancom typing practice app.

---

## Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Voice Synthesis**: [korean-kokoro](https://github.com/dyoo/korean-tts) & [Kokoro-82M ONNX](https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Testing**: [Vitest](https://vitest.dev/)
- **Type Checking**:
  [svelte-check](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check)
- **PWA Support**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **Architecture**: Client-side only (Dedicated Web Worker, WebAssembly SIMD, LocalStorage & CacheStorage)

---

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Local Development

1. **Clone the repository** (or navigate to the project directory).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the development server**:
   ```bash
   npm run dev
   ```
4. **Open in your browser**: Navigate to `http://localhost:8080`

### Building for Production

To compile the app and generate static build assets in the `dist/` directory:

```bash
npm run build
```

To locally preview the compiled production build from `dist/`:

```bash
npm run preview
```

### Running Tests

We use **Vitest** for automated unit testing to ensure the Korean composition engine is accurate.

- **Run all unit tests**:
  ```bash
  npm test
  ```
- **Run in Watch Mode**:
  ```bash
  npm run test:watch
  ```

## Linting and Type Checking

We use **ESLint** for static analysis and **svelte-check** for cross-component type validation.
Running `npm run lint` runs both in sequence.

- **Run linter and type checker**:
  ```bash
  npm run lint
  ```

## Formatting code

We use **Prettier** for automatic formatting.

- **Run formatter**:
  ```bash
  npm run format
  ```

## Cleaning up the repository

- **Clean build artifacts** (`dist/`):
  ```bash
  npm run clean
  ```
- **Deep clean build artifacts and dependencies** (`dist/` and `node_modules/`):
  ```bash
  npm run clean:all
  npm ci
  ```
- **Dead code detection**: Run `npx knip` to identify unused exports, dead files, and unused
  dependencies.

---

## Attribution & Development

This project was built and vibe coded in pair programming collaboration with **Antigravity**, an
agentic AI coding assistant developed by the Google DeepMind team. Antigravity designed core
components, implemented the Dubeolsik composition engine and dynamic Romanization system, and
generated & curated much of the curriculum content dataset.

---

## License

This project uses a dual-license model:

- **Software Code**:
  [MIT License](file:///Users/dyoo/work/korean-typing-tutor/LICENSE#1-software-code-mit-license)
- **Curriculum Dataset & Content**:
  [Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)](file:///Users/dyoo/work/korean-typing-tutor/LICENSE#2-curriculum-dataset--content-cc-by-sa-40)

See [`LICENSE`](file:///Users/dyoo/work/korean-typing-tutor/LICENSE) for full legal text and
attribution requirements.
