import { Point } from 'types';
export type VIndex = number;
export type FIndex = number;

type Edge = [VIndex, VIndex];
export interface SolidData {
  name: string;
  vertices: Point[];
  faces: VIndex[][];
  edges?: Edge[];
}
