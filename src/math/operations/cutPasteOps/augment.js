// @flow strict
import _ from 'lodash';

import { Polyhedron, Face, Cap } from 'math/polyhedra';
import { isInverse, getBasisRotation, PRECISION } from 'math/linAlg';
import { getCyclic, getSingle } from 'utils';

import { Operation } from '../operationTypes';
import { hasMultiple } from './cutPasteUtils';
import { withOrigin } from '../../linAlg';

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
};

const augmentData = _.mapValues(augmentees, type =>
  _.mapValues(type, Polyhedron.get),
);

const augmentTypes = {
  Y: 'pyramid',
  U: 'cupola',
  R: 'rotunda',
};

function getAugmentAlignment(polyhedron, face) {
  const boundary = getSingle(Cap.getAll(polyhedron)).boundary();
  return isInverse(boundary.normal(), face.normal()) ? 'para' : 'meta';
}

function getPossibleAugmentees(n) {
  const { pyramid, cupola, rotunda } = augmentData;
  return _.compact([pyramid[n], cupola[n / 2], rotunda[n / 2]]);
}

// Checks to see if the polyhedron can be augmented at the base while remaining convex
function canAugmentWith(base, augmentee, offset) {
  const n = base.numSides;
  if (!augmentee) return false;
  const underside = augmentee.faceWithNumSides(n);

  return _.every(base.edges, (edge, i: number) => {
    const baseAngle = edge.dihedralAngle();

    const edge2 = getCyclic(underside.edges, i - 1 + offset);
    const augmenteeAngle = edge2.dihedralAngle();

    return baseAngle + augmenteeAngle < Math.PI - PRECISION;
  });
}

function canAugmentWithType(base, augmentType) {
  const n = augmentType === 'pyramid' ? base.numSides : base.numSides / 2;
  for (let offset of [0, 1]) {
    if (canAugmentWith(base, augmentData[augmentType][n], offset)) {
      return true;
    }
  }
  return false;
}

function canAugment(base) {
  const n = base.numSides;
  const augmentees = getPossibleAugmentees(n);
  for (let augmentee of augmentees) {
    for (let offset of [0, 1]) {
      if (canAugmentWith(base, augmentee, offset)) {
        return true;
      }
    }
  }
  return false;
}

// Computes the set equality of two arrays
const setEquals = (array1, array2) => _.xor(array1, array2).length === 0;

function getBaseType(base) {
  const adjacentFaces = base.adjacentFaces();
  const adjacentFaceCounts = _(adjacentFaces)
    .map('numSides')
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

function getOppositePrismFace(base) {
  return base.edges[0]
    .twin()
    .next()
    .next()
    .twinFace();
}

function isCupolaRotunda(baseType, augmentType) {
  return _.xor(['cupola', 'rotunda'], [baseType, augmentType]).length === 0;
}

// Return true if the base and augmentee are aligned
function isAligned(polyhedron, base, underside, gyrate, augmentType) {
  if (augmentType === 'pyramid') return true;
  const baseType = getBaseType(base);
  if (baseType === 'pyramid' || baseType === 'antiprism') {
    return true;
  }

  if (baseType === 'prism' && Cap.getAll(polyhedron).length === 0) {
    return true;
  }

  if (baseType !== 'truncated' && _.isNil(gyrate)) {
    throw new Error(`Must define 'gyrate' for augmenting ${baseType} `);
  }

  const adjFace =
    baseType === 'prism' ? getOppositePrismFace(base) : base.adjacentFaces()[0];
  const alignedFace = getCyclic(underside.adjacentFaces(), -1);

  if (baseType === 'rhombicosidodecahedron') {
    const isOrtho = (adjFace.numSides !== 4) === (alignedFace.numSides !== 4);
    return isOrtho === (gyrate === 'ortho');
  }

  // It's orthogonal if triangle faces are aligned or non-triangle faces are aligned
  const isOrtho = (adjFace.numSides !== 3) === (alignedFace.numSides !== 3);

  if (baseType === 'truncated') {
    return !isOrtho;
  }

  // "ortho" or "gyro" is actually determined by whether the *tops* are aligned, not the bottoms
  // So for a cupola-rotunda, it's actually the opposite of everything else
  if (isCupolaRotunda(Cap.getAll(polyhedron)[0].type, augmentType)) {
    return isOrtho !== (gyrate === 'ortho');
  }

  return isOrtho === (gyrate === 'ortho');
}

// Flatten a polyhedron at the given face
function flatten(polyhedron, face) {
  const plane = face.plane();
  return polyhedron.withVertices(
    polyhedron.vertices.map(v => plane.getProjectedPoint(v.vec)),
  );
}

function getAugmentee(using) {
  const prefix = using[0];
  const index = using.substring(1);

  const augmentType = augmentTypes[prefix];
  return augmentData[augmentType][index];
}

// Augment the following
function doAugment(
  polyhedron,
  base,
  _using = defaultAugmentees[base.numSides],
  gyrate,
  mock = false,
) {
  // TODO fix the test generation code so we don't need this
  const using =
    getAugmenteeNumSides(_using) === base.numSides
      ? _using
      : defaultAugmentees[base.numSides];
  const augmentType = augmentTypes[using[0]];

  let augmentee = getAugmentee(using);
  const underside = augmentee.faceWithNumSides(base.numSides);
  augmentee = mock ? flatten(augmentee, underside) : augmentee;

  // Determine the orientations of the underside and the base
  const undersideNormal = underside.normal();
  const undersideRadius = underside.vertices[0].vec
    .sub(underside.centroid())
    .getNormalized();
  const undersideRotation = getBasisRotation(
    undersideRadius,
    undersideNormal.getInverted(),
  );

  const baseIsAligned = isAligned(
    polyhedron,
    base,
    underside,
    using === 'U2' ? 'gyro' : gyrate,
    augmentType,
  );
  const offset = baseIsAligned ? 0 : 1;
  const baseRadius = base.vertices[offset].vec
    .sub(base.centroid())
    .getNormalized();
  const baseRotation = getBasisRotation(baseRadius, base.normal());

  // https://math.stackexchange.com/questions/624348/finding-rotation-axis-and-angle-to-align-two-oriented-vectors
  // Determine the transformation that rotates the underside orientation to the base orientation
  // TODO we probably want this as some sort of generic method
  const transform = withOrigin(base.centroid(), u =>
    baseRotation.multiply(undersideRotation.getTransposed()).applyTo(u),
  );

  // Scale and position the augmentee so that it lines up with the base
  const alignedVertices = augmentee.vertices.map(v => {
    return v.vec
      .sub(underside.centroid())
      .scale(base.sideLength() / augmentee.edgeLength())
      .add(base.centroid());
  });

  // Rotate the vertices so that they align with the base
  const rotatedVertices = alignedVertices.map(v => transform(v));

  const newAugmentee = augmentee.withChanges(solid =>
    solid.withVertices(rotatedVertices).withoutFaces([underside]),
  );
  return polyhedron.withChanges(solid =>
    solid.withoutFaces([base]).addPolyhedron(newAugmentee),
  );
}

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

function getAugmenteeNumSides(using: string) {
  const prefix = using[0];
  const index = _.toNumber(using.substring(1));
  return 'RU'.includes(prefix) ? index * 2 : index;
}

export function getUsingOpt(using: ?string, numSides: number) {
  return typeof using === 'string' && getAugmenteeNumSides(using) === numSides
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
    const n = face.numSides;
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

  getAllOptions(polyhedron, relations) {
    const rawGyrateOpts = _.compact(_.uniq(_.map(relations, 'gyrate')));
    const gyrateOpts = rawGyrateOpts.length === 2 ? rawGyrateOpts : [undefined];
    const rawUsingOpts = _.compact(_.uniq(_.map(relations, 'using')));
    // Only do using opts if we can do more than one of each type
    const usingOpts = _(rawUsingOpts)
      .countBy(using => getAugmenteeNumSides(using))
      .some(count => count > 1)
      ? rawUsingOpts
      : [undefined];
    const faceOpts = _.map(polyhedron.faces.filter(face => canAugment(face)));

    const options = [];

    for (let face of faceOpts) {
      for (let gyrate of gyrateOpts) {
        for (let using of usingOpts) {
          if (!using || canAugmentWithType(face, augmentTypes[using[0]])) {
            options.push({ gyrate, using, face });
          }
        }
      }
    }

    return options;
  },

  getHitOption(polyhedron, hitPnt, options) {
    if (!options) return {};
    const face = polyhedron.hitFace(hitPnt);
    if (!options.using) {
      return canAugment(face) ? { face } : {};
    }
    if (!canAugmentWithType(face, augmentTypes[options.using[0]])) {
      return {};
    }
    return { face };
  },

  getSelectState(polyhedron, { face, using }) {
    return _.map(polyhedron.faces, f => {
      if (face && f.equals(face)) return 'selected';

      if (!using && canAugment(f)) return 'selectable';

      if (using && canAugmentWithType(f, augmentTypes[using[0]]))
        return 'selectable';
    });
  },
};
