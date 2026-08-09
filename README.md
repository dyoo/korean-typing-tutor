# Korean Typing Tutor

A minimalist, high-performance Progressive Web App (PWA) designed to help English speakers learn Korean through focused typing practice.

## Core Features

- **Distraction-Free Design (Strict Requirement)**:
  - **Zero Animations**: No bouncing, flashing, pulsing, or motion effects. The interface remains static, clean, and focused on learning without cognitive overload.
  - **Deliberate Progression**: The user must explicitly press <kbd>Enter</kbd> or <kbd>Space</kbd> to advance to the next word, allowing time to inspect and understand their typed input.
- **Universal Dual-Input Engine**:
  - Seamlessly supports both **English QWERTY keystrokes** (converting `r` `k` $\rightarrow$ `가`) and **Native Korean 2-set OS Keyboards** (converting `ㄱ` `ㅏ` $\rightarrow$ `가`).
- **Contextual Learning**:
  - Displays Romanized English pronunciation alongside Hangul characters.
  - Displays English translations for words, sentences, reading passages, and proverbs.
- **Real-Time Dynamic Underline Feedback**:
  - Immediate visual feedback using color-coded bottom underlines (Gray = Untyped, Blue = Valid partial composition, Emerald = Correct match, Red = Error).
- **Responsive Korean Word-Boundary Wrapping**:
  - `break-keep` (`word-break: keep-all`) typography wrapping multi-sentence paragraphs naturally at word boundaries across lines without viewport overflow.
- **Mouse Text Selection**:
  - Supports mouse highlighting and copying over Korean text for quick lookup without focus stealing.
- **Progressive Web App**:
  - Installable on mobile and desktop devices with full offline support.

---

## Curriculum & Official Educational Sources

Our curriculum dataset ([`src/content.json`](file:///Users/dyoo/work/korean/src/content.json)) is curated from official, open-access Korean language standards:

1. **[NIIED (National Institute for International Education)](https://www.niied.go.kr/) — [Official TOPIK Study & Exam Resource Center](https://www.topik.go.kr/GBIP/GBIPMNG021.do)**:
   - **TOPIK I (Beginner Level 1 & 2):** Official vocabulary covering numbers, time, calendar, places, transport, body parts, food, and daily routines.
   - **TOPIK II (Intermediate Level 3 & 4):** Official vocabulary covering work, technology, society, economics, emotions, academic topics, and multi-sentence reading passages.
2. **[National Institute of Korean Language (국립국어원 - NIKL)](https://www.korean.go.kr/) — [Basic Korean Dictionary for Learners (한국어기초사전)](https://krdict.korean.go.kr/eng/main) & [NIKL Open API Data Portal](https://krdict.korean.go.kr/openApi/openApiInfo)**:
   - Standardized vocabulary and official English translations from the open-access *한국어기초사전* (Basic Korean Dictionary for Learners, licensed under CC BY-SA 2.0 KR).
3. **[King Sejong Institute Foundation (세종학당재단)](https://www.kingsejong.org/) — [Nuri-Sejonghakdang Standard Textbooks & Learning Materials](https://nuri.sejonghakdang.org/mode/board/B200000.do)**:
   - Practical situational conversation modules (ordering food at cafes/restaurants, taking the subway, asking for directions, shopping, hospital/pharmacy symptoms) and intermediate reading passages.
4. **Korean Proverbs & Sayings (속담 / 사자성어)**:
   - Classic Korean proverbs with literal and figurative English translations (`식은 죽 먹기`, `티끌 모아 태산`).

---

## Tech Stack

- **Framework**: [Svelte 5](https://svelte.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Testing**: [Vitest](https://vitest.dev/)
- **PWA Support**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

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
4. **Open in your browser**:
   Navigate to `http://localhost:5173`

### Running Tests

We use **Vitest** for automated unit testing to ensure the Korean composition engine is accurate.

- **Run all unit tests**:
  ```bash
  npm test -- --run
  ```
- **Run in Watch Mode**:
  ```bash
  npm test -- --watch
  ```

---

## Attribution & Development

This project was vibe coded in pair programming collaboration with **Antigravity**, an agentic AI coding assistant developed by the Google DeepMind team.
