import { Twist } from 'types';
import { Polyhedron, Cap, VertexList } from 'math/polyhedra';
import { expandEdges } from '../operationUtils';
import makeOperation from '../makeOperation';
import { antiprismHeight, getScaledPrismVertices } from './prismUtils';

function doElongate(polyhedron: Polyhedron, twist?: Twist) {
  const caps = Cap.getAll(polyhedron);
  const boundary = caps[0].boundary();
  const n = boundary.numSides;
  const duplicated = expandEdges(polyhedron, boundary.edges, twist);
  let vertexSets: VertexList[];

  const duplicatedCaps = Cap.getAll(duplicated);
  if (duplicatedCaps.length === 2) {
    vertexSets = duplicatedCaps;
  } else {
    // Otherwise it's the largest face
    vertexSets = [
      duplicated.faces[boundary.adjacentFaces()[0].index],
      Cap.getAll(duplicated)[0],
    ];
  }
  const adjustInfo = { vertexSets, boundary };

  const height = polyhedron.edgeLength() * (twist ? antiprismHeight(n) : 1);

  const endVertices = getScaledPrismVertices(adjustInfo, height, twist);
  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
  };
}

export const elongate = makeOperation('elongate', {
  apply(polyhedron) {
    return doElongate(polyhedron);
  },
});

interface Options {
  twist?: Twist;
}
export const gyroelongate = makeOperation<Options>('gyroelongate', {
  apply(polyhedron: Polyhedron, { twist = 'left' }) {
    return doElongate(polyhedron, twist);
  },
  optionTypes: ['twist'],
  allOptionCombos() {
    return [{ twist: 'left' }, { twist: 'right' }];
  },
});
