// @flow strict
import { dual } from './dual';
import { truncate, rectify } from './truncate';
import { cumulate } from './cumulate';
import { expand, snub } from './expand';
import { contract } from './contract';
import { augment, elongate, gyroelongate } from './augment';
import { diminish, shorten } from './diminish';
import { gyrate } from './gyrate';

export const operations = {
  dual,
  truncate,
  rectify,
  cumulate,
  expand,
  snub,
  contract,
  augment,
  elongate,
  gyroelongate,
  diminish,
  shorten,
  gyrate,
};

export { deduplicateVertices } from './operationUtils';

export type { OpName, OperationResult } from './operationTypes';
