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
- **Git Workflow**: Never combine creating commits with pushing. Always create commits without pushing unless explicitly requested.
- **CSS**: Use Tailwind utility classes directly in the markup.

## Key Files & Modules
- `src/App.svelte`: The primary UI component and interaction handler.
- `src/utils/koreanEngine.ts`: The core logic for keystroke mapping and composition.
- `src/types/korean.ts`: Type definitions for the domain model.
- `src/content.json`: The curriculum data.
- `vite.config.ts`: Configuration for Vite and PWA support.

## Current Priority
Implement the **Korean Composition Engine** in `src/utils/koreanEngine.ts`. This must convert standard QWERTY keyboard input into correct Hangul syllable blocks.
