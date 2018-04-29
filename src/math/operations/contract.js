// @flow
import _ from 'lodash';
import Polyhedron from 'math/Polyhedron';
import { FIndex } from 'math/solidTypes';
import { vec } from 'math/linAlg';
import type { Vector } from 'math/linAlg';
import {
  expansionType,
  getSnubAngle,
  isExpandedFace,
  deduplicateVertices,
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

function getTetrahedralContractFaceIndices(polyhedron) {
  const toCheck = polyhedron
    .fIndices()
    .filter(fIndex => polyhedron.numSides(fIndex) === 3);
  const result = [];
  const invalid = [];
  while (toCheck.length > 0) {
    const next = toCheck.pop();
    if (_.includes(invalid, next)) {
      continue;
    }
    _.forEach(
      polyhedron.adjacentFaceIndices(...polyhedron.faces[next]),
      fIndex => {
        if (polyhedron.numSides(fIndex) === 3) {
          invalid.push(fIndex);
        }
      },
    );
    result.push(next);
  }
  return result;
}

function getContractFaceIndices(polyhedron, faceType) {
  if (getFamily(polyhedron) === 'T') {
    return getTetrahedralContractFaceIndices(polyhedron);
  }
  return _.filter(polyhedron.fIndices(), fIndex =>
    isExpandedFace(polyhedron, fIndex, faceType),
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
  const referenceLength = reference.distanceToCenter() / reference.edgeLength();

  // Take all the stuff and push it inwards
  // TODO can we like, factor out this logic?
  const contractFaceIndices = getContractFaceIndices(polyhedron, faceType);
  // FIXME fuuuu the angles actually go the other way depending on the type of polyhedron
  const angle =
    expansionType(polyhedron) === 'snub'
      ? -getSnubAngle(polyhedron, faceType)
      : 0;

  const endVertices = getResizedVertices(
    polyhedron,
    contractFaceIndices,
    referenceLength,
    angle,
  );
  return {
    result: deduplicateVertices(polyhedron.withVertices(endVertices)),
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

  getApplyArgs(polyhedron: Polyhedron, point: Vector) {
    const hitPoint = vec(point);
    const hitFaceIndex = polyhedron.hitFaceIndex(hitPoint);
    const isValid = isExpandedFace(polyhedron, hitFaceIndex);
    return isValid ? { faceType: polyhedron.numSides(hitFaceIndex) } : {};
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

  isHighlighted(
    polyhedron: Polyhedron,
    applyArgs: ContractOptions,
    fIndex: FIndex,
  ) {
    if (
      typeof applyArgs.faceType === 'number' &&
      isExpandedFace(polyhedron, fIndex, applyArgs.faceType)
    ) {
      return true;
    }
  },
};
