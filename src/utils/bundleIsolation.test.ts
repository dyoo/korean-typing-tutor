import { describe, it, expect } from 'vitest';
import { build } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { RollupOutput, OutputChunk } from 'rollup';
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

    const output = (
      Array.isArray(result)
        ? result[0].output
        : (result as unknown as RollupOutput).output
    ) as OutputChunk[];
    const entryChunk = output.find((chunk) => chunk.isEntry && chunk.type === 'chunk');

    expect(entryChunk).toBeDefined();

    // Inspect all resolved module paths bundled into the main entry chunk
    const entryModuleIds = Object.keys(entryChunk?.modules || {});

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

    // Verify that heavy neural model and tokenizer symbols are absent from entry code
    const forbiddenSymbols = ['AutoTokenizer', 'KoreanSpeaker', 'KokoroTTS'];
    for (const sym of forbiddenSymbols) {
      expect(entryChunk?.code).not.toContain(sym);
    }
  }, 20000);
});
