// @flow
import _ from 'lodash';
import Polyhedron from 'math/Polyhedron';
import { VIndex, FIndex } from 'math/solidTypes';
import { vec, getMidpoint, getPlane } from 'math/linAlg';
import type { Vector } from 'math/linAlg';
import { deduplicateVertices } from './operationUtils';
import { Operation } from './operationTypes';

// Result functions
// ================
// Since there are only a handful of possibilities for these oprations, it's okay to use shortcuts
// like switching on number of faces, to determine properties.

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

function getSnubResult(polyhedron) {
  // Only the platonic solids can be expanded, so it suffices to just iterate over them
  switch (polyhedron.numFaces()) {
    case 4:
      return 'icosahedron';
    case 6:
    case 8:
      return 'snub cube';
    case 12:
    case 20:
      return 'snub dodecahedron';
    default:
      throw new Error('Did you try to snub a non-regular solid?');
  }
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

function isSnub(polyhedron) {
  return _.includes([20, 38, 92], polyhedron.numFaces());
}

export function isExpansionFace(
  polyhedron: Polyhedron,
  fIndex: FIndex,
  nSides: number,
) {
  if (polyhedron.numSides(fIndex) !== nSides) return false;
  if (!polyhedron.isFaceValid(fIndex)) return false;
  return _.every(
    polyhedron.faceGraph()[fIndex],
    fIndex2 => polyhedron.numSides(fIndex2) === 4,
  );
}

// FIXME make better
function duplicateVertices(polyhedron: Polyhedron, twist?: 'left' | 'right') {
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

  const edgeFaces = (() => {
    if (twist) {
      return _.flatMap(polyhedron.edges, edge => {
        const [v1, v2] = edge;
        const [f1, f2] = polyhedron.edgeFaceIndices(edge);
        // get the edges in order of the first face
        if (twist === 'right') {
          return [
            [
              newVertexMapping[f1][v1],
              newVertexMapping[f2][v2],
              newVertexMapping[f1][v2],
            ],
            [
              newVertexMapping[f1][v1],
              newVertexMapping[f2][v1],
              newVertexMapping[f2][v2],
            ],
          ];
        }
        return [
          [
            newVertexMapping[f1][v2],
            newVertexMapping[f1][v1],
            newVertexMapping[f2][v1],
          ],
          [
            newVertexMapping[f2][v1],
            newVertexMapping[f2][v2],
            newVertexMapping[f1][v2],
          ],
        ];
      });
    }

    // Create a square out of each edge originally in the polyhedron
    return polyhedron.edges.map(edge => {
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
  })();

  return Polyhedron.of(
    newVertices,
    _.concat(vertexFaces, edgeFaces, remappedOriginalFaces),
  );
}

function getResizedVertices(polyhedron, fIndices, resizedLength, angle = 0) {
  // Update the vertices with the expanded-out version
  const f0 = fIndices[0];
  const sideLength = polyhedron.edgeLength(f0);
  const baseLength = polyhedron.distanceToCenter(f0) / sideLength;
  const result = [...polyhedron.vertices];
  _.forEach(fIndices, fIndex => {
    const normal = polyhedron.faceNormal(fIndex);
    const centroid = polyhedron.faceCentroid(fIndex);
    const expandFace = polyhedron.faces[fIndex];
    _.forEach(expandFace, vIndex => {
      const vertex = polyhedron.vertexVectors()[vIndex];
      const rotated =
        angle === 0
          ? vertex
          : vertex
              .sub(centroid)
              .getRotatedAroundAxis(normal, angle)
              .add(centroid);
      const scale = (resizedLength - baseLength) * sideLength;
      result[vIndex] = rotated.add(normal.scale(scale)).toArray();
    });
  });
  return result;
}

function applyExpand(polyhedron: Polyhedron) {
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

export const expand: Operation<> = {
  apply: applyExpand,
};

function isSnubFace(polyhedron, fIndex, nSides) {
  if (polyhedron.numSides(fIndex) !== nSides) return false;
  if (!polyhedron.isFaceValid(fIndex)) return false;
  return _.every(
    polyhedron.faceGraph()[fIndex],
    fIndex2 => polyhedron.numSides(fIndex2) === 3,
  );
}

function getSnubAngle(polyhedron, numSides) {
  const f0 =
    _.find(polyhedron.fIndices(), fIndex =>
      isSnubFace(polyhedron, fIndex, numSides),
    ) || 0;
  const face0 = polyhedron.faces[f0];

  const faceCentroid = polyhedron.faceCentroid(f0);
  const snubFaceIndices = _.filter(
    polyhedron.fIndices(),
    fIndex =>
      isSnubFace(polyhedron, fIndex, numSides) &&
      !_.includes(polyhedron.adjacentFaceIndices(...face0), fIndex),
  );
  const [v0, v1] = polyhedron.vertexVectors(face0);
  const midpoint = getMidpoint(v0, v1);
  const f1 = _.minBy(snubFaceIndices, fIndex =>
    midpoint.distanceTo(polyhedron.faceCentroid(fIndex)),
  );
  const plane = getPlane([
    faceCentroid,
    polyhedron.faceCentroid(f1),
    polyhedron.centroid(),
  ]);
  const projected = plane.getProjectedPoint(midpoint);

  const angle = midpoint
    .sub(faceCentroid)
    .angleBetween(projected.sub(faceCentroid), true);

  // This always ensures the same chirality for everything
  return numSides === 3 ? angle : -angle;
}

// FIXME deduplicate with expand
function applySnub(polyhedron: Polyhedron) {
  // figure out what this polyhedron expands to
  const n = polyhedron.numSides(0);
  const result = duplicateVertices(polyhedron, n === 3 ? 'right' : 'left');

  // Use a reference polyhedron to calculate how far to expand
  const resultName = getSnubResult(polyhedron);
  const reference = Polyhedron.get(resultName);
  const referenceFaceIndex = _.find(reference.fIndices(), fIndex =>
    isSnubFace(reference, fIndex, n),
  );
  const referenceLength =
    reference.distanceToCenter(referenceFaceIndex) / reference.edgeLength();

  const snubFaceIndices = _.filter(result.fIndices(), fIndex =>
    isSnubFace(result, fIndex, n),
  );
  const snubAngle = getSnubAngle(reference, n);

  // Update the vertices with the expanded-out version
  const endVertices = getResizedVertices(
    result,
    snubFaceIndices,
    referenceLength,
    snubAngle,
  );

  return {
    result: result.withVertices(endVertices),
    animationData: {
      start: result,
      endVertices,
    },
  };
}

export const snub: Operation<> = {
  apply: applySnub,
};

interface ContractOptions {
  faceType: number;
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
  return _.filter(
    polyhedron.fIndices(),
    fIndex =>
      isExpansionFace(polyhedron, fIndex, faceType) ||
      isSnubFace(polyhedron, fIndex, faceType),
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
  const angle = isSnub(polyhedron) ? -getSnubAngle(polyhedron, faceType) : 0;

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
    const isValid =
      _.every(
        polyhedron.faceGraph()[hitFaceIndex],
        fIndex2 => polyhedron.numSides(fIndex2) === 4,
      ) ||
      _.every(
        polyhedron.faceGraph()[hitFaceIndex],
        fIndex2 => polyhedron.numSides(fIndex2) === 3,
      );
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
      (isExpansionFace(polyhedron, fIndex, applyArgs.faceType) ||
        isSnubFace(polyhedron, fIndex, applyArgs.faceType))
    ) {
      return true;
    }
  },
};
