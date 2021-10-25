/**
 * A Map that supports bidirectional key/value access.
 */
export class BiMap<K, V> {
  #obj: Map<K, V>
  #inv: Map<V, K>

  constructor(entries: Iterable<readonly [K, V]>) {
    const _entries = [...entries]
    this.#obj = new Map(_entries)
    this.#inv = new Map(_entries.map(([k, v]) => [v, k]))
  }

  /**
   * Get the value corresponding to the key
   */
  get(key: K): V {
    return this.#obj.get(key)!
  }

  /**
   * Get the key corresponding to the value
   */
  of(val: V): K {
    return this.#inv.get(val)!
  }

  /**
   * Return whether the bimap contains the given key
   */
  hasKey(key: any): key is K {
    return this.#obj.has(key)
  }

  /**
   * Return whether the bimap contains the given value
   */
  hasValue(val: any): val is V {
    return this.#inv.has(val)
  }

  /**
   * Get the list of all keys in the bimap
   */
  keys(): Iterable<K> {
    return this.#obj.keys()
  }

  /**
   * Get the list of all values in the bimap
   */
  values(): Iterable<V> {
    return this.#obj.values()
  }
}
