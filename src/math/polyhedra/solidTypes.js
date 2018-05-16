// @flow

import type { Point } from 'math/linAlg';
export type VIndex = number;
export type FIndex = number;

type Edge = [VIndex, VIndex];
export interface SolidData {
  vertices: Point[];
  faces: VIndex[][];
  edges?: ?(Edge[]);
}
