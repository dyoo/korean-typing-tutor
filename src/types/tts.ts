/**
 * Types and message interfaces for the Kokoro TTS Web Worker protocol.
 */

export interface VoiceMetadata {
  id: string;
  name: string;
  lang: string;
  gender: 'Female' | 'Male';
  traits: string;
  group?: string;
  grade?: string;
}

export type TTSWorkerRequest =
  | { type: 'CHECK_CACHE' }
  | {
      type: 'LOAD_MODEL';
      payload?: { dtype?: 'q8' | 'fp32' | 'fp16' | 'q4'; device?: 'wasm' | 'webgpu' };
    }
  | { type: 'SYNTHESIZE'; payload: { id: string; text: string; voice?: string; speed?: number } }
  | { type: 'CANCEL_SYNTHESIS'; payload?: { id?: string } }
  | { type: 'CLEAR_CACHE' };

export type TTSWorkerResponse =
  | { type: 'CACHE_STATUS'; payload: { isCached: boolean; modelSizeFormatted?: string } }
  | { type: 'LOAD_PROGRESS'; payload: { file: string; progress: number; status: string } }
  | { type: 'LOAD_SUCCESS'; payload: { voices: VoiceMetadata[]; modelSizeFormatted?: string } }
  | { type: 'LOAD_ERROR'; payload: { error: string } }
  | {
      type: 'SYNTHESIS_SUCCESS';
      payload: {
        id: string;
        audioBlobUrl: string;
        audioPcm?: Float32Array;
        sampleRate?: number;
        genTimeMs: number;
        durationSec: number;
        ipa: string;
      };
    }
  | { type: 'SYNTHESIS_CANCELLED'; payload: { id: string } }
  | { type: 'SYNTHESIS_ERROR'; payload: { id: string; error: string } }
  | { type: 'CLEAR_CACHE_SUCCESS' }
  | { type: 'CLEAR_CACHE_ERROR'; payload: { error: string } };
