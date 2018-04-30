// @flow
import _ from 'lodash';

export function atIndices<T>(arr: T[], indices: number[]): T[] {
  return indices.map(i => arr[i]);
}

/**
 * Create an object from the array using the iteratee
 */
export function mapObject<T, U>(
  arr: T[],
  iteratee: (T, number) => [string | number, U],
): { [string]: U } {
  return _(arr)
    .map(iteratee)
    .fromPairs()
    .value();
}

/**
 * Get the single element from the given array.
 */
export function getSingle<T>(array: T[]): T {
  if (array.length !== 1) {
    throw new Error(`Expected array to have one element: ${array.toString()}`);
  }
  return array[0];
}

/**
 * Like _.find, but throws an error if no valid element found.
 */
export function find<T>(array: T[], predicate: (T, number) => boolean): T {
  const result = _.find(array, predicate);
  if (result === undefined) {
    throw new Error(`Unable to find the predicate in ${array.toString()}`);
  }
  return result;
}

/**
 * Replace the given index in the array with the given values. Alternative to "splice".
 */
export function replace<T>(array: T[], index: number, ...values: T[]) {
  const before = _.take(array, index);
  const after = _.slice(array, index + 1);
  return [...before, ...values, ...after];
}

const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
/**
 * Calculate the cartesian product of the given arrays.
 */
export const cartesian = (a: any[], b: any[], ...c: any[]) =>
  b ? cartesian(f(a, b), ...c) : a;
