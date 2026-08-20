# Current Task: Dead-Code Refactoring (resume file)

Session state summary for resuming the duplicated-code audit & refactor. All refactors are
**behavior-preserving** and verified per batch: `npx vitest run` + `npx eslint .` +
`npx svelte-check` + `npx knip`. Conventions: no comments-style conventional prefixes; jj
`describe` → `new`; **use the terms initialConsonant/vowel/finalConsonant (never
Choseong/Jungseong/Jongseong)** in any code or JSDoc we write.

## System architecture (compact — full list in AGENTS.md)

- Svelte (`lang="ts"`) + Vite + Tailwind utilities, PWA, client-only (LocalStorage).
- Two modes: Free-form (curriculum) & Mastery (spaced-repetition Jamo).
- Files this refactor touches:
  - `src/utils/hangulDecompose.ts` — Jamo decomposition (`getSyllableIndices` [private], `assembleSyllable`, `decomposeCharToJamos`, `decomposeStringToJamos`, `decomposeSyllable`, `getInitialConsonantJamo`)
  - `src/utils/hangulEngine.ts` — IME composition state machine (uses `assembleSyllable` from hangulDecompose)
  - `src/utils/hangulTables.ts` — Unicode tables: `HANGUL_BASE`, `*_MAP` (key→index), `*_STANDALONE` arrays, `COMPOUND_*_DECOMP` (index pairs), `STANDALONE_COMPOUND_MAP` (char pairs)
  - `src/utils/keyboardData.ts` — `DUBEOLSIK_ROWS` (key→jamo chars), `JAMO_TO_KEY` (jamo→key/shift/hand)
  - `src/utils/jamoMastery.ts` — `JAMO_PROGRESSION_ORDER` (44 jamo, w/ key/shift/hand/stage), `SENTENCE_CHECKPOINTS` (5), mastery state machine over LocalStorage
  - `src/utils/romanizer.ts`, `src/utils/fontScaler.ts` — phonology/typography data tables
  - `src/lib/*.svelte` — components (VirtualKeyboard, sidebars, modals, TopBar, …); `src/lib/tutorSession.svelte.ts` — session controller; `src/lib/settings.ts` — settings persistence

## Current jj state

- `main` = `c9f8e77` "Reduce sentence milestone checkpoint completion requirement from 15 to 10"
- `7749c46` (xvmkwynw) — **Consolidate duplicated Hangul syllable math and mastery state helpers** (3 files, +167/−136)
- `13173cd` (lmysqkzr) — **Document commit description format in AGENTS.md**
- Working copy: empty (`d1bfed11`). Nothing pushed. Only pending file is this one.
- Baseline green: **173 tests / 18 files pass**, eslint clean, svelte-check 0 issues.
- knip pre-existing findings (NOT regressions): `public/coi-serviceworker.js`, `MAX_AUDIO_CACHE_SIZE` in `src/utils/ttsController.svelte.ts`.

## Completed in commit `7749c46`

- **hangulDecompose.ts**: `getSyllableIndices()` is now the single source of the Unicode
  syllable math (was two divergent formulations); exported `assembleSyllable()` is its inverse.
  `decomposeCharToJamos` + `decomposeSyllable` delegate to it. `getSyllableIndices` is
  deliberately module-private (knip flags exported-but-internal).
- **hangulEngine.ts**: private `assemble()` deleted; `getCurrentChar()` calls `assembleSyllable`.
- **jamoMastery.ts** extracted helpers (all module-private): `MIN_UNLOCKED_COUNT` (=4, replaced
  ≥5 magic numbers), `createEmptyJamoStats()`, `resetJamoStats()`, `createEmptyCheckpointStats()`,
  `clampUnlockedCount()`, `dedupeByTarget()`, `unlockNextJamo()`, `createStarterItem(id)`.

## Completed in commit `36063cb7`

- **knip dead-code configuration & cleanup**: Configured Knip in `package.json` to ignore static `public/coi-serviceworker.js` and removed unused export from `MAX_AUDIO_CACHE_SIZE` in `ttsController.svelte.ts`. Knip runs with 0 warnings.

## Completed in commit `4e830bd0` (H4)

- **keyboardData.ts**: `DUBEOLSIK_KEY_DEFINITIONS` is the single canonical source of truth for Dubeolsik key metadata (`key`, `jamo`, `shiftJamo`, `type`, `hand`, `row`).
  - `DUBEOLSIK_ROWS` partitioned directly from `DUBEOLSIK_KEY_DEFINITIONS`.
  - `JAMO_TO_KEY` derived automatically from `DUBEOLSIK_KEY_DEFINITIONS` and `SYMBOL_ROWS`.
- **hangulTables.ts**: `INITIAL_CONSONANT_MAP`, `VOWEL_MAP`, and `FINAL_CONSONANT_MAP` are dynamically derived from `DUBEOLSIK_KEY_DEFINITIONS` and standalone arrays.
- **jamoMastery.ts**: `key`, `shift`, and `hand` attributes in `JAMO_PROGRESSION_ORDER` are dynamically derived via `JAMO_TO_KEY`.

## Deliberate behavior-preservation traps (do NOT "simplify" these)

1. `resetJamoStats()` does **not** clear `lastPracticed` (3 level-setting paths preserve it);
   `unlockNextJamo()` **does** clear it (2 unlock-next blocks). Matches pre-refactor exactly.
2. `loadMasteryState` uses an explicit `MIN_UNLOCKED_COUNT..length` range check, NOT
   `clampUnlockedCount`: a corrupted out-of-range persisted value resets to the **minimum** (4),
   while `clampUnlockedCount` would clamp to the **maximum**. Comment in code explains this.
3. `lastPracticed` is write-only (persisted, never read) — never add readers without intent.

## What works / the per-batch workflow

extract private helper → swap every call site → run the 4 checks → fix any new knip finding →
`jj describe -m "<first-line summary>\n\n<body: paragraph or bullets of changes>"` → `jj new`.
Component-side batches also need svelte-check (cross-component types).

## What failed / gotchas

- Subagent `task` calls can return empty; resume with `task_id` and ask it to re-emit findings.
- New exports used only in-file trip knip "unused exports" — keep them private.

## Audit backlog (remaining, ranked)

1. **Hangul tables**: `isHangulSyllable()` (4 sites incl. test), derive `STANDALONE_COMPOUND_MAP` from the two DECOMP maps, derive `COMPOUND_BATCHIM_SET`/stage-6 `combination` from them.
2. **Data consolidation**: romanizer `SINGLE_JAMO_PRONUNCIATION` = spread of maps + only 2 overridden keys (`ㄹ:'r/l'`, `ㅇ:'ng'`); hoist the two exact neutralization arrays (`['ㄱ','ㄲ','ㅋ','ㄺ']`, `['ㄷ','ㅅ','ㅆ','ㅈ','ㅊ','ㅌ','ㅎ']`); fontScaler single tier table (15/35/75 + 0.35 weight).
3. **Components**: H1 `MasteryVirtualKey` wrapper (6 exact ~15-line blocks in VirtualKeyboard.svelte), H2 `SidebarDrawer` shell (both sidebars: backdrop/panel/header/Escape), H3 centralized keycap active/base class strings + `SpecialKey` (8 inline buttons; mobile Shift duplicates ShiftKey.svelte); medium: `ProgressFill` ×3, `ModalShell` ×2, accordion chrome ×2, Escape/backdrop ×5+4 (fold into shells if possible), tutorSession `selectMasteryItem(excludeId?)` (tutorSession.svelte.ts:110-121 vs :503-514), settings.ts `pickBool/pickNumberRange/pickEnum` idiom ×15 w/ single `DEFAULT_SETTINGS` source.
4. Considered & REJECTED as duplication (do not re-flag): engine uppercase-fallback vs `resolveKeyOutput` (inverse ops), romanizer liaison vs normal-final maps (different phonology), `handleTargetCopyEvent` (compat shim), SettingsModal vs centered dialogs (intentional UX), `togglePanel` wrappers, `scheduleSave`/`flushPendingSave`, TargetDisplay vs InputDisplay CharDisplay usage, types/*.ts (no dupes).

## Next immediate objective

**Hangul Tables & Combinations**:
1. Add/export `isHangulSyllable(codeOrChar: string | number): boolean` in `hangulDecompose.ts` / `hangulTables.ts` and replace the 4 manual range checks (`0xac00 <= code && code <= 0xd7a3`).
2. Derive `STANDALONE_COMPOUND_MAP` directly by mapping entries in `COMPOUND_VOWEL_DECOMP` and `COMPOUND_FINAL_CONSONANT_DECOMP` to their component standalone characters.
