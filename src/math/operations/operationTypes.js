// @flow strict

import { Vec3D } from 'math/linAlg';
import { Polyhedron } from 'math/polyhedra';
import type { Face, VertexArg } from 'math/polyhedra';

export type OpName =
  | 'truncate'
  | 'rectify'
  | 'cumulate'
  | 'dual'
  | 'expand'
  | 'snub'
  // | 'twist'
  | 'contract'
  | 'elongate'
  | 'gyroelongate'
  | 'shorten'
  // | 'turn'
  | 'augment'
  | 'diminish'
  | 'gyrate';

export interface OperationResult {
  result: Polyhedron;
  name: string;
  animationData: ?{
    start: Polyhedron,
    endVertices: VertexArg[],
  };
}

export type Relation = {};

export type PartialOpResult = $Shape<OperationResult>;

/**
 * Object that describes the shape of an operation applied on a polyhedron
 * and the related functionality.
 */
export interface Operation<Options = {}, ApplyArgs = {}> {
  apply(polyhedron: Polyhedron, options: Options): Polyhedron | PartialOpResult;

  getSearchOptions?: (polyhedron: Polyhedron, options: Options) => ?{};

  getApplyArgs?: (
    polyhedron: Polyhedron,
    hitPnt: Vec3D,
    options?: Options,
  ) => ApplyArgs;

  getAllApplyArgs?: (polyhedron: Polyhedron) => ApplyArgs[];

  isHighlighed?: (
    polyhedron: Polyhedron,
    applyArgs: ApplyArgs,
    face: Face,
  ) => boolean;
}
