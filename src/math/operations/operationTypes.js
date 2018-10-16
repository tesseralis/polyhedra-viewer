// @flow strict

import { Vec3D } from 'math/geom';
import { Polyhedron } from 'math/polyhedra';
import type { VertexArg } from 'math/polyhedra';

export type OpName =
  | 'truncate'
  | 'rectify'
  | 'sharpen'
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

type SelectState = 'selected' | 'selectable';

/**
 * Object that describes the shape of an operation applied on a polyhedron
 * and the related functionality.
 */
export interface Operation<Options = {}> {
  apply(polyhedron: Polyhedron, options: Options): Polyhedron | PartialOpResult;

  getSearchOptions?: (polyhedron: Polyhedron, options: Options) => ?{};

  getHitOption?: (
    polyhedron: Polyhedron,
    hitPnt: Vec3D,
    options?: Options,
  ) => *;

  getAllOptions?: (polyhedron: Polyhedron) => $Shape<Options>[];

  getSelectState?: (
    polyhedron: Polyhedron,
    options: Options,
  ) => (?SelectState)[];
}
