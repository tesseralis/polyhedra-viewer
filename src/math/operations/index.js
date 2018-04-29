// @flow
import { truncate, rectify } from './truncate';
import { cumulate } from './cumulate';
import { expand, snub, contract } from './expand';
import { augment, elongate, gyroelongate } from './augment';
import { diminish, shorten } from './diminish';
import { gyrate } from './gyrate';

export const operations = {
  t: truncate,
  a: rectify,
  k: cumulate,
  e: expand,
  s: snub,
  c: contract,
  '+': augment,
  P: elongate,
  A: gyroelongate,
  '-': diminish,
  h: shorten,
  g: gyrate,
};

export type { OperationResult } from './operationTypes';
