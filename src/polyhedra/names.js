// @flow strict
import _ from 'lodash';

import { johnsonSolids } from 'data';

export const escapeName = (name: string) => name.replace(/ /g, '-');

export const unescapeName = (name: string) => name.replace(/-/g, ' ');

const prismNames = {
  '3': 'triangular',
  '4': 'square',
  '5': 'pentagonal',
  '6': 'hexagonal',
  '8': 'octagonal',
  '10': 'decagonal',
};

const inversePrismNames = _.invert(prismNames);

const platonicMapping = {
  T: 'tetrahedron',
  C: 'cube',
  O: 'octahedron',
  D: 'dodecahedron',
  I: 'icosahedron',
};

const inversePlatonicMapping = _.invert(platonicMapping);

const archimedeanMapping = {
  tT: 'truncated tetrahedron',
  aC: 'cuboctahedron',
  tC: 'truncated cube',
  tO: 'truncated octahedron',
  eC: 'rhombicuboctahedron',
  bC: 'truncated cuboctahedron',
  sC: 'snub cube',
  aD: 'icosidodecahedron',
  tD: 'truncated dodecahedron',
  tI: 'truncated icosahedron',
  eD: 'rhombicosidodecahedron',
  bD: 'truncated icosidodecahedron',
  sD: 'snub dodecahedron',
};
const inverseArchimedeanMapping = _.invert(archimedeanMapping);

const alternateNames = {
  tetrahedron: ['triangular pyramid', 'digonal antiprism', 'disphenoid'],
  cube: ['square prism'],
  octahedron: [
    'tetratetrahedron', // hehe
    'triangular antiprism',
    'triangular bipyramid',
  ],
  icosahedron: [
    'snub tetrahedron',
    'elongated pentagonal bipyramid',
    'snub triangular antiprism',
  ],
  cuboctahedron: ['rhombitetratetrahedron', 'triangular gyrobicupola'],
  'truncated octahedron': ['truncated tetratetrahedron'],
  rhombicuboctahedron: ['elongated square orthobicupola'],
  icosidodecahedron: ['pentagonal gyrobirotunda'],
  'triangular prism': ['fastigium', 'digonal cupola'],

  // related to augmented/diminished/gyrate solids
  'pentagonal antiprism': ['parabidiminished icosahedron'],
  'gyroelongated pentagonal pyramid': ['diminished icosahedron'],
  'square pyramid': ['diminished octahedron'],

  'triangular bipyramid': ['augmented tetrahedron'],
  'elongated square pyramid': ['augmented cube', 'augmented square prism'],
  'elongated square bipyramid': [
    'biaugmented cube',
    'biaugmented square prism',
  ],

  'elongated square gyrobicupola': [
    'pseudorhombicuboctahedron',
    'gyrate rhombicuboctahedron',
  ],
  'elongated square cupola': ['diminished rhombicuboctahedron'],
  'octagonal prism': ['bidiminished rhombicuboctahedron'],
};
const inverseAlternateNames = _(alternateNames)
  .flatMap((alts, canonical) => _.map(alts, alt => [alt, canonical]))
  .fromPairs()
  .value();

// TODO figure out how to move this to 'data' so it can be used in construction
export function getCanonicalName(name: string) {
  return inverseAlternateNames[name] || name;
}

const fromConwayNotationUnescaped = notation => {
  const prefix = notation[0];
  const number = notation.substring(1);
  if (platonicMapping[notation]) {
    return platonicMapping[notation];
  }
  if (archimedeanMapping[notation]) {
    return archimedeanMapping[notation];
  }
  if (prefix === 'J') {
    return johnsonSolids[_.toNumber(number) - 1];
  }
  if (prefix === 'P') {
    return `${prismNames[number]} prism`;
  }
  if (prefix === 'A') {
    return `${prismNames[number]} antiprism`;
  }
  return '';
};

export const fromConwayNotation = (notation: string) =>
  escapeName(fromConwayNotationUnescaped(notation));

export const toConwayNotation = (solid: string) => {
  const name = unescapeName(solid);
  if (inversePlatonicMapping[name]) {
    return inversePlatonicMapping[name];
  }
  if (inverseArchimedeanMapping[name]) {
    return inverseArchimedeanMapping[name];
  }
  if (_.includes(johnsonSolids, name)) {
    return 'J' + (johnsonSolids.indexOf(name) + 1);
  }
  if (name.includes('antiprism')) {
    const [prefix] = name.split(' ');
    return 'A' + inversePrismNames[prefix];
  }
  if (name.includes('prism')) {
    const [prefix] = name.split(' ');
    return 'P' + inversePrismNames[prefix];
  }
  throw new Error(`Invalid solid name ${solid}`);
};

export function getType(solid: string) {
  const name = unescapeName(solid);
  if (inversePlatonicMapping[name]) {
    return 'Platonic Solid';
  }
  if (inverseArchimedeanMapping[name]) {
    return 'Archimedean Solid';
  }
  if (_.includes(johnsonSolids, name)) {
    return 'Johnson Solid';
  }
  if (name.includes('antiprism')) {
    return 'Antiprism';
  }
  if (name.includes('prism')) {
    return 'Prism';
  }
  throw new Error(`Invalid solid name ${solid}`);
}
