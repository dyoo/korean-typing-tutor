# Korean Typing Tutor

A minimalist Progressive Web App (PWA) designed to help English speakers learn Korean through focused typing practice.

## Features

- **Minimalist Design**: A distraction-free interface focused on the learning content.
- **Contextual Learning**:
  - **Beginner**: Displays English pronunciation alongside Korean characters.
  - **Intermediate/Advanced**: Displays English translations for words and sentences.
- **Real-time Feedback**: Immediate visual feedback using subtle red underlines for typing errors.
- **Progressive Web App**: Installable on mobile and desktop, with offline support.

## Tech Stack

- **Framework**: [Svelte](https://svelte.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Testing**: [Vitest](https://vitest.dev/)
- **PWA Support**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

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

- **Run all tests once**:
  ```bash
  npm test
  ```
- **Run in Watch Mode (Recommended)**:
  Runs tests and automatically re-runs them whenever you save a file.
  ```bash
  npm test -- --watch
  ```

## Project Roadmap

- [x] Project scaffolding and environment setup.
- [x] Testing infrastructure set up.
- [ ] **Implement robust Korean Jamo-to-Syllable composition engine.**
- [ ] Build curriculum (Syllables $\rightarrow$ Words $\rightarrow$ Sentences $\rightarrow$ Stories).
- [ ] Implement local progress persistence via `LocalStorage`.
- [ ] Finalize PWA installation and offline service worker.
