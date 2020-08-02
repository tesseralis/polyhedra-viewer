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
  id: string
  header: string
  sticky?: boolean
  tables?: Table[]
  narrowTables?: Table[]
  subsections?: TableSection[]
}

const polyhedronTables: TableSection[] = [
  {
    id: "uniform",
    header: "Uniform Polyhedra",
    tables: [classical, prisms],
  },
  {
    id: "johnson",
    header: "Johnson Solids",
    subsections: [
      {
        id: "capstones",
        header: "Pyramids, Cupolæ, and Rotundæ",
        tables: [capstones],
        narrowTables: [capstonesMono, capstonesBi],
      },
      {
        id: "composite",
        header: "Augmented, Diminished, and Gyrate Polyhedra",
        tables: [augmented, icosahedra, rhombicosidodecahedra],
        narrowTables: [
          augmented,
          icosahedra,
          gyrateRhombicosidodecahedra,
          diminishedRhombicosidodecahedra,
        ],
      },
      {
        id: "elementary",
        header: "Elementary Johnson Solids",
        tables: [snubAntiprisms, others],
        narrowTables: [snubAntiprisms, othersTwoRows],
      },
    ],
  },
  {
    id: "more",
    header: "And Many More...",
    sticky: true,
  },
]
export default polyhedronTables
