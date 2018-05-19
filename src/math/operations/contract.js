// @flow strict
import _ from 'lodash';
import { flatMapUniq } from 'util.js';
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

const familyMap = { T: 3, O: 4, I: 5 };
const coxeterNum = { T: 4, O: 6, I: 10 };

function getContractLength(polyhedron, faceType) {
  // Calculate dihedral angle
  // https://en.wikipedia.org/wiki/Platonic_solid#Angles
  const family = getFamily(polyhedron);
  const s = polyhedron.edgeLength();
  const p = faceType;
  const q = 3 + familyMap[family] - p;
  const h = coxeterNum[family];
  const tanTheta2 = Math.cos(Math.PI / q) / Math.sin(Math.PI / h);

  // Calculate the inradius
  // https://en.wikipedia.org/wiki/Platonic_solid#Radii,_area,_and_volume
  return s / 2 / Math.tan(Math.PI / p) * tanTheta2;
}

function getFaceDistance(face1, face2) {
  let dist = 0;
  let current = [face1];
  while (!face2.inSet(current)) {
    dist++;
    current = flatMapUniq(current, face => face.adjacentFaces(), 'index');

    if (dist > 10) {
      throw new Error('we went toooooo far');
    }
  }
  return dist;
}

function getIcosahedronContractFaces(polyhedron) {
  let result = [];
  let toTest = polyhedron.faces;
  while (toTest.length > 0) {
    const [next, ...rest] = toTest;
    result.push(next);
    toTest = _.filter(rest, face => getFaceDistance(face, next) === 3);
  }
  return result;
}

function getCuboctahedronContractFaces(polyhedron) {
  const toCheck = _.filter(polyhedron.faces, { numSides: 3 });
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
  return _.filter(polyhedron.faces, face =>
    isExpandedFace(polyhedron, face, faceType),
  );
}

export function applyContract(
  polyhedron: Polyhedron,
  { faceType = 3 }: ContractOptions,
) {
  const resultLength = getContractLength(polyhedron, faceType);

  // Take all the stuff and push it inwards
  const contractFaces = getContractFaces(polyhedron, faceType);

  const angle =
    expansionType(polyhedron) === 'snub'
      ? -getSnubAngle(polyhedron, faceType)
      : 0;

  const endVertices = getResizedVertices(contractFaces, resultLength, angle);
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

  getApplyArgs(polyhedron, hitPoint) {
    const hitFace = polyhedron.hitFace(hitPoint);
    const isValid = isExpandedFace(polyhedron, hitFace);
    return isValid ? { faceType: hitFace.numSides } : {};
  },

  getAllApplyArgs(polyhedron) {
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
