// @flow
import _ from 'lodash';
import { Polyhedron } from 'math/polyhedra';
import {
  expansionType,
  getSnubAngle,
  isExpandedFace,
  getResizedVertices,
} from './operationUtils';
import { Operation } from './operationTypes';

interface ContractOptions {
  faceType: number;
}

// Return the symmetry group of the *expanded* polyhedron
function getFamily(polyhedron) {
  switch (polyhedron.numFaces()) {
    case 14: // cuboctahedron
    case 20: // icosahedron
      return 'T';
    case 26: // rhombicuboctahedron
    case 38: // snub cube
      return 'O';
    case 62: // rhombicosidodecahedron
    case 92: // snub dodecahedron
      return 'I';
    default:
      throw new Error('Did you try to contract an invalid solid?');
  }
}

// TODO make this more robust
function getContractResult(polyhedron, faceType) {
  switch (getFamily(polyhedron)) {
    case 'T':
      return 'tetrahedron';
    case 'O':
      return faceType === 3 ? 'octahedron' : 'cube';
    case 'I':
      return faceType === 3 ? 'icosahedron' : 'dodecahedron';
    default:
      throw new Error('Did you try to contract an invalid solid?');
  }
}

function getFaceDistance(face1, face2) {
  let dist = 0;
  let current = [face1];
  while (!face2.inSet(current)) {
    dist++;
    current = _(current)
      .flatMap(face => face.adjacentFaces())
      .uniqBy('index')
      .value();

    if (dist > 10) {
      throw new Error('we went toooooo far');
    }
  }
  return dist;
}

function getIcosahedronContractFaces(polyhedron) {
  let result = [];
  let toTest = polyhedron.getFaces();
  while (toTest.length > 0) {
    const [next, ...rest] = toTest;
    result.push(next);
    toTest = _.filter(rest, face => getFaceDistance(face, next) === 3);
  }
  return result;
}

function getCuboctahedronContractFaces(polyhedron) {
  const toCheck = _.filter(polyhedron.getFaces(), { numSides: 3 });
  const result = [];
  const invalid = [];
  while (toCheck.length > 0) {
    const next = toCheck.pop();
    if (_.includes(invalid, next.index)) {
      continue;
    }
    _.forEach(next.vertices, vertex => {
      _.forEach(vertex.adjacentFaces(), face => {
        if (face.numSides === 3) {
          invalid.push(face.index);
        }
      });
    });
    result.push(next);
  }
  return result;
}

function getContractFaces(polyhedron, faceType) {
  if (getFamily(polyhedron) === 'T') {
    return expansionType(polyhedron) === 'snub'
      ? getIcosahedronContractFaces(polyhedron)
      : getCuboctahedronContractFaces(polyhedron);
  }
  return _.filter(polyhedron.getFaces(), face =>
    isExpandedFace(polyhedron, face, faceType),
  );
}

export function applyContract(
  polyhedron: Polyhedron,
  { faceType }: ContractOptions,
) {
  // Use a reference polyhedron to calculate how far to expand
  const resultName = getContractResult(polyhedron, faceType);
  const reference = Polyhedron.get(resultName);
  // TODO keep a database of these so we don't have to recalculate every time
  const referenceLength =
    reference.getFace().distanceToCenter() / reference.edgeLength();

  // Take all the stuff and push it inwards
  // TODO can we like, factor out this logic?
  const contractFaces = getContractFaces(polyhedron, faceType);
  const angle =
    expansionType(polyhedron) === 'snub'
      ? -getSnubAngle(polyhedron, faceType)
      : 0;

  const endVertices = getResizedVertices(
    polyhedron,
    contractFaces,
    referenceLength,
    angle,
  );
  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract: Operation<ContractOptions> = {
  apply: applyContract,

  // TODO consolidate with "getContractResult"
  getSearchOptions(polyhedron, config) {
    const { faceType } = config;
    switch (getFamily(polyhedron)) {
      case 'O':
        return { value: faceType === 3 ? 'O' : 'C' };
      case 'I':
        return { value: faceType === 3 ? 'I' : 'D' };
      default:
        return;
    }
  },

  getDefaultArgs(polyhedron, config) {
    return { faceType: config.faceType || 3 };
  },

  getApplyArgs(polyhedron, hitPoint) {
    const hitFace = polyhedron.hitFace(hitPoint);
    const isValid = isExpandedFace(polyhedron, hitFace);
    return isValid ? { faceType: hitFace.numSides } : {};
  },

  getAllApplyArgs(polyhedron) {
    // TODO we can do this w/o referencing name
    switch (getFamily(polyhedron)) {
      case 'O':
        return [{ faceType: 3 }, { faceType: 4 }];
      case 'I':
        return [{ faceType: 3 }, { faceType: 5 }];
      default:
        return [{}];
    }
  },

  isHighlighted(polyhedron, applyArgs, face) {
    if (
      typeof applyArgs.faceType === 'number' &&
      isExpandedFace(polyhedron, face, applyArgs.faceType)
    ) {
      return true;
    }
  },
};
