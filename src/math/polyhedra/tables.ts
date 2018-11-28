import _ from 'lodash';

export type Column = { name: string; sub: string[] } | string;
export type Data = string | string[];
export type DataRow = Data[];

export interface Table {
  caption: string;
  rows: string[];
  columns: Column[];
  data: DataRow[];
}

export const archimedean: Table = {
  caption: 'Platonic and Archimedean Solids',
  rows: [
    'regular',
    'truncated',
    'rectified',
    'bevelled',
    'cantellated',
    'snub',
  ],
  // TODO this causes an extra "empty" row to be read by screenreaders
  columns: [
    { name: '', sub: ['tetrahedron'] },
    { name: '', sub: ['cube', 'octahedron'] },
    { name: '', sub: ['dodecahedron', 'icosahedron'] },
  ],
  data: [
    ['T', ['C', 'O'], ['D', 'I']],
    ['tT', ['tC', 'tO'], ['tD', 'tI']],
    ['!O', 'aC', 'aD'],
    ['!tO', 'bC', 'bD'],
    ['!aC', 'eC', 'eD'],
    ['!I', 'sC', 'sD'],
  ],
};

export const prisms: Table = {
  caption: 'Prisms and Antiprisms',
  rows: [
    'triangular',
    'square',
    'pentagonal',
    'hexagonal',
    'octagonal',
    'decagonal',
  ],
  columns: ['prism', 'antiprism'],
  data: _.unzip([
    ['P3', '!C', 'P5', 'P6', 'P8', 'P10'],
    ['!O', 'A4', 'A5', 'A6', 'A8', 'A10'],
  ]),
};

export const capstones: Table = {
  caption: 'Pyramids, Cupoplæ, and Rotundæ',
  rows: [
    'triangular pyramid',
    'square pyramid',
    'pentagonal pyramid',
    'digonal cupola',
    'triangular cupola',
    'square cupola',
    'pentagonal cupola',
    'cupola-rotunda',
    'pentagonal rotunda',
  ],
  columns: [
    '--',
    'elongated',
    'gyroelongated',
    { name: 'bi-', sub: ['ortho-', 'gyro-'] },
    { name: 'elongated bi-', sub: ['ortho-', 'gyro-'] },
    'gyroelongated bi-',
  ],
  data: _.unzip([
    ['!T', 'J1', 'J2', '!P3', 'J3', 'J4', 'J5', '', 'J6'],
    ['J7', 'J8', 'J9', 'coplanar', 'J18', 'J19', 'J20', '', 'J21'],
    ['coplanar', 'J10', 'J11', 'concave', 'J22', 'J23', 'J24', '', 'J25'],
    [
      'J12',
      '!O',
      'J13',
      ['coplanar', 'J26'],
      ['J27', '!aC'],
      ['J28', 'J29'],
      ['J30', 'J31'],
      ['J32', 'J33'],
      ['J34', '!aD'],
    ],
    [
      'J14',
      'J15',
      'J16',
      ['coplanar', 'coplanar'],
      ['J35', 'J36'],
      ['!eC', 'J37'],
      ['J38', 'J39'],
      ['J40', 'J41'],
      ['J42', 'J43'],
    ],
    ['coplanar', 'J17', '!I', 'concave', 'J44', 'J45', 'J46', 'J47', 'J48'],
  ]),
};

export const capstonesMono: Table = {
  caption: 'Pyramids, Cupoplæ, and Rotundæ',
  rows: [
    'triangular pyramid',
    'square pyramid',
    'pentagonal pyramid',
    'triangular cupola',
    'square cupola',
    'pentagonal cupola',
    'pentagonal rotunda',
  ],
  columns: ['--', 'elongated', 'gyroelongated'],
  data: _.unzip([
    ['!T', 'J1', 'J2', 'J3', 'J4', 'J5', 'J6'],
    ['J7', 'J8', 'J9', 'J18', 'J19', 'J20', 'J21'],
    ['coplanar', 'J10', 'J11', 'J22', 'J23', 'J24', 'J25'],
  ]),
};

export const capstonesBi: Table = {
  caption: 'Bipyramids, Cupoplæ, and Rotundæ',
  rows: [
    'triangular pyramid',
    'square pyramid',
    'pentagonal pyramid',
    'digonal cupola',
    'triangular cupola',
    'square cupola',
    'pentagonal cupola',
    'cupola-rotunda',
    'pentagonal rotunda',
  ],
  columns: [
    { name: 'bi-', sub: ['ortho-', 'gyro-'] },
    { name: 'elongated bi-', sub: ['ortho-', 'gyro-'] },
    'gyroelongated bi-',
  ],
  data: _.unzip([
    [
      'J12',
      '!O',
      'J13',
      ['coplanar', 'J26'],
      ['J27', '!aC'],
      ['J28', 'J29'],
      ['J30', 'J31'],
      ['J32', 'J33'],
      ['J34', '!aD'],
    ],
    [
      'J14',
      'J15',
      'J16',
      ['coplanar', 'coplanar'],
      ['J35', 'J36'],
      ['!eC', 'J37'],
      ['J38', 'J39'],
      ['J40', 'J41'],
      ['J42', 'J43'],
    ],
    ['coplanar', 'J17', '!I', 'concave', 'J44', 'J45', 'J46', 'J47', 'J48'],
  ]),
};

export const augmented: Table = {
  caption: 'Augmented Polyhedra',
  rows: [
    'triangular prism',
    'pentagonal prism',
    'hexagonal prism',
    'dodecahedron',
    'truncated tetrahedron',
    'truncated cube',
    'truncated dodecahedron',
  ],
  columns: [
    'augmented',
    { name: 'biaugmented', sub: ['para-', 'meta-'] },
    'triaugmented',
  ],
  data: [
    ['J49', 'J50', 'J51'],
    ['J52', 'J53'],
    ['J54', ['J55', 'J56'], 'J57'],
    ['J58', ['J59', 'J60'], 'J61'],
    ['J65'],
    ['J66', 'J67'],
    ['J68', ['J69', 'J70'], 'J71'],
  ],
};

export const icosahedra: Table = {
  caption: 'Diminished Icosahedra',
  rows: ['icosahedron'],
  columns: [
    'diminished',
    { name: 'bidiminished', sub: ['para-', 'meta-'] },
    { name: 'tridiminished', sub: ['--', 'augmented'] },
  ],
  data: [['!J11', ['!A5', 'J62'], ['J63', 'J64']]],
};

export const rhombicosidodecahedra: Table = {
  caption: 'Gyrate and Diminished Rhombicosidodecahedra',
  rows: ['--', 'gyrate', 'bigyrate', 'trigyrate'],
  columns: [
    { name: '--', sub: ['para-', 'meta-'] },
    { name: 'diminished', sub: ['para-', 'meta-'] },
    { name: 'bidiminished', sub: ['para-', 'meta-'] },
    'tridiminished',
  ],
  data: [
    ['!eD', 'J76', ['J80', 'J81'], 'J83'],
    ['J72', ['J77', 'J78'], 'J82'],
    [['J73', 'J74'], 'J79'],
    ['J75'],
  ],
};

export const gyrateRhombicosidodecahedra: Table = {
  caption: 'Gyrate Rhombicosidodecahedra',
  rows: ['gyrate', 'bigyrate', 'trigyrate'],
  columns: [{ name: '--', sub: ['para-', 'meta-'] }],
  data: [['J72'], [['J73', 'J74']], ['J75']],
};
export const diminishedRhombicosidodecahedra: Table = {
  caption: 'Diminished Rhombicosidodecahedra',
  rows: ['--', 'gyrate', 'bigyrate'],
  columns: [
    { name: 'diminished', sub: ['para-', 'meta-'] },
    { name: 'bidiminished', sub: ['para-', 'meta-'] },
    'tridiminished',
  ],
  data: [['J76', ['J80', 'J81'], 'J83'], [['J77', 'J78'], 'J82'], ['J79']],
};
export const snubAntiprisms: Table = {
  caption: 'Snub Antiprisms',
  rows: ['snub'],
  columns: ['digonal', 'triangular', 'square'],
  data: [['J84', '!I', 'J85']],
};

export const others: Table = {
  caption: 'Other Johnson Solids',
  rows: [''],
  columns: ['', '', '', '', '', '', ''],
  data: [['J86', 'J87', 'J88', 'J89', 'J90', 'J91', 'J92']],
};

export const othersTwoRows: Table = {
  caption: 'Other Johnson Solids',
  rows: [''],
  columns: ['', '', '', ''],
  data: [['J86', 'J87', 'J88', 'J89'], ['J90', 'J91', 'J92']],
};

export const sections: Record<string, Table> = {
  archimedean,
  prisms,
  capstones,
  capstonesMono,
  capstonesBi,
  augmented,
  icosahedra,
  rhombicosidodecahedra,
  gyrateRhombicosidodecahedra,
  diminishedRhombicosidodecahedra,
  snubAntiprisms,
  others,
  othersTwoRows,
};
