import { truncate, rectify, sharpen } from './truncateOps';
import { dual, expand, snub, contract, twist } from './resizeOps';
import { elongate, gyroelongate, shorten, turn } from './prismOps';
import { augment, diminish, gyrate } from './cutPasteOps';

import {
  Operation,
  Options,
  OperationResult,
  AnimationData,
} from './makeOperation';

export type Operation = Operation;
export type Options = Options;
export type OperationResult = OperationResult;
export type AnimationData = AnimationData;

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

export type OpName = keyof typeof operations;
