export * from 'react';
export { default } from 'react';

// TODO is the lack of memoization the reason the tests are running slower?
export const memo = fn => fn;
