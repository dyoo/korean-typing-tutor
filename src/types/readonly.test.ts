import { describe, it, expectTypeOf } from 'vitest';
import type { DeepReadonly } from './readonly';

describe('DeepReadonly type utility', () => {
  it('makes primitives, nested objects, arrays, and maps deeply readonly', () => {
    interface ComplexStructure {
      title: string;
      tags: string[];
      nested: {
        score: number;
        history: { attempt: number }[];
      };
      cache: Map<string, number[]>;
    }

    type Immutable = DeepReadonly<ComplexStructure>;

    expectTypeOf<Immutable['title']>().toEqualTypeOf<string>();
    expectTypeOf<Immutable['tags']>().toEqualTypeOf<readonly string[]>();
    expectTypeOf<Immutable['nested']['score']>().toEqualTypeOf<number>();
    expectTypeOf<Immutable['nested']['history']>().toEqualTypeOf<
      readonly { readonly attempt: number }[]
    >();
    expectTypeOf<Immutable['cache']>().toEqualTypeOf<ReadonlyMap<string, readonly number[]>>();
  });
});
