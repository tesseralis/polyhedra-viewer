// @flow
import _ from 'lodash';
import Polyhedron from 'math/Polyhedron';
import { VIndex, FIndex } from 'math/solidTypes';
import { vec, PRECISION } from 'math/linAlg';
import type { Vector } from 'math/linAlg';
import { deduplicateVertices } from './operationUtils';

interface ContractOptions {
  faceType: number;
}

function getExpansionResult(polyhedron) {
  // Only the platonic solids can be expanded, so it suffices to just iterate over them
  switch (polyhedron.numFaces()) {
    case 4:
      return 'cuboctahedron';
    case 6:
    case 8:
      return 'rhombicuboctahedron';
    case 12:
    case 20:
      return 'rhombicosidodecahedron';
    default:
      throw new Error('Did you try to expand a non-regular solid?');
  }
}

function getContractResult(polyhedron, faceType) {
  switch (polyhedron.numFaces()) {
    case 14:
      return 'tetrahedron';
    case 26:
      return faceType === 3 ? 'octahedron' : 'cube';
    case 62:
      return faceType === 3 ? 'icosahedron' : 'dodecahedron';
    default:
      throw new Error('Did you try to contract an invalid solid?');
  }
}

export function isExpansionFace(
  polyhedron: Polyhedron,
  fIndex: FIndex,
  nSides: number,
) {
  if (polyhedron.numSides(fIndex) !== nSides) return false;
  if (polyhedron.edgeLength(fIndex) <= PRECISION) return false;
  return _.every(
    polyhedron.faceGraph()[fIndex],
    fIndex2 => polyhedron.numSides(fIndex2) === 4,
  );
}

export function getContractPolygon(polyhedron: Polyhedron, point: Vector) {
  const hitPoint = vec(point);
  const hitFaceIndex = polyhedron.hitFaceIndex(hitPoint);
  // TODO handle octahedron case
  const isValid = _.every(
    polyhedron.faceGraph()[hitFaceIndex],
    fIndex2 => polyhedron.numSides(fIndex2) === 4,
  );
  return isValid ? polyhedron.numSides(hitFaceIndex) : -1;
}

function duplicateVertices(polyhedron: Polyhedron) {
  const newVertexMapping = {};
  const vertexFaces = [];
  let newVertices = polyhedron.vertices;
  _.forEach(polyhedron.vertices, (vertex, vIndex: VIndex) => {
    // For each vertex, pick one adjacent face to be the "head"
    // for every other adjacent face, map it to a duplicated vertex
    const [head, ...tail] = polyhedron.directedAdjacentFaceIndices(vIndex);
    const start = newVertices.length;
    _.set(newVertexMapping, [head, vIndex], vIndex);
    _.forEach(tail, (fIndex, i) => {
      _.set(newVertexMapping, [fIndex, vIndex], start + i);
    });
    vertexFaces.push([vIndex, ..._.range(start, start + tail.length)]);
    newVertices = newVertices.concat(
      _.times(tail.length, () => polyhedron.vertices[vIndex]),
    );
  });

  const remappedOriginalFaces = polyhedron.faces.map((face, fIndex) => {
    return face.map(vIndex => {
      return newVertexMapping[fIndex][vIndex];
    });
  });

  // Create a square out of each edge originally in the polyhedron
  const edgeFaces = polyhedron.edges.map(edge => {
    const [v1, v2] = edge;
    const [f1, f2] = polyhedron.edgeFaceIndices(edge);
    // get the edges in order of the first face
    return [
      newVertexMapping[f1][v2],
      newVertexMapping[f1][v1],
      newVertexMapping[f2][v1],
      newVertexMapping[f2][v2],
    ];
  });

  return Polyhedron.of(
    newVertices,
    _.concat(vertexFaces, edgeFaces, remappedOriginalFaces),
  );
}

function getResizedVertices(polyhedron, fIndices, resizedLength) {
  // Update the vertices with the expanded-out version
  const f0 = fIndices[0];
  const sideLength = polyhedron.edgeLength(f0);
  const baseLength = polyhedron.distanceToCenter(f0) / sideLength;
  const result = [...polyhedron.vertices];
  _.forEach(fIndices, fIndex => {
    const normal = polyhedron.faceNormal(fIndex);
    const expandFace = polyhedron.faces[fIndex];
    _.forEach(expandFace, vIndex => {
      const vertex = polyhedron.vertexVectors()[vIndex];
      result[vIndex] = vertex
        .add(normal.scale((resizedLength - baseLength) * sideLength))
        .toArray();
    });
  });
  return result;
}

export function expand(polyhedron: Polyhedron) {
  // figure out what this polyhedron expands to
  const n = polyhedron.numSides(0);
  const result = duplicateVertices(polyhedron);

  // Use a reference polyhedron to calculate how far to expand
  const resultName = getExpansionResult(polyhedron);
  const reference = Polyhedron.get(resultName);
  const referenceFaceIndex = _.find(reference.fIndices(), fIndex =>
    isExpansionFace(reference, fIndex, n),
  );
  const referenceLength =
    reference.distanceToCenter(referenceFaceIndex) / reference.edgeLength();

  const expandFaceIndices = _.filter(result.fIndices(), fIndex =>
    isExpansionFace(result, fIndex, n),
  );

  // Update the vertices with the expanded-out version
  const endVertices = getResizedVertices(
    result,
    expandFaceIndices,
    referenceLength,
  );

  return {
    result: result.withVertices(endVertices),
    animationData: {
      start: result,
      endVertices,
    },
  };
}

function getCuboctahedronContractFaceIndices(polyhedron) {
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
  if (polyhedron.numFaces() === 14) {
    return getCuboctahedronContractFaceIndices(polyhedron);
  }
  return _.filter(polyhedron.fIndices(), fIndex =>
    isExpansionFace(polyhedron, fIndex, faceType),
  );
}

export function contract(
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
  const endVertices = getResizedVertices(
    polyhedron,
    contractFaceIndices,
    referenceLength,
  );
  return {
    result: deduplicateVertices(polyhedron.withVertices(endVertices)),
    animationData: {
      start: polyhedron,
      endVertices,
    },
  };
}
