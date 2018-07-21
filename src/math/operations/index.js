// @flow strict
import _ from 'lodash';
import { truncate, rectify, sharpen } from './truncateOps';
import { dual, expand, snub, contract, twist } from './resizeOps';
import { elongate, gyroelongate, shorten, turn } from './prismOps';
import { augment, diminish, gyrate } from './cutPasteOps';
import { normalizeOperation } from './operationUtils';

const rawOps = {
  dual,
  truncate,
  rectify,
  sharpen,
  expand,
  snub,
  contract,
  twist,
  elongate,
  gyroelongate,
  shorten,
  turn,
  augment,
  diminish,
  gyrate,
};

export const operations = _.mapValues(rawOps, normalizeOperation);

export type { OpName, OperationResult } from './operationTypes';
