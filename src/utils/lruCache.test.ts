import { describe, it, expect } from 'vitest';
import { LruCache } from './lruCache';

describe('LruCache', () => {
  it('throws an error for non-positive or non-integer capacities', () => {
    expect(() => new LruCache(0)).toThrow(RangeError);
    expect(() => new LruCache(-5)).toThrow(RangeError);
    expect(() => new LruCache(2.5)).toThrow(RangeError);
    expect(() => new LruCache(NaN)).toThrow(RangeError);
  });

  it('stores and retrieves items correctly', () => {
    const cache = new LruCache<string, number>(3);
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();

    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
  });

  it('updates existing keys without incrementing size', () => {
    const cache = new LruCache<string, string>(2);
    cache.set('k1', 'val1');
    cache.set('k2', 'val2');
    expect(cache.size).toBe(2);

    cache.set('k1', 'val1_updated');
    expect(cache.size).toBe(2);
    expect(cache.get('k1')).toBe('val1_updated');
  });

  it('evicts least recently used items when capacity is exceeded', () => {
    const cache = new LruCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Cache is full [a, b, c]. Adding 'd' should evict 'a' (oldest).
    cache.set('d', 4);
    expect(cache.size).toBe(3);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBe(2);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('promotes accessed items on get() so unaccessed older items are evicted first', () => {
    const cache = new LruCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Access 'a', making recency order: [b, c, a]
    expect(cache.get('a')).toBe(1);

    // Inserting 'd' should evict 'b', NOT 'a'
    cache.set('d', 4);
    expect(cache.size).toBe(3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
    expect(cache.get('d')).toBe(4);
  });

  it('clears all items when clear() is called', () => {
    const cache = new LruCache<string, number>(3);
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.size).toBe(2);

    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('b')).toBeUndefined();
  });
});
