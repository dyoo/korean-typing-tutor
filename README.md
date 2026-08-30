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
- **Native Korean Voice Synthesis (TTS)**:
  - Instant, zero-latency Korean speech pronunciation powered by your browser and operating system's
    native speech synthesis engine (Web Speech API).
  - Uses high-quality on-device OS voices (such as Apple Yuna/Siri, Microsoft SunHi, and Google
    Korean) with zero download footprint and full offline support.
  - Instant on-demand playback via the audio play icon and optional automatic pronunciation upon
    exercise appearance or completion.
- **Custom Anki & Flashcard Deck Import**:
  - Drag and drop or browse to import your own Anki deck packages (`.apkg`), tab-separated text
    (`.tsv`), or plain text flashcards (`.txt`, `.csv`) directly from your device.
  - Zero-dependency client-side parser with native SQLite 3 B-Tree record decoding and ZIP
    decompression that runs 100% offline in your browser.
  - Automatically sanitizes HTML/audio tags, cleans metadata placeholders, computes Revised
    Romanization phonetic subtext, and persists imported decks locally in `LocalStorage`.
  - Toggle, filter, or delete imported decks directly from the collapsible "Custom / Anki Decks"
    drawer in the curriculum sidebar.
- **Dual Typing Modes**:
  - **Free-form**: Practice specific modules, custom imported decks, or the entire curriculum with
    randomized order.
  - **Mastery**: A structured progression system that unlocks new Jamos as you improve,
    automatically selecting relevant practice items.
- **Progressive Web App**:
  - Installable on mobile and desktop devices with full offline support.

---

## Curriculum & Educational Sources

Our curriculum dataset ([`src/content/modules/*.json`](src/content/modules)) contains over **7,887+
practice items** across 36 structured modules. Much of the curriculum—including beginner row-by-row
progression drills, expanded vocabulary, K-Pop slang, single-sentence reading passage splits, and
Revised Romanization—was generated, structured, and curated in collaboration with **Antigravity**
(Google DeepMind's agentic AI coding assistant).

### Educational Sources & Standards:

1. **[National Institute of Korean Language (국립국어원 - NIKL)](https://www.korean.go.kr/) —
   [Korean Learner's Vocabulary & Frequency List (한국어 학습용 어휘 목록)](https://www.topikguide.com/korean-frequency-list-top-6000-words/)**:
   - 5,666 high-frequency words across 6 tiered modules (Grade A Elementary, Grade B Intermediate,
     Grade C Advanced) compiled by the National Institute of Korean Language (_국립국어연구원_) and
     indexed by [TOPIK GUIDE](https://www.topikguide.com/korean-frequency-list-top-6000-words/).
     Openly distributed under the **Korea Open Government License (공공누리 / KOGL Type 1:
     Attribution)**.
2. **[NIIED (National Institute for International Education)](https://www.niied.go.kr/) —
   [Official TOPIK Portal](https://www.topik.go.kr/)**:
   - **TOPIK I (Beginner Level 1 & 2):** Official vocabulary covering numbers, time, calendar,
     places, transport, body parts, food, and daily routines.
   - **TOPIK II (Intermediate Level 3 & 4):** Official vocabulary covering work, technology,
     society, economics, emotions, academic topics, and single-sentence reading passages.
3. **[National Institute of Korean Language (국립국어원 - NIKL)](https://www.korean.go.kr/) —
   [Basic Korean Dictionary for Learners (한국어기초사전)](https://krdict.korean.go.kr/)**:
   - Standardized vocabulary and official English translations from the open-access _한국어기초사전_
     (Basic Korean Dictionary for Learners, licensed under CC BY-SA 2.0 KR).
4. **[King Sejong Institute Foundation (세종학당재단)](https://www.ksif.or.kr/) —
   [Sejonghakdang Online Learning Portal (Nuri-Sejong)](https://www.sejonghakdang.org/)**:
   - Practical situational conversation, spoken Q&A dialogues, travel/transit, workplace/campus
     communication, and cultural lifestyle modules based on the open spoken Korean curriculum
     published under the **Korea Open Government License (공공누리 / KOGL Type 1: Attribution)**.
5. **[Korean Proverbs & Sayings (속담 / 사자성어)](https://krdict.korean.go.kr/)**:
   - Classic Korean proverbs and idioms with literal and figurative English translations
     (`식은 죽 먹기`, `티끌 모아 태산`), cross-referenced with the
     **[National Institute of Korean Language (국립국어원)](https://krdict.korean.go.kr/)** and the
     **[Academy of Korean Studies Encyclopedia of Korean Culture (한국민족문화대백과사전)](https://encykorea.aks.ac.kr/Article/E0030198)**.
6. **[Traditional Korean Tongue Twisters (잰말놀이 / 타자 쌘문장)](https://folkency.nfm.go.kr/)**:
   - Traditional Korean tongue twisters and speed-typing challenge sentences curated from the
     **[National Folk Museum of Korea — Encyclopedia of Korean Folk Culture (국립민속박물관 - 한국민속대백과사전)](https://folkency.nfm.go.kr/)**
     folklore archives, speech therapy exercises, and classic typing practice materials
     (`한컴타자연습`, `타닥타닥`).
7. **AI-Generated & Curated Curriculum Expansion**:
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
- **Voice Synthesis**:
  [Web Speech API (SpeechSynthesis)](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Testing**: [Vitest](https://vitest.dev/)
- **Type Checking**:
  [svelte-check](https://github.com/sveltejs/language-tools/tree/master/packages/svelte-check)
- **PWA Support**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)
- **Architecture**: Client-side only (LocalStorage persistence)

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

---

## Offline Usage & Voice Setup Guide

The Korean Typing Tutor is a 100% offline-capable Progressive Web App (PWA). All typing lessons,
Hangul IME composition logic, and Anki parsers run locally in your browser with zero cloud
dependencies.

To ensure **100% offline voice synthesis (speech pronunciation)** without an active internet
connection, verify that an on-device Korean voice is installed in your operating system:

### macOS / iOS (Safari, Chrome, Edge)

1. Open **System Settings** $\rightarrow$ **Accessibility** $\rightarrow$ **Spoken Content**.
2. Click **System Voice** $\rightarrow$ **Manage Voices...**.
3. Search for **Korean** and download **Yuna (Enhanced)** or **Siri**.
4. In the app's Voice Synthesis settings, select **`Yuna (ko-KR) (Offline)`**.

### Windows 11 / 10 (Edge, Chrome)

1. Open **Settings** $\rightarrow$ **Time & Language** $\rightarrow$ **Speech**.
2. Under **Manage voices**, click **Add voices**.
3. Search for **Korean** and install the voice pack (e.g. **Microsoft SunHi** or **Microsoft
   InJoon**).
4. In the app's Voice Synthesis settings, select **`Microsoft SunHi (Offline)`**.

### Android (Chrome, Samsung Internet)

1. Open **Settings** $\rightarrow$ **Accessibility** $\rightarrow$ **Text-to-speech output**.
2. Tap the **gear/settings icon** next to **Preferred engine** (_Google Speech Recognition &
   Synthesis_ or _Samsung TTS_).
3. Select **Install voice data** $\rightarrow$ **Korean** and download the offline voice pack.
4. Voice playback will now work seamlessly in Chrome even in airplane mode.

### Linux (Chromium, Firefox)

Install `speech-dispatcher` and `espeak-ng` via your distribution's package manager:

```bash
sudo apt install speech-dispatcher speech-dispatcher-espeak-ng espeak-ng
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
