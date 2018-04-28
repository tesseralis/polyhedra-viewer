// @flow
import _ from 'lodash';
import {
  getOperationName,
  getNextPolyhedron,
  getRelations,
  getUsingOpt,
} from './relations';
import Polyhedron from 'math/Polyhedron';
import Vertex from 'math/solidTypes';
import Peak from 'math/Peak';
import { operationFunctions } from 'math/operations';

import {
  getAugmentAlignment,
  getPeakAlignment,
  getCupolaGyrate,
  getGyrateDirection,
} from 'math/applyOptionUtils';

const hasMultiple = (relations, property) =>
  _(relations)
    .map(property)
    .uniq()
    .compact()
    .value().length > 1;

// FIXME (animation) this is inelegant
const updateName = (opResult, name) => {
  if (!opResult.animationData) {
    return {
      result: opResult.withName(name),
    };
  }
  const { result, animationData: { start, endVertices } } = opResult;
  return {
    result: result.withName(name),
    animationData: {
      start: start.withName(name),
      endVertices,
    },
  };
};

export type Operation = 't' | 'r' | 'k' | 'c' | 'e' | '+' | '-' | 'g';
interface ApplyConfig {
  polygon?: number;
  fIndex?: number;
  using?: string;
  gyrate?: 'ortho' | 'gyro';
  peak?: Peak;
  direction?: 'forward' | 'back';
  align?: 'meta' | 'para';
}

interface OperationResult {
  result: Polyhedron;
  animationData?: {
    start: Polyhedron,
    endVertices: Vertex[],
  };
}

export default function applyOperation(
  operation: Operation,
  polyhedron: Polyhedron,
  config: ApplyConfig = {},
): OperationResult {
  let options: ApplyConfig = {};
  let applyConfig = config;
  const relations = getRelations(polyhedron.name, operation);
  if (operation === 'k') {
    // since there's so few options, let's just hardcode
    const { polygon } = config;
    if (polyhedron.name === 'cuboctahedron') {
      options = { value: polygon === 3 ? 'C' : 'O' };
    } else if (polyhedron.name === 'icosidodecahedron') {
      options = { value: polygon === 3 ? 'D' : 'I' };
    }
    applyConfig = { ...applyConfig, faceType: polygon };
  } else if (operation === 'c') {
    // since there's so few options, let's just hardcode
    const { polygon } = config;
    if (polyhedron.name === 'rhombicuboctahedron') {
      options = { value: polygon === 3 ? 'O' : 'C' };
    } else if (polyhedron.name === 'rhombicosidodecahedron') {
      options = { value: polygon === 3 ? 'I' : 'D' };
    }
    applyConfig = { ...applyConfig, faceType: polygon || 3 };
  } else if (operation === '+') {
    const { fIndex } = config;

    if (typeof fIndex !== 'number') {
      throw new Error('Invalid fIndex');
    }
    const n = polyhedron.faces[fIndex].length;

    const using = getUsingOpt(config.using, n);

    const baseConfig = {
      using,
      gyrate: using === 'U2' ? 'gyro' : config.gyrate,
    };
    applyConfig = { ...applyConfig, ...baseConfig };
    options = {
      ...baseConfig,
      align: hasMultiple(relations, 'align')
        ? getAugmentAlignment(polyhedron, fIndex)
        : undefined,
    };
  } else if (operation === '-') {
    const { peak } = config;
    if (!peak) {
      throw new Error('Invalid peak');
    }
    const vIndices = peak.innerVertexIndices();
    // If diminishing a pentagonal cupola/rotunda, check which one it is
    if (vIndices.length === 5) {
      options.using = 'U5';
    } else if (vIndices.length === 10) {
      options.using = 'R5';
    }

    if (hasMultiple(relations, 'gyrate')) {
      options.gyrate = getCupolaGyrate(polyhedron, peak);
    }

    if (options.gyrate !== 'ortho' && hasMultiple(relations, 'align')) {
      options.align = getPeakAlignment(polyhedron, peak);
    }
  } else if (operation === 'g') {
    const { peak } = config;
    if (!peak) {
      throw new Error('Invalid peak');
    }
    if (_.some(relations, 'direction')) {
      options.direction = getGyrateDirection(polyhedron, peak);
      if (
        _.filter(
          relations,
          relation =>
            relation.direction === options.direction && !!relation.align,
        ).length > 1
      ) {
        options.align = getPeakAlignment(polyhedron, peak);
      }
    }
  }

  const next = getNextPolyhedron(polyhedron.name, operation, _.pickBy(options));
  const opFunction = operationFunctions[getOperationName(operation)];
  if (!_.isFunction(opFunction)) {
    // throw new Error(`Function not found for ${operation}`)
    return { result: Polyhedron.get(next) };
  }
  return updateName(opFunction(polyhedron, applyConfig), next);
}
