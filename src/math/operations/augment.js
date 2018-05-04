// @flow
import _ from 'lodash';

import { Polyhedron, Face } from 'math/polyhedra';
import type { VIndex } from 'math/polyhedra';
import { vec, getPlane, PRECISION } from 'math/linAlg';
import { find, getSingle, cartesian } from 'util.js';
import { numSides, getCyclic as getMod } from 'math/polyhedra/solidUtils';

import { hasMultiple, deduplicateVertices } from './operationUtils';
import { faceDistanceBetweenVertices } from './applyOptionUtils';
import { Operation } from './operationTypes';

const augmentees = {
  pyramid: {
    '3': 'tetrahedron',
    '4': 'square-pyramid',
    '5': 'pentagonal-pyramid',
  },

  cupola: {
    '2': 'triangular-prism',
    '3': 'triangular-cupola',
    '4': 'square-cupola',
    '5': 'pentagonal-cupola',
  },

  rotunda: {
    '5': 'pentagonal-rotunda',
  },

  prism: {
    '3': 'triangular-prism',
    '4': 'cube',
    '5': 'pentagonal-prism',
    '6': 'hexagonal-prism',
    '8': 'octagonal-prism',
    '10': 'decagonal-prism',
  },

  antiprism: {
    '3': 'octahedron',
    '4': 'square-antiprism',
    '5': 'pentagonal-antiprism',
    '6': 'hexagonal-antiprism',
    '8': 'octagonal-antiprism',
    '10': 'decagonal-antiprism',
  },
};

const augmentData = _.mapValues(augmentees, type =>
  _.mapValues(type, Polyhedron.get),
);

const augmentTypes = {
  Y: 'pyramid',
  U: 'cupola',
  R: 'rotunda',
  P: 'prism',
  A: 'antiprism',
};

// Return "meta" or "para", or null
function getAugmentAlignment(polyhedron, face) {
  // get the existing peak boundary
  const peakBoundary = getSingle(polyhedron.peaks()).boundary();
  const isHexagonalPrism = _.some(
    polyhedron.getFaces(),
    face => face.numSides() === 6,
  );

  // calculate the face distance to the peak's boundary
  return faceDistanceBetweenVertices(
    polyhedron,
    face.vIndices(),
    peakBoundary,
    isHexagonalPrism ? [6] : [],
  ) > 1
    ? 'para'
    : 'meta';
}

function getPossibleAugmentees(n) {
  const { pyramid, cupola, rotunda } = augmentData;
  return _.compact([pyramid[n], cupola[n / 2], rotunda[n / 2]]);
}

// Checks to see if the polyhedron can be augmented at the base while remaining convex
function canAugmentWith(polyhedron, base, augmentee, offset) {
  const n = base.numSides();
  const underside = find(augmentee.getFaces(), face => face.numSides() === n);

  return _.every(base.directedEdges(), (edge, i) => {
    const baseAngle = polyhedron.getDihedralAngle(edge);

    const edge2 = underside.directedEdge(i - 1 + offset);
    const augmenteeAngle = augmentee.getDihedralAngle(edge2);

    return baseAngle + augmenteeAngle < Math.PI - PRECISION;
  });
}

function canAugment(polyhedron, base) {
  const n = base.numSides();
  const augmentees = getPossibleAugmentees(n);
  for (let augmentee of augmentees) {
    for (let offset of [0, 1]) {
      if (canAugmentWith(polyhedron, base, augmentee, offset)) {
        return true;
      }
    }
  }
  return false;
}

function getAugmentGraph(polyhedron) {
  return polyhedron.getFaces().map(face => canAugment(polyhedron, face));
}

function getAugmentFace(polyhedron, graph, point) {
  const hitPoint = vec(point);
  const hitFace = polyhedron.hitFace(hitPoint);
  return graph[hitFace.fIndex] ? hitFace : undefined;
}

const sharesVertex = (face1, face2) => {
  const intersectionCount = _.intersection(face1, face2).length;
  // Make sure they're not the same face
  return intersectionCount > 0 && intersectionCount < face1.length;
};

// Computes the set equality of two arrays
const setEquals = (array1, array2) => _.xor(array1, array2).length === 0;

function getBaseType(faces, base) {
  const adjacentFaces = faces.filter(face => sharesVertex(face, base));
  const adjacentFaceCounts = _(adjacentFaces)
    .map('length')
    .uniq()
    .value();
  if (setEquals(adjacentFaceCounts, [3, 4])) {
    return 'cupola';
  } else if (setEquals(adjacentFaceCounts, [4])) {
    return 'prism';
  } else if (setEquals(adjacentFaceCounts, [3])) {
    return _.intersection(adjacentFaces).length > 0 ? 'pyramid' : 'antiprism';
  } else if (setEquals(adjacentFaceCounts, [3, 5])) {
    return 'rotunda';
  } else if (setEquals(adjacentFaceCounts, [4, 5])) {
    return 'rhombicosidodecahedron';
  } else {
    return 'truncated';
  }
}

function hasDirectedEdge(face, edge) {
  const [u1, u2] = edge;
  return _.some(face, (v1: VIndex, i: number) => {
    const v2 = getMod(face, i + 1);
    return u1 === v1 && u2 === v2;
  });
}

// Get the face in the polyhedron with the given directed edge
function getFaceWithDirectedEdge(faces, edge) {
  return _.find(faces, face => hasDirectedEdge(face, edge));
}

// Get the opposite side of the given prism base
// ensuring that the vertex indices match up
function getOppositePrismSide(polyhedron, base) {
  return _.map(base, vIndex => {
    // Get the neighbor of each vertex that isn't also in the prism
    const nbrs = polyhedron.adjacentVertexIndices(vIndex);
    return _.find(nbrs, vIndex2 => !_.includes(base, vIndex2));
  });
}

function isCupolaRotunda(baseType, augmentType) {
  return _.xor(['cupola', 'rotunda'], [baseType, augmentType]).length === 0;
}

// Return true if the base and augmentee are aligned
function isAligned(
  polyhedron,
  base,
  augmentee,
  underside,
  gyrate,
  augmentType,
) {
  if (_.includes(['pyramid', 'prism', 'antiprism'], augmentType)) return true;
  const baseType = getBaseType(polyhedron.faces, base);
  if (baseType === 'pyramid' || baseType === 'antiprism') {
    return true;
  }

  if (baseType === 'prism' && polyhedron.peaks().length === 0) {
    return true;
  }

  if (baseType !== 'truncated' && _.isNil(gyrate)) {
    throw new Error(`Must define 'gyrate' for augmenting ${baseType} `);
  }

  const faceToCheck =
    baseType === 'prism' ? getOppositePrismSide(polyhedron, base) : base;

  const adjFace = getFaceWithDirectedEdge(polyhedron.faces, [
    faceToCheck[1],
    faceToCheck[0],
  ]);
  const alignedFace = getFaceWithDirectedEdge(augmentee.faces, [
    underside[0],
    _.last(underside),
  ]);

  if (baseType === 'rhombicosidodecahedron') {
    const isOrtho = (numSides(adjFace) !== 4) === (numSides(alignedFace) !== 4);
    return isOrtho === (gyrate === 'ortho');
  }

  // It's orthogonal if triangle faces are aligned or non-triangle faces are aligned
  const isOrtho = (numSides(adjFace) !== 3) === (numSides(alignedFace) !== 3);

  if (baseType === 'truncated') {
    return !isOrtho;
  }

  // "ortho" or "gyro" is actually determined by whether the *tops* are aligned, not the bottoms
  // So for a cupola-rotunda, it's actually the opposite of everything else
  if (isCupolaRotunda(polyhedron.peaks()[0].type, augmentType)) {
    return isOrtho !== (gyrate === 'ortho');
  }

  return isOrtho === (gyrate === 'ortho');
}

// Flatten a polyhedron at the given face
function flatten(polyhedron, face) {
  const vertexVectors = polyhedron.vertexVectors();
  const faceVectors = face.vertices;
  const plane = getPlane(faceVectors);
  const newVertices = vertexVectors.map(v =>
    plane.getProjectedPoint(v).toArray(),
  );
  return polyhedron.withVertices(newVertices);
}

// Augment the following
function doAugment(polyhedron, base, using, gyrate, mock = false) {
  const n = base.numSides();
  const prefix = using[0];
  const index = using.substring(1);
  const baseVertices = base.vertices;
  const baseCenter = base.centroid();
  const sideLength = base.edgeLength();
  const baseNormal = base.normal();

  const augmentType = augmentTypes[prefix];
  let augmentee = augmentData[augmentType][index];
  const underside = find(augmentee.getFaces(), face => face.numSides() === n);
  augmentee = mock ? flatten(augmentee, underside) : augmentee;

  // rotate and translate so that the face is next to our face
  const augmenteeVertices = augmentee.vertexVectors();

  const undersideFace = underside.vIndices();
  const undersideNormal = underside.normal();
  const undersideCenter = underside.centroid();
  const augmenteeSideLength = underside.edgeLength();

  const alignBasesNormal = (() => {
    const cross = undersideNormal.cross(baseNormal).getNormalized();
    // If they're the same (e.g. augmenting something with itself), use a random vertex on the base
    if (cross.magnitude() < PRECISION) {
      return baseVertices[0].sub(baseCenter).getNormalized();
    }
    return cross;
  })();
  // The `|| 0` is because this sometimes returns NaN if the angle is 0
  const alignBasesAngle = baseNormal.angleBetween(undersideNormal, true) || 0;

  const alignedAugmenteeVertices = augmenteeVertices.map(v => {
    return v
      .sub(undersideCenter)
      .scale(sideLength / augmenteeSideLength)
      .getRotatedAroundAxis(alignBasesNormal, alignBasesAngle - Math.PI);
  });

  const translatedV0 = baseVertices[0].sub(baseCenter);
  const baseIsAligned = isAligned(
    polyhedron,
    base.vIndices(),
    augmentee,
    undersideFace,
    gyrate,
    augmentType,
  );
  const offset = baseIsAligned ? 0 : 1;
  const alignedV0 = alignedAugmenteeVertices[undersideFace[offset]];
  // align the first vertex of the base face to the first vertex of the underside face
  const alignVerticesAngle = translatedV0.angleBetween(alignedV0, true) || 0;
  const transformedAugmenteeVertices = alignedAugmenteeVertices.map(v => {
    return v
      .getRotatedAroundAxis(
        alignedV0.cross(translatedV0).getNormalized(),
        alignVerticesAngle,
      )
      .add(baseCenter)
      .toArray();
  });
  return deduplicateVertices(
    polyhedron
      .removeFace(base)
      .addPolyhedron(
        augmentee
          .withVertices(transformedAugmenteeVertices)
          .removeFace(underside),
      ),
  );
}

export const elongate: Operation<> = {
  apply(polyhedron) {
    const base = polyhedron.biggestFace();
    const using = `P${base.numSides()}`;
    return doAugment(polyhedron, base, using);
  },
};

export const gyroelongate: Operation<> = {
  apply(polyhedron) {
    const base = polyhedron.biggestFace();
    const using = `A${base.numSides()}`;
    return doAugment(polyhedron, base, using);
  },
};

interface AugmentOptions {
  face: Face;
  gyrate: 'ortho' | 'gyro';
  using: string;
}

const defaultAugmentees = {
  '3': 'Y3',
  '4': 'Y4',
  '5': 'Y5',
  '6': 'U3',
  '8': 'U4',
  '10': 'U5',
};

const augmenteeSides = {
  ..._.invert(defaultAugmentees),
  U2: 4,
  R5: 10,
};

export function getUsingOpt(using: ?string, numSides: number) {
  return using && augmenteeSides[using] === numSides
    ? using
    : defaultAugmentees[numSides];
}

export const augment: Operation<AugmentOptions> = {
  apply(polyhedron, { face, gyrate, using } = {}) {
    return doAugment(polyhedron, face, using, gyrate);
  },

  getSearchOptions(polyhedron, config, relations) {
    const { face } = config;

    if (!face) {
      throw new Error('Invalid face');
    }
    const n = face.numSides();
    const using = getUsingOpt(config.using, n);

    const baseConfig = {
      using,
      gyrate: using === 'U2' ? 'gyro' : config.gyrate,
    };
    return {
      ...baseConfig,
      align: hasMultiple(relations, 'align')
        ? getAugmentAlignment(polyhedron, face)
        : undefined,
    };
  },

  getDefaultArgs(polyhedron, config) {
    const { face } = config;

    if (!face) {
      throw new Error('Invalid face');
    }
    const n = face.numSides();
    const using = getUsingOpt(config.using, n);

    return {
      using,
      gyrate: using === 'U2' ? 'gyro' : config.gyrate,
    };
  },

  getAllApplyArgs(polyhedron, relations) {
    const rawGyrateOpts = _.compact(_.uniq(_.map(relations, 'gyrate')));
    const gyrateOpts = rawGyrateOpts.length === 2 ? rawGyrateOpts : [undefined];
    const usingOpts = _.compact(_.uniq(_.map(relations, 'using')));
    const faceOpts = polyhedron
      .getFaces()
      .filter(face => canAugment(polyhedron, face));

    return cartesian(gyrateOpts, usingOpts, faceOpts).map(
      ([gyrate, using, face]) => ({ gyrate, using, face }),
    );
  },

  getApplyArgs(polyhedron, hitPnt) {
    const augmentInfo = getAugmentGraph(polyhedron);
    const face = getAugmentFace(polyhedron, augmentInfo, hitPnt);
    return face ? { face } : {};
  },

  isHighlighted(polyhedron, applyArgs, face) {
    if (!!applyArgs.face && applyArgs.face.equals(face)) {
      return true;
    }
  },
};
