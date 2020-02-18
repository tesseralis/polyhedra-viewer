import _ from 'lodash';

import { Polyhedron, Face, Cap } from 'math/polyhedra';
import { inRow, inColumn, inSection } from 'math/polyhedra/tableUtils';
import { isInverse, getOrthonormalTransform, PRECISION } from 'math/geom';
import { repeat, getCyclic, getSingle } from 'utils';
import { deduplicateVertices } from '../makeOperation';

import makeOperation from '../makeOperation';
import { hasMultiple } from './cutPasteUtils';
import { withOrigin } from '../../geom';

type AugmentType = 'pyramid' | 'cupola' | 'rotunda';
const augmentees: Record<AugmentType, Record<number, string>> = {
  pyramid: {
    3: 'tetrahedron',
    4: 'square-pyramid',
    5: 'pentagonal-pyramid',
  },

  cupola: {
    2: 'triangular-prism',
    3: 'triangular-cupola',
    4: 'square-cupola',
    5: 'pentagonal-cupola',
  },

  rotunda: {
    5: 'pentagonal-rotunda',
  },
};

const augmentData = _.mapValues(augmentees, type =>
  _.mapValues(type, Polyhedron.get),
);

const augmentTypes: Record<string, AugmentType> = {
  Y: 'pyramid',
  U: 'cupola',
  R: 'rotunda',
};

function getAugmentAlignment(polyhedron: Polyhedron, face: Face) {
  const boundary = getSingle(Cap.getAll(polyhedron)).boundary();
  return isInverse(boundary.normal(), face.normal()) ? 'para' : 'meta';
}

function getPossibleAugmentees(n: number) {
  const { pyramid, cupola, rotunda } = augmentData;
  return _.compact([pyramid[n], cupola[n / 2], rotunda[n / 2]]);
}

// Checks to see if the polyhedron can be augmented at the base while remaining convex
function canAugmentWith(base: Face, augmentee: Polyhedron, offset: number) {
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

function canAugmentWithType(base: Face, augmentType: AugmentType) {
  const n = augmentType === 'pyramid' ? base.numSides : base.numSides / 2;
  for (let offset of [0, 1]) {
    if (canAugmentWith(base, augmentData[augmentType][n], offset)) {
      return true;
    }
  }
  return false;
}

function canAugment(base: Face) {
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
const setEquals = <T>(array1: T[], array2: T[]) =>
  _.xor(array1, array2).length === 0;

function getBaseType(base: Face) {
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

function getOppositePrismFace(base: Face) {
  return base.edges[0]
    .twin()
    .next()
    .next()
    .twinFace();
}

function isCupolaRotunda(baseType: string, augmentType: string) {
  return setEquals(['cupola', 'rotunda'], [baseType, augmentType]);
}

// Return true if the base and augmentee are aligned
function isAligned(
  polyhedron: Polyhedron,
  base: Face,
  underside: Face,
  gyrate: string | undefined,
  augmentType: string,
) {
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

function getAugmentee(augmentType: AugmentType, numSides: number) {
  const index = _.includes(['cupola', 'rotunda'], augmentType)
    ? numSides / 2
    : numSides;
  return augmentData[augmentType][index];
}

function isFastigium(augmentType: string, numSides: number) {
  return augmentType === 'cupola' && numSides === 4;
}

// Augment the following
function doAugment(
  polyhedron: Polyhedron,
  base: Face,
  augmentType: AugmentType,
  gyrate?: string,
) {
  const numSides = base.numSides;
  const augmentee = getAugmentee(augmentType, numSides);
  const underside = augmentee.faceWithNumSides(base.numSides);

  // Determine the orientations of the underside and the base
  const undersideRadius = underside.vertices[0].vec
    .sub(underside.centroid())
    .getNormalized();

  const baseIsAligned = isAligned(
    polyhedron,
    base,
    underside,
    isFastigium(augmentType, numSides) ? 'gyro' : gyrate,
    augmentType,
  );
  const offset = baseIsAligned ? 0 : 1;
  const baseRadius = base.vertices[offset].vec
    .sub(base.centroid())
    .getNormalized();

  // https://math.stackexchange.com/questions/624348/finding-rotation-axis-and-angle-to-align-two-oriented-vectors
  // Determine the transformation that rotates the underside orientation to the base orientation
  // TODO we probably want this as some sort of generic method
  const transformMatrix = getOrthonormalTransform(
    undersideRadius,
    underside.normal().getInverted(),
    baseRadius,
    base.normal(),
  );
  const transform = withOrigin(base.centroid(), u =>
    transformMatrix.applyTo(u),
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

  const newAugmentee = augmentee.withChanges(s =>
    s.withVertices(rotatedVertices).withoutFaces([underside]),
  );

  const augmenteeInitial = augmentee.withVertices(
    repeat(base.centroid(), augmentee.numVertices()),
  );

  const endResult = polyhedron.addPolyhedron(newAugmentee);

  return {
    animationData: {
      start: polyhedron.addPolyhedron(augmenteeInitial),
      endVertices: endResult.vertices,
    },
    result: deduplicateVertices(endResult.withoutFaces([base])),
  };
}

function defaultAugmentType(numSides: number) {
  return numSides <= 5 ? 'pyramid' : 'cupola';
}

const defaultAugmentees: Record<number, string> = {
  3: 'Y3',
  4: 'Y4',
  5: 'Y5',
  6: 'U3',
  8: 'U4',
  10: 'U5',
};

function getAugmenteeNumSides(using: string) {
  const prefix = using[0];
  const index = _.toNumber(using.substring(1));
  return 'RU'.includes(prefix) ? index * 2 : index;
}

function getUsingOpt(using: string, numSides: number) {
  return typeof using === 'string' && getAugmenteeNumSides(using) === numSides
    ? using
    : defaultAugmentees[numSides];
}

const getUsingOpts = (polyhedron: Polyhedron) => {
  if (polyhedron.name === 'triangular prism') {
    return ['Y4', 'U2'];
  }
  if (inRow(polyhedron.name, 'prisms', 'decagonal')) {
    return ['U5', 'R5'];
  }
  const rows = ['pentagonal cupola', 'pentagonal rotunda'];
  if (_.some(rows, row => inRow(polyhedron.name, 'capstones', row))) {
    return ['U5', 'R5'];
  }
  return null;
};

const hasGyrateOpts = (polyhedron: Polyhedron) => {
  if (inSection(polyhedron.name, 'rhombicosidodecahedra')) {
    return true;
  }
  const cupolaRows = [
    'triangular cupola',
    'square cupola',
    'pentagonal cupola',
    'pentagonal rotunda',
  ];
  if (inColumn(polyhedron.name, 'capstones', 'gyroelongated')) {
    return false;
  }
  if (_.some(cupolaRows, row => inRow(polyhedron.name, 'capstones', row))) {
    return true;
  }
  return false;
};

type GyrateOpts = 'ortho' | 'gyro';
const allGyrateOpts: GyrateOpts[] = ['ortho', 'gyro'];

interface Options {
  face: Face;
  gyrate?: GyrateOpts;
  using?: string;
}
export const augment = makeOperation<Options>('augment', {
  apply(polyhedron, { face, gyrate, using }) {
    const augmentType = using
      ? augmentTypes[using[0]]
      : defaultAugmentType(face.numSides);
    return doAugment(polyhedron, face, augmentType, gyrate);
  },
  optionTypes: ['face', 'gyrate', 'using'],

  resultsFilter(polyhedron, config, relations) {
    const { face } = config;

    if (!face) {
      throw new Error('Invalid face');
    }
    const n = face.numSides;
    const using = getUsingOpt(config.using!, n);

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

  allOptionCombos(polyhedron) {
    const gyrateOpts = hasGyrateOpts(polyhedron) ? allGyrateOpts : [undefined];

    const usingOpts = getUsingOpts(polyhedron) ?? [undefined];
    const faceOpts = _.map(polyhedron.faces.filter(face => canAugment(face)));

    const options: Options[] = [];

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

  hitOption: 'face',
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

  faceSelectionStates(polyhedron, { face, using }) {
    return _.map(polyhedron.faces, f => {
      if (face && f.equals(face)) return 'selected';

      if (!using && canAugment(f)) return 'selectable';

      if (using && canAugmentWithType(f, augmentTypes[using[0]]))
        return 'selectable';
    });
  },

  allOptions(polyhedron, optionName) {
    switch (optionName) {
      case 'gyrate':
        return hasGyrateOpts(polyhedron) ? ['ortho', 'gyro'] : [];
      case 'using':
        return getUsingOpts(polyhedron) ?? [];
      default:
        return [];
    }
  },

  defaultOptions(solid) {
    if (!solid) return {};
    const usingOpts = getUsingOpts(solid) ?? [];
    return _.pickBy({
      gyrate: hasGyrateOpts(solid) && 'gyro',
      using: usingOpts.length > 1 && usingOpts[0],
    });
  },
});
