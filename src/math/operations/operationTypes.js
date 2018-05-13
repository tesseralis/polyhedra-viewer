// @flow
import { Polyhedron } from 'math/polyhedra';
import type { Vertex, Face } from 'math/polyhedra';
import type { Vector } from 'math/linAlg';

export interface OperationResult {
  result: Polyhedron;
  name?: ?string;
  animationData?: ?{
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
    face: Face,
  ) => boolean;
}
