/**
 * @file lruCache.ts
 * @description Minimal bounded Least-Recently-Used (LRU) cache.
 * Leverages JavaScript Map insertion-order mechanics to provide O(1) get, set,
 * and eviction operations without external dependencies or doubly-linked lists.
 */

export class LruCache<K, V> {
  private readonly capacity: number;
  private readonly map = new Map<K, V>();

  constructor(capacity: number) {
    if (capacity <= 0 || !Number.isInteger(capacity)) {
      throw new RangeError(`LruCache capacity must be a positive integer, received: ${capacity}`);
    }
    this.capacity = capacity;
  }

  /** Current number of cached key-value entries. */
  public get size(): number {
    return this.map.size;
  }

  /**
   * Retrieves a value from the cache and promotes it to the most-recently-used position.
   * Returns undefined if the key is not present.
   */
  public get(key: K): V | undefined {
    if (!this.map.has(key)) {
      return undefined;
    }
    const value = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  /**
   * Inserts or updates a key-value entry, marking it as most recently used.
   * Evicts the least recently used entry if insertion causes size to exceed capacity.
   */
  public set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }
    this.map.set(key, value);
  }

  /** Clears all cached entries. */
  public clear(): void {
    this.map.clear();
  }
}
