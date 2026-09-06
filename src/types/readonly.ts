/**
 * DeepReadonly<T> recursively transforms all properties, arrays, tuples, sets, and maps
 * into deeply immutable equivalents at compile time.
 *
 * Designed specifically for Svelte 5 `$state.raw(...)` stores and immutable snapshots,
 * preventing accidental in-place mutations of nested structures that bypass reactivity.
 */
export type DeepReadonly<T> = T extends (...args: unknown[]) => unknown
  ? T
  : T extends ReadonlyMap<infer K, infer V>
    ? ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>>
    : T extends ReadonlySet<infer U>
      ? ReadonlySet<DeepReadonly<U>>
      : T extends readonly (infer R)[]
        ? readonly DeepReadonly<R>[]
        : T extends object
          ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
          : T;
