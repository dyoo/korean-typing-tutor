import { describe, it, expect } from 'vitest';
import { build, type Rollup } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';

describe('Bundle Code-Splitting & Dependency Isolation Tests', () => {
  it('guarantees heavyweight TTS & Transformers libraries are NOT included in the main entry chunk', async () => {
    const rootDir = path.resolve(__dirname, '../..');
    const result = await build({
      root: rootDir,
      configFile: false,
      plugins: [svelte()],
      build: {
        write: false,
      },
      logLevel: 'silent',
    });

    const allChunks = (
      Array.isArray(result)
        ? result[0].output
        : (result as unknown as Rollup.RollupOutput).output
    ).filter((item): item is Rollup.OutputChunk => item.type === 'chunk');

    // 1. Strictly enforce that exactly one root entry chunk is produced
    const entryChunks = allChunks.filter((chunk) => chunk.isEntry);
    expect(entryChunks).toHaveLength(1);

    const mainEntryChunk = entryChunks[0];
    expect(mainEntryChunk.name).toBe('index');
    expect(mainEntryChunk.facadeModuleId).toMatch(/index\.html$/);

    // 2. Inspect all resolved module paths bundled into the main entry chunk
    const entryModuleIds = Object.keys(mainEntryChunk.modules || {});

    const forbiddenPackages = [
      '@huggingface/transformers',
      'kokoro-js',
      '@dannyyoo/korean-tts',
      'onnxruntime',
    ];

    for (const pkg of forbiddenPackages) {
      const leakedModules = entryModuleIds.filter((id) => id.includes(pkg));
      expect(leakedModules).toEqual([]);
    }

    // 3. Verify that heavy neural model and tokenizer symbols are absent from entry code
    const forbiddenSymbols = ['AutoTokenizer', 'KoreanSpeaker', 'KokoroTTS'];
    for (const sym of forbiddenSymbols) {
      expect(mainEntryChunk.code).not.toContain(sym);
    }
  }, 20000);

  it('guarantees TTS Web Worker bundles neural models independently from main client', async () => {
    const rootDir = path.resolve(__dirname, '../..');
    const result = await build({
      root: rootDir,
      configFile: false,
      build: {
        write: false,
        rollupOptions: {
          input: path.resolve(rootDir, 'src/workers/tts.worker.ts'),
        },
      },
      logLevel: 'silent',
    });

    const allChunks = (
      Array.isArray(result)
        ? result[0].output
        : (result as unknown as Rollup.RollupOutput).output
    ).filter((item): item is Rollup.OutputChunk => item.type === 'chunk');

    expect(allChunks.length).toBeGreaterThan(0);
    const workerChunk = allChunks[0];
    const workerModuleIds = Object.keys(workerChunk.modules || {});

    // Worker chunk MUST contain @dannyyoo/korean-tts or transformers
    const containsHeavyModule = workerModuleIds.some(
      (id) => id.includes('korean-tts') || id.includes('transformers'),
    );
    expect(containsHeavyModule).toBe(true);
  }, 20000);
});
