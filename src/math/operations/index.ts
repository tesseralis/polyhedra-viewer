import { truncate, rectify, sharpen } from './truncateOps';
import { dual, expand, snub, contract, twist } from './resizeOps';
import { elongate, gyroelongate, shorten, turn } from './prismOps';
import { augment, diminish, gyrate } from './cutPasteOps';

import { Operation, Options } from './makeOperation';

export type Operation = Operation;
export type Options = Options;

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
