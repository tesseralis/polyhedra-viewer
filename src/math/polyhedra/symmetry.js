// @flow strict
import _ from 'lodash';

import { unescapeName, getType } from './names';
import { getJohnsonSymmetry } from 'data';

/**
 * Utilities to get symmetry information out of polyhedra names
 */

const adjectiveMap = {
  digonal: 2,
  triangular: 3,
  square: 4,
  pentagonal: 5,
  hexagonal: 6,
  octagonal: 8,
  decagonal: 10,
};

const reverseAdjectiveMap = _.invert(adjectiveMap);

interface Symmetry {
  group: string;
  sub: string;
}

export function getSymmetry(name: string): Symmetry {
  const type = getType(name);
  if (type === 'Platonic solid' || type === 'Archimedean solid') {
    const group = (() => {
      if (name.includes('tetra')) {
        return 'T';
      }
      if (name.includes('cub') || name.includes('oct')) {
        return 'O';
      }
      if (name.includes('icos') || name.includes('dodec')) {
        return 'I';
      }
      throw new Error('group not found');
    })();
    const chiral = name.includes('snub');
    return { group, sub: chiral ? '' : 'h' };
  }
  if (type === 'Prism') {
    const n = adjectiveMap[_.lowerCase(name.split('-')[0])];
    return { group: 'D', sub: `${n}h` };
  }
  if (type === 'Antiprism') {
    const n = adjectiveMap[_.lowerCase(name.split('-')[0])];
    return { group: 'D', sub: `${n}d` };
  }
  return getJohnsonSymmetry(unescapeName(name));
}

export function getSymmetryName({ group, sub }: Symmetry) {
  if ('TOI'.includes(group)) {
    const prefix = sub === 'h' ? 'full' : 'chiral';
    const base = (() => {
      switch (group) {
        case 'T':
          return 'tetrahedral';
        case 'O':
          return 'octahedral';
        case 'I':
          return 'icosahedral';
        default:
          return '';
      }
    })();
    return `${prefix} ${base}`;
  }
  if (group === 'C') {
    if (sub === 's') {
      return 'bilateral';
    }
    if (sub === '2v') {
      return 'biradial';
    }
    const n = parseInt(_.trimEnd(sub, 'v'), 10);
    return reverseAdjectiveMap[n] + ' pyramidal';
  }
  if (group === 'D') {
    const last = sub.substr(sub.length - 1);
    if (last === 'h') {
      const n = parseInt(_.trimEnd(sub, 'h'), 10);
      return reverseAdjectiveMap[n] + ' prismatic';
    }
    if (last === 'd') {
      const n = parseInt(_.trimEnd(sub, 'd'), 10);
      return reverseAdjectiveMap[n] + ' antiprismatic';
    }

    const n = parseInt(sub, 10);
    return reverseAdjectiveMap[n] + ' dihedral';
  }
  throw new Error('invalid group');
}

// TODO lots of repeated logic as with getting the display name
export function getOrder(name: string) {
  const { group, sub } = getSymmetry(name);
  if ('TOI'.includes(group)) {
    const mult = sub === 'h' ? 2 : 1;
    const base = (() => {
      switch (group) {
        case 'T':
          return 12;
        case 'O':
          return 24;
        case 'I':
          return 60;
        default:
          return 0;
      }
    })();
    return base * mult;
  }
  if (group === 'C') {
    if (sub === 's') {
      return 2;
    }
    const n = parseInt(_.trimEnd(sub, 'v'), 10);
    return 2 * n;
  }
  if (group === 'D') {
    const last = sub.substr(sub.length - 1);
    if (last === 'h') {
      const n = parseInt(_.trimEnd(sub, 'h'), 10);
      return 4 * n;
    }
    if (last === 'd') {
      const n = parseInt(_.trimEnd(sub, 'd'), 10);
      return 4 * n;
    }

    const n = parseInt(sub, 10);
    return 2 * n;
  }
  throw new Error('invalid group');
}
