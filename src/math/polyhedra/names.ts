import _ from 'lodash';

import { johnsonSolids, allSolidNames } from 'data';
import { choose, bimap } from 'utils';
import polygons, { polygonPrefixes } from '../polygons';

export const escapeName = (name: string) => name.replace(/ /g, '-');

export const unescapeName = (name: string) => name.replace(/-/g, ' ');

const platonicMapping = bimap({
  T: 'tetrahedron',
  C: 'cube',
  O: 'octahedron',
  D: 'dodecahedron',
  I: 'icosahedron',
});

const archimedeanMapping = bimap({
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
});

export const alternateNames: Record<string, string[]> = {
  tetrahedron: ['triangular pyramid', 'digonal antiprism', 'disphenoid'],
  cube: ['square prism'],
  octahedron: [
    'tetratetrahedron', // hehe
    'triangular antiprism',
    'square bipyramid',
  ],
  icosahedron: [
    'snub tetrahedron',
    'gyroelongated pentagonal bipyramid',
    'snub triangular antiprism',
  ],
  cuboctahedron: ['rhombitetratetrahedron', 'triangular gyrobicupola'],
  'truncated octahedron': ['truncated tetratetrahedron'],
  rhombicuboctahedron: ['elongated square orthobicupola'],
  'snub cube': ['snub cuboctahedron'],
  icosidodecahedron: ['pentagonal gyrobirotunda'],
  'triangular prism': ['fastigium', 'digonal cupola'],
  'snub dodecahedron': ['snub icosidodecahedron'],

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

export function getCanonicalName(name: string) {
  return inverseAlternateNames[unescapeName(name)] ?? name;
}

export function getAlternateNames(name: string) {
  return alternateNames[unescapeName(name)] ?? [];
}

export function isAlternateName(name: string) {
  return _.has(inverseAlternateNames, unescapeName(name));
}

export function randomSolidName(): string {
  return escapeName(choose(allSolidNames));
}

export function isConwaySymbol(symbol: string) {
  if (platonicMapping.hasKey(symbol) || archimedeanMapping.hasKey(symbol)) {
    return true;
  }
  const prefix = symbol[0];
  const number = parseInt(symbol.substring(1), 10);
  if (prefix === 'J' && number >= 0 && number <= 92) {
    return true;
  }
  if (_.includes(['P', 'A'], prefix) && _.includes(polygons, number)) {
    return true;
  }
  return false;
}

export const fromConwayNotation = (notation: string) => {
  const prefix = notation[0];
  const number = parseInt(notation.substring(1));
  if (platonicMapping.hasKey(notation)) {
    return platonicMapping.get(notation);
  }
  if (archimedeanMapping.hasKey(notation)) {
    return archimedeanMapping.get(notation);
  }
  if (prefix === 'J') {
    return johnsonSolids[_.toNumber(number) - 1];
  }
  if (prefix === 'P' && polygonPrefixes.hasKey(number)) {
    return `${polygonPrefixes.get(number)} prism`;
  }
  if (prefix === 'A' && polygonPrefixes.hasKey(number)) {
    return `${polygonPrefixes.get(number)} antiprism`;
  }
  return '';
};

export const toConwayNotation = (solid: string) => {
  const name = solid;
  if (platonicMapping.hasValue(name)) {
    return platonicMapping.of(name);
  }
  if (archimedeanMapping.hasValue(name)) {
    return archimedeanMapping.of(name);
  }
  if (_.includes(johnsonSolids, name)) {
    return 'J' + (johnsonSolids.indexOf(name) + 1);
  }
  const [prefix] = name.split(' ');
  if (name.includes('antiprism') && polygonPrefixes.hasValue(prefix)) {
    return 'A' + polygonPrefixes.of(prefix);
  }
  if (name.includes('prism') && polygonPrefixes.hasValue(prefix)) {
    return 'P' + polygonPrefixes.of(prefix);
  }
  throw new Error(`Invalid solid name ${solid}`);
};

export function getType(solid: string) {
  const name = unescapeName(solid);
  if (platonicMapping.hasValue(name)) {
    return 'Platonic solid';
  }
  if (archimedeanMapping.hasValue(name)) {
    return 'Archimedean solid';
  }
  if (_.includes(johnsonSolids, name)) {
    return 'Johnson solid';
  }
  if (name.includes('antiprism')) {
    return 'Antiprism';
  }
  if (name.includes('prism')) {
    return 'Prism';
  }
  throw new Error(`Invalid solid name ${solid}`);
}
