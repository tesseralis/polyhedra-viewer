import * as text from "./text"

import {
  classical,
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
  Table,
} from "data/tables"

export interface TableSection {
  header: string
  description: string
  sticky?: boolean
  tables?: Table[]
  narrowTables?: Table[]
  subsections?: TableSection[]
}

const polyhedronTables: TableSection[] = [
  {
    header: "Uniform Polyhedra",
    description: text.uniform,
    tables: [classical, prisms],
  },
  {
    header: "Johnson Solids",
    description: text.johnson,
    subsections: [
      {
        header: "Pyramids, Cupolæ, and Rotundæ",
        description: text.capstones,
        tables: [capstones],
        narrowTables: [capstonesMono, capstonesBi],
      },
      {
        header: "Augmented, Diminished, and Gyrate Polyhedra",
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
        header: "Elementary Johnson Solids",
        description: text.elementary,
        tables: [snubAntiprisms, others],
        narrowTables: [snubAntiprisms, othersTwoRows],
      },
    ],
  },
  {
    header: "And Many More...",
    sticky: true,
    description: text.more,
  },
]
export default polyhedronTables
