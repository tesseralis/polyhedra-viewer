import _ from 'lodash';
import { Polyhedron } from 'math/polyhedra';
import {
  getSnubAngle,
  isExpandedFace,
  getResizedVertices,
  getExpandedFaces,
} from './resizeUtils';
import makeOperation from '../makeOperation';

interface ContractOptions {
  faceType: number;
}

// Return the symmetry group of an *expanded* polyhedron
function getFamily(polyhedron: Polyhedron) {
  if (_.includes(['cuboctahedron', 'icosahedron'], polyhedron.name)) {
    return 'T';
  }
  return polyhedron.symmetry().group;
}

const familyMap: Record<string, number> = { T: 3, O: 4, I: 5 };
const coxeterNum: Record<string, number> = { T: 4, O: 6, I: 10 };

function getContractLength(polyhedron: Polyhedron, faceType: number) {
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
  return (s / 2 / Math.tan(Math.PI / p)) * tanTheta2;
}

function getCLBev(polyhedron: Polyhedron, faceType: any, result: string) {
  const reference = Polyhedron.get(result);
  const referenceFace = reference.faceWithNumSides(faceType);
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength();
  // return polyhedron.faceWithNumSides(faceType).distanceToCenter() * referenceLength;
  return referenceLength;
}

export function applyContract(
  polyhedron: Polyhedron,
  { faceType = 3 }: ContractOptions,
  result: string,
) {
  const resultLength = isBevelled(polyhedron)
    ? getCLBev(polyhedron, faceType, result)
    : getContractLength(polyhedron, faceType);

  // Take all the stuff and push it inwards
  const contractFaces = isBevelled(polyhedron)
    ? polyhedron.faces.filter(f => f.numSides === faceType)
    : getExpandedFaces(polyhedron, faceType);

  const angle = isBevelled(polyhedron)
    ? 0
    : -getSnubAngle(polyhedron, contractFaces);

  const endVertices = getResizedVertices(contractFaces, resultLength, angle);
  return {
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}

// FIXME get rid of these duplicated calls
function isBevelled(polyhedron: Polyhedron) {
  return polyhedron.name.includes('truncated');
}

// NOTE: We are using the same operation for contracting both expanded and snub solids.
export const contract = makeOperation('contract', {
  apply: applyContract,
  optionTypes: ['facetype'],

  resultsFilter(polyhedron, config) {
    const { faceType } = config;
    if (!isBevelled(polyhedron)) {
      switch (getFamily(polyhedron)) {
        case 'O':
          return { value: faceType === 3 ? 'O' : 'C' };
        case 'I':
          return { value: faceType === 3 ? 'I' : 'D' };
        default:
          return;
      }
    }
    switch (polyhedron.name) {
      case 'truncated cuboctahedron':
        return { value: faceType === 6 ? 'tO' : 'tC' };
      case 'truncated icosidodecahedron':
        return { value: faceType === 6 ? 'tI' : 'tD' };
      default:
        return;
    }
  },

  hitOption: 'faceType',
  getHitOption(polyhedron, hitPoint) {
    const hitFace = polyhedron.hitFace(hitPoint);
    if (!isBevelled(polyhedron)) {
      const isValid = isExpandedFace(polyhedron, hitFace);
      return isValid ? { faceType: hitFace.numSides } : {};
    }
    const isValid = hitFace.numSides > 4;
    return isValid ? { faceType: hitFace.numSides } : {};
  },

  allOptionCombos(polyhedron) {
    if (!isBevelled(polyhedron)) {
      switch (getFamily(polyhedron)) {
        case 'O':
          return [{ faceType: 3 }, { faceType: 4 }];
        case 'I':
          return [{ faceType: 3 }, { faceType: 5 }];
        default:
          return [{}];
      }
    }
    switch (polyhedron.name) {
      case 'truncated cuboctahedron':
        return [{ faceType: 6 }, { faceType: 8 }];
      case 'truncated icosidodecahedron':
        return [{ faceType: 6 }, { faceType: 10 }];
      default:
        return [{}];
    }
  },

  faceSelectionStates(polyhedron, { faceType }) {
    if (!isBevelled(polyhedron)) {
      return polyhedron.faces.map(face => {
        if (faceType && isExpandedFace(polyhedron, face, faceType))
          return 'selected';
        if (isExpandedFace(polyhedron, face)) return 'selectable';
        return undefined;
      });
    }
    return polyhedron.faces.map(face => {
      if (faceType && face.numSides === faceType) {
        return 'selected';
      }
      if (face.numSides !== 4) return 'selectable';
      return undefined;
    });
  },
});
