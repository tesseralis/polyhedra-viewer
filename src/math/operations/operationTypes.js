// @flow
import { Polyhedron } from 'math/polyhedra';
import type { Vertex, FIndex } from 'math/polyhedra';
import type { Vector } from 'math/linAlg';

export interface OperationResult {
  result: Polyhedron;
  animationData?: {
    start: Polyhedron,
    endVertices: Vertex[],
  };
}

export interface Operation<Options = {}, ApplyArgs = {}> {
  apply(polyhedron: Polyhedron, options: Options): Polyhedron | OperationResult;

  getSearchOptions?: (polyhedron: Polyhedron, options: Options) => any;

  getDefaultArgs?: (polyhedron: Polyhedron, options: Options) => ApplyArgs;

  getApplyArgs?: (polyhedron: Polyhedron, hitPnt: Vector) => ApplyArgs;

  getAllApplyArgs?: (polyhedron: Polyhedron) => ApplyArgs[];

  isHighlighed?: (
    polyhedron: Polyhedron,
    applyArgs: ApplyArgs,
    fIndex: FIndex,
  ) => boolean;
}
