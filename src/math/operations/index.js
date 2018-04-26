// @flow
import { truncate, rectify } from './truncate';
import { cumulate } from './cumulate';
import { expand } from './expand';
import { augment, elongate, gyroelongate } from './augment';
import { diminish, shorten } from './diminish';
import { gyrate } from './gyrate';

export { canAugment, getAugmentFace, getAugmentGraph } from './augment';
export { getCumulatePolygon } from './cumulate';
export const operationFunctions = {
  truncate,
  rectify,
  cumulate,
  expand,
  augment,
  elongate,
  gyroelongate,
  diminish,
  shorten,
  gyrate,
};
