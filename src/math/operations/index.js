// @flow
import { truncate, rectify } from './truncate';
import { cumulate } from './cumulate';
import { expand, contract } from './expand';
import { augment, elongate, gyroelongate } from './augment';
import { diminish, shorten } from './diminish';
import { gyrate } from './gyrate';

export { canAugment, getAugmentFace, getAugmentGraph } from './augment';
export { getCumulatePolygon } from './cumulate';
export { getContractPolygon, isExpansionFace } from './expand';
export const operationFunctions = {
  truncate,
  rectify,
  cumulate,
  expand,
  contract,
  augment,
  elongate,
  gyroelongate,
  diminish,
  shorten,
  gyrate,
};
