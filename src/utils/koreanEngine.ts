import type { ErrorReport } from '../types/korean';

const HANGUL_BASE = 0xAC00;

export function checkErrors(target: string, input: string): ErrorReport[] {
  const errors: ErrorReport[] = [];
  for (let i = 0; i < input.length; i++) {
    errors.push({ index: i, isError: target[i] !== input[i] });
  }
  return errors;
}

export function compose(input: string): string {
  return input;
}
