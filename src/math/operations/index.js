// @flow strict
import { truncate, rectify, sharpen } from './truncateOps';
import { dual, expand, snub, contract, twist } from './resizeOps';
import { elongate, gyroelongate, shorten, turn } from './prismOps';
import { augment, diminish, gyrate } from './cutPasteOps';

export type { Operation, Options } from './makeOperation';

export const operations = {
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

export type OpName = $Keys<typeof operations>;
