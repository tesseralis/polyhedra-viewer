// @flow

import type { Point } from 'math/linAlg';
// TODO move this to a solidtypes file or something
export type VIndex = number;
export type FIndex = number;

type Edge = [VIndex, VIndex];
export interface SolidData {
  vertices: Point[];
  faces: VIndex[][];
  edges?: ?(Edge[]);
}
