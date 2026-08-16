# Agent Instructions: Korean Typing Tutor

## Project Context

You are assisting in the development of a Korean Typing Tutor PWA. The goal is to create a
distraction-free, high-performance typing experience for English speakers learning Korean.

## Technical Environment

- **Framework**: Svelte (using `<script lang="ts">`)
- **Build Tool**: Vite
- **Styling**: Tailwind CSS (utility classes only)
- **Language**: TypeScript (strict mode)
- **Architecture**: Client-side only (LocalStorage for persistence)

## Coding Conventions

- **Style**: Minimalist and clean.
- **Educational Comments**: Include clear, informative JSDoc and inline comments explaining complex
  logic (such as Hangul composition arithmetic, state transitions, and error evaluation) for
  educational clarity.
- **Distraction-Free UI**: Absolutely NO animations, bouncing elements, pulsing effects, or
  automatic word transitions. The UI must remain static, high-contrast, clean, and deliberate.
- **Quoted Map Keys**: Always use quoted string literals for string keys in maps/objects (e.g.,
  `'r': 0` instead of `r: 0`).
- **TypeScript**: Always use proper types/interfaces (see `src/types/korean.ts`).
- **Component Structure**: Keep Svelte components focused. Logic for complex operations (like Hangul
  composition) should reside in `src/utils/`.
- **Explain Before Significant Changes**: Always explain the rationale and technical design to the
  user before applying significant code changes.
- **VCS Workflow**: Use `jj` (Jujutsu) for version control operations. Never combine creating
  commits/revisions with pushing. Always create commits without pushing unless explicitly requested.
  Do not prefix commit/CL descriptions with conventional commit categories (e.g. avoid `feat:`,
  `fix:`, `chore:`, `style:` prefixes); write direct, plain descriptive summary messages instead. To
  commit changes, always use the two-step sequence: first `jj describe -m "..."` to set the
  description on the current working copy (which contains the actual changes), then `jj new` to
  start a fresh empty revision. **Do not use `jj new -m "..."`** — that creates a new empty revision
  with the message while leaving the working copy's changes in the parent revision with no
  description. When a commit fixes a GitHub issue, include `Fixes #N.` on its own line in the
  description body.
- **Testing**: Always use one-time non-interactive test execution (e.g., `npx vitest run` or
  `npm test` configured with `vitest run`) rather than interactive watch mode.
- **Linting**: Use `npx eslint .` (or `npm run lint`) to perform static analysis and ensure zero
  lint errors across `.ts` and `.svelte` files.
- **Type Checking**: Use `npx svelte-check` (or `npm run lint`) to perform cross-component type
  validation. This catches prop name mismatches, missing imports, and type errors across `.svelte`
  component boundaries that ESLint alone cannot detect.
- **Dead Code Detection**: Use `npx knip` to analyze and identify unused exports, dead files, and
  unused dependencies whenever asked to audit or clean up dead code.
- **Opposite-Hand Shift Chording**: When guiding Shift key targets (e.g. `ㄲ`, `ㅖ`), always
  recommend the opposite-hand Shift key (`right-shift` for left-hand keys `Q`/`W`/`E`/`R`/`T`,
  `left-shift` for right-hand keys `O`/`P`) to reinforce proper touch-typing ergonomics.
- **CSS**: Use Tailwind utility classes directly in the markup.

## Key Files & Modules

- `src/App.svelte`: The primary UI component and interaction handler.
- `src/lib/tutorSession.svelte.ts`: Session controller managing dual-mode (Free-form & Mastery)
  switching, curriculum filtering, item shuffling, accuracy stats, and keystroke routing.
- `src/lib/TopBar.svelte`: Header bar managing Free-form vs. Mastery mode toggling, modules count,
  and prominent focus Jamo badge.
- `src/lib/TargetDisplay.svelte`: Giant target text typography display with dynamic underline
  feedback and dual Romanization + Translation subtext.
- `src/lib/InputDisplay.svelte`: Real-time user input display container with persistent cursor
  carets and click-to-reposition support.
- `src/lib/CharDisplay.svelte`: Per-character unit renderer handling text color coding and
  customizable vertical/horizontal cursor bars.
- `src/lib/VirtualKeyboard.svelte`: Interactive Dubeolsik virtual keyboard layout helper component
  with liquid mastery fill gauges.
- `src/lib/VirtualKey.svelte`: Individual keycap renderer displaying key symbols, Shift
  representations, and progress gauge overlays.
- `src/lib/CurriculumSidebar.svelte`: Free-form modules drawer with categorized accordion groups and
  multi-select filters.
- `src/lib/MasterySidebar.svelte`: Mastery progress drawer with collapsible stage groups and
  per-Jamo radio selection for manual progression override.
- `src/lib/SettingsModal.svelte`: Modal managing theme, Romanization, translation, virtual keyboard,
  font size, cursor color, and Jamo mastery progression adjustments & reset.
- `src/lib/ModeSwitcher.svelte`: Toggle control for switching between Free-form and Mastery modes.
- `src/lib/ExercisePrompt.svelte`: Renders the exercise prompt area in the main UI.
- `src/lib/CurriculumCategoryGroup.svelte`: Accordion group component for categorized curriculum
  module listings in the sidebar.
- `src/lib/DualRangeSlider.svelte`: Dual-handle range slider for settings controls.
- `src/lib/ShiftKey.svelte`: Shift key indicator component for the virtual keyboard.
- `src/lib/SymbolToggleKey.svelte`: Symbol mode (`?123` / `ㄱㄴㄷ`) toggle keycap used at both ends
  of the mobile bottom row.
- `src/lib/CursorColorSelect.svelte`: Color picker control for customizing cursor color in settings.
- `src/lib/GitHubLink.svelte`: GitHub repository link component in the header.
- `src/lib/settings.ts`: Settings state management, persistence, and default values.
- `src/utils/jamoMastery.ts`: Spaced-repetition mastery state machine, home-row-outward progression
  sequence, rolling 20-attempt accuracy evaluation, and vocabulary filtering.
- `src/utils/hangulEngine.ts`: The Hangul IME composition state machine and keystroke handler.
- `src/utils/hangulDecompose.ts`: Unicode Jamo decomposition and extraction utilities.
- `src/utils/hangulMatch.ts`: Real-time Hangul syllable matching, completion checks, and error
  evaluation.
- `src/utils/hangulTables.ts`: Unicode Hangul tables, Jamo arrays, and compound combination
  dictionaries.
- `src/utils/romanizer.ts`: Revised Romanization phonetic transliteration for Hangul syllables.
- `src/utils/cursorHelper.ts`: Active target and input cursor position calculations and word token
  grouping.
- `src/utils/keyboardHelper.ts`: Logic for computing next required target keys and opposite-hand
  Shift chording hints.
- `src/utils/keyboardData.ts`: Dubeolsik keycap metadata and Jamo-to-key dictionary.
- `src/utils/fontScaler.ts`: Dynamic font size scaling logic for target display text.
- `src/utils/clipboard.ts`: Clipboard read/paste utilities for input handling.
- `src/utils/cursorColor.ts`: Cursor color validation and CSS variable helpers.
- `src/utils/curriculumCategories.ts`: Curriculum module category grouping and label definitions.
- `src/utils/virtualKeyboardShift.ts`: Shift-state tracking helpers for the virtual keyboard.
- `src/types/korean.ts`: Type definitions for the curriculum, lesson items, errors, and IME
  decomposition.
- `src/types/mastery.ts`: Type definitions for Jamo statistics, progression items, and mastery
  state.
- `src/content/modules/*.json`: 21 categorized curriculum and beginner lesson datasets (1,451+
  authentic items).
- `src/content/index.ts`: Curriculum dataset aggregator and canonical module order.
- `vite.config.js`: Configuration for Vite, PWA, and Workbox precaching support.

## Current Priority

Implement **Speed & Accuracy Analytics Panel** (optional live/session WPM and SPM typing speed
feedback) and **Progress Review Charts**.
