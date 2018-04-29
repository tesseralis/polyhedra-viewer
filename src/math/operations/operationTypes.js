import Polyhedron from 'math/Polyhedron';
import type { Vertex } from 'math/solidTypes';
import type { Vector } from 'math/linAlg';

interface OperationResult {
  result: Polyhedron;
  animationData: {
    start: Polyhedron,
    endVertices: Vertex[],
  };
}

export interface Operation<Options, ApplyArgs> {
  getSearchOptions(polyhedron: Polyhedron, options: Options): any;

  getDefaultArgs(polyhedron: Polyhedron, options: Options): any;

  apply(polyhedron: Polyhedron, options: Options): Polyhedron | OperationResult;

  getApplyArgs(polyhedron: Polyhedron, hitPnt: Vector): ApplyArgs;

  getAllApplyArgs(polyhedron: Polyhedron): ApplyArgs[];

  isHighlighed(
    polyhedron: Polyhedron,
    applyArgs: ApplyArgs,
    fIndex: FIndex,
  ): boolean;
}
