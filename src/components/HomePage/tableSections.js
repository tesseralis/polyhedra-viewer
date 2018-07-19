// @flow strict

import * as text from './text';

import {
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
  type TableSection,
} from 'constants/polyhedronTables';

const polyhedronTables: TableSection[] = [
  {
    header: 'Uniform Polyhedra',
    description: text.uniform,
    tables: [archimedean, prisms],
  },
  {
    header: 'Johnson Solids',
    description: text.johnson,
    subsections: [
      {
        header: 'Pyramids, Cupoplæ, and Rotundæ',
        description: text.capstones,
        tables: [capstones],
        narrowTables: [capstonesMono, capstonesBi],
      },
      {
        header: 'Augmented, Diminished, and Gyrate Polyhedra',
        description: text.cutPaste,
        tables: [augmented, icosahedra, rhombicosidodecahedra],
        narrowTables: [
          augmented,
          icosahedra,
          gyrateRhombicosidodecahedra,
          diminishedRhombicosidodecahedra,
        ],
      },
      {
        header: 'Elementary Johnson Solids',
        description: text.elementary,
        tables: [snubAntiprisms, others],
      },
    ],
  },
  {
    header: 'And Many More...',
    sticky: true,
    description: text.more,
  },
];
export default polyhedronTables;
