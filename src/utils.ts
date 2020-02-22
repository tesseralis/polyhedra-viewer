import _, { ValueIteratee, ListIterateeCustom } from 'lodash';

function mod(a: number, b: number) {
  return a >= 0 ? a % b : (a % b) + b;
}

/**
 * Get the element of the array at the given index, modulo its length
 */
export function getCyclic<T>(array: T[], index: number): T {
  return array[mod(index, array.length)];
}

export function repeat<T>(value: T, n: number) {
  return _.times(n, _.constant(value));
}

/**
 * Create an object from the array using the iteratee
 */
export function mapObject<T, U>(
  arr: T[],
  iteratee: (item: T, i: number) => [string | number, U],
): { [key: string]: U } {
  return _(arr)
    .map(iteratee)
    .fromPairs()
    .value();
}

export function flatMapUniq<T, U>(
  arr: T[],
  iteratee1: (key: T) => U[],
  iteratee2: ValueIteratee<U>,
) {
  return _(arr)
    .flatMap(iteratee1)
    .uniqBy(iteratee2)
    .value();
}

/**
 * Get the single element from the given array.
 */
export function getSingle<T>(array: T[]): T {
  if (array.length !== 1) {
    throw new Error(
      `Expected array to have one element: ${JSON.stringify(array)}`,
    );
  }
  return array[0];
}

/**
 * Like _.find, but throws an error if no valid element found.
 */
// TODO rename this to be something like "findAssert"
export function find<T>(
  array: T[],
  predicate: ListIterateeCustom<T, boolean>,
): T {
  const result = _.find(array, predicate);
  if (result === undefined) {
    throw new Error(`Unable to find the predicate in ${array.toString()}`);
  }
  return result;
}

export function choose<T>(choices: T[]): T {
  const index = Math.floor(Math.random() * choices.length);
  return choices[index];
}

export function pivot<T>(list: T[], value: T) {
  const index = _.indexOf(list, value);
  return [..._.slice(list, index), ..._.slice(list, 0, index)];
}

type Key = string | number | symbol;
export function bimap<K extends Key, V extends Key>(obj: Record<K, V>) {
  const inverse = _.invert(obj) as Record<V, K>;
  return {
    get(key: K): V {
      return obj[key] as V;
    },
    of(val: V): K {
      return inverse[val] as K;
    },
    hasKey(key: Key): key is K {
      return !!(obj as any)[key];
    },
    hasValue(val: Key): val is V {
      return !!(inverse as any)[val];
    },
  };
}
