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
  | 'contract'
  | 'elongate'
  | 'gyroelongate'
  | 'shorten'
  // | 'twist'
  | 'augment'
  | 'diminish'
  | 'gyrate';

export interface OperationResult {
  result: Polyhedron;
  // TODO This is optional because we "fill in" an option result with defaults
  // but then we have to check for something we're sure to have...
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

  getApplyArgs?: (polyhedron: Polyhedron, hitPnt: Vec3D) => ApplyArgs;

  getAllApplyArgs?: (polyhedron: Polyhedron) => ApplyArgs[];

  isHighlighed?: (
    polyhedron: Polyhedron,
    applyArgs: ApplyArgs,
    face: Face,
  ) => boolean;
}
