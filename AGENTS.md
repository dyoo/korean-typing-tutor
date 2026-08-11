# Agent Instructions: Korean Typing Tutor

## Project Context

You are assisting in the development of a Korean Typing Tutor PWA. The goal is to create a distraction-free, high-performance typing experience for English speakers learning Korean.

## Technical Environment

- **Framework**: Svelte (using `<script lang="ts">`)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (utility classes only)
- **Language**: TypeScript (strict mode)
- **Architecture**: Client-side only (LocalStorage for persistence)

## Coding Conventions

- **Style**: Minimalist and clean.
- **Educational Comments**: Include clear, informative JSDoc and inline comments explaining complex logic (such as Hangul composition arithmetic, state transitions, and error evaluation) for educational clarity.
- **Distraction-Free UI**: Absolutely NO animations, bouncing elements, pulsing effects, or automatic word transitions. The UI must remain static, high-contrast, clean, and deliberate.
- **Quoted Map Keys**: Always use quoted string literals for string keys in maps/objects (e.g., `'r': 0` instead of `r: 0`).
- **TypeScript**: Always use proper types/interfaces (see `src/types/korean.ts`).
- **Component Structure**: Keep Svelte components focused. Logic for complex operations (like Hangul composition) should reside in `src/utils/`.
- **Explain Before Significant Changes**: Always explain the rationale and technical design to the user before applying significant code changes.
- **VCS Workflow**: Use `jj` (Jujutsu) for version control operations. Never combine creating commits/revisions with pushing. Always create commits without pushing unless explicitly requested. Do not prefix commit/CL descriptions with conventional commit categories (e.g. avoid `feat:`, `fix:`, `chore:`, `style:` prefixes); write direct, plain descriptive summary messages instead.
- **Testing**: Always use one-time non-interactive test execution (e.g., `npx vitest run` or `npm test` configured with `vitest run`) rather than interactive watch mode.
- **Opposite-Hand Shift Chording**: When guiding Shift key targets (e.g. `ㄲ`, `ㅖ`), always recommend the opposite-hand Shift key (`right-shift` for left-hand keys `Q`/`W`/`E`/`R`/`T`, `left-shift` for right-hand keys `O`/`P`) to reinforce proper touch-typing ergonomics.
- **CSS**: Use Tailwind utility classes directly in the markup.

## Key Files & Modules

- `src/App.svelte`: The primary UI component and interaction handler.
- `src/lib/tutorSession.ts`: Session controller managing curriculum filtering, item shuffling, accuracy stats, and keystroke routing.
- `src/lib/VirtualKeyboard.svelte`: Interactive Dubeolsik virtual keyboard layout helper component.
- `src/utils/koreanEngine.ts`: The core logic for keystroke mapping, Hangul composition arithmetic, and error evaluation.
- `src/utils/keyboardHelper.ts`: Logic for computing next required target keys and opposite-hand Shift chording hints.
- `src/utils/keyboardData.ts`: Dubeolsik keycap metadata and Jamo-to-key dictionary.
- `src/types/korean.ts`: Type definitions for the domain model.
- `src/content.json`: The curriculum data.
- `vite.config.js`: Configuration for Vite, PWA, and Workbox precaching support.

## Current Priority

Implement **LocalStorage Module Persistence** (saving/restoring selected curriculum modules across browser reloads) and **Speed & Accuracy Analytics Panel** (optional WPM/SPM performance feedback).
