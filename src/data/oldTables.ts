import { chunk } from "lodash-es"
import {
  classicalTable,
  prismaticTable,
  capstoneTable,
  augmentedTable,
  diminishedTable,
  gyrateTable,
  snubAntiprismTable,
  elementaryTable,
} from "./tables"
import PolyhedronSpecs from "data/specs/PolyhedronSpecs"

export type Column = { name: string; sub: string[] } | string
export type Data = PolyhedronSpecs | PolyhedronSpecs[]
export type DataRow = Data[]

export interface Table {
  caption: string
  rows: string[]
  columns: Column[]
  data: DataRow[]
}

function convertTable(table: any) {
  return table
}

export const archimedean: Table = {
  caption: "Platonic and Archimedean Solids",
  rows: [
    "regular",
    "truncated",
    "rectified",
    "bevelled",
    "cantellated",
    "snub",
  ],
  // TODO this causes an extra "empty" row to be read by screenreaders
  columns: [
    { name: "", sub: ["tetrahedron"] },
    { name: "", sub: ["cube", "octahedron"] },
    { name: "", sub: ["dodecahedron", "icosahedron"] },
  ],
  data: convertTable(classicalTable),
}

export const prisms: Table = {
  caption: "Prisms and Antiprisms",
  rows: [
    "triangular",
    "square",
    "pentagonal",
    "hexagonal",
    "octagonal",
    "decagonal",
  ],
  columns: ["prism", "antiprism"],
  data: convertTable(prismaticTable),
}

export const capstones: Table = {
  caption: "Pyramids, Cupolæ, and Rotundæ",
  rows: [
    "triangular pyramid",
    "square pyramid",
    "pentagonal pyramid",
    "digonal cupola",
    "triangular cupola",
    "square cupola",
    "pentagonal cupola",
    "cupola-rotunda",
    "pentagonal rotunda",
  ],
  columns: [
    "--",
    "elongated",
    "gyroelongated",
    { name: "bi-", sub: ["ortho-", "gyro-"] },
    { name: "elongated bi-", sub: ["ortho-", "gyro-"] },
    "gyroelongated bi-",
  ],
  data: convertTable(capstoneTable),
}

const capstoneMonoTable = capstoneTable
  .map((row) => row.slice(0, 3))
  .filter((row, i) => i !== 3 && i !== 7)

export const capstonesMono: Table = {
  caption: "Pyramids, Cupolæ, and Rotundæ",
  rows: [
    "triangular pyramid",
    "square pyramid",
    "pentagonal pyramid",
    "triangular cupola",
    "square cupola",
    "pentagonal cupola",
    "pentagonal rotunda",
  ],
  columns: ["--", "elongated", "gyroelongated"],
  data: convertTable(capstoneMonoTable),
}

const capstoneBiTable = capstoneTable.map((row) => row.slice(3))

export const capstonesBi: Table = {
  caption: "Bipyramids, Cupolæ, and Rotundæ",
  rows: [
    "triangular pyramid",
    "square pyramid",
    "pentagonal pyramid",
    "digonal cupola",
    "triangular cupola",
    "square cupola",
    "pentagonal cupola",
    "cupola-rotunda",
    "pentagonal rotunda",
  ],
  columns: [
    { name: "bi-", sub: ["ortho-", "gyro-"] },
    { name: "elongated bi-", sub: ["ortho-", "gyro-"] },
    "gyroelongated bi-",
  ],
  data: convertTable(capstoneBiTable),
}

export const augmented: Table = {
  caption: "Augmented Polyhedra",
  rows: [
    "triangular prism",
    "pentagonal prism",
    "hexagonal prism",
    "dodecahedron",
    "truncated tetrahedron",
    "truncated cube",
    "truncated dodecahedron",
  ],
  columns: [
    "augmented",
    { name: "biaugmented", sub: ["para-", "meta-"] },
    "triaugmented",
  ],
  data: convertTable(augmentedTable),
}

export const icosahedra: Table = {
  caption: "Diminished Icosahedra",
  rows: ["icosahedron"],
  columns: [
    "diminished",
    { name: "bidiminished", sub: ["para-", "meta-"] },
    { name: "tridiminished", sub: ["--", "augmented"] },
  ],
  data: convertTable(diminishedTable),
}

export const rhombicosidodecahedra: Table = {
  caption: "Gyrate and Diminished Rhombicosidodecahedra",
  rows: ["--", "gyrate", "bigyrate", "trigyrate"],
  columns: [
    { name: "--", sub: ["para-", "meta-"] },
    { name: "diminished", sub: ["para-", "meta-"] },
    { name: "bidiminished", sub: ["para-", "meta-"] },
    "tridiminished",
  ],
  data: convertTable(gyrateTable),
}

const gyrateRhombicos = gyrateTable.slice(1).map((row) => [row[0]])
export const gyrateRhombicosidodecahedra: Table = {
  caption: "Gyrate Rhombicosidodecahedra",
  rows: ["gyrate", "bigyrate", "trigyrate"],
  columns: [{ name: "--", sub: ["para-", "meta-"] }],
  data: convertTable(gyrateRhombicos),
}

const diminishedRhombicos = gyrateTable.slice(0, 3).map((row) => row.slice(1))
export const diminishedRhombicosidodecahedra: Table = {
  caption: "Diminished Rhombicosidodecahedra",
  rows: ["--", "gyrate", "bigyrate"],
  columns: [
    { name: "diminished", sub: ["para-", "meta-"] },
    { name: "bidiminished", sub: ["para-", "meta-"] },
    "tridiminished",
  ],
  data: convertTable(diminishedRhombicos),
}
export const snubAntiprisms: Table = {
  caption: "Snub Antiprisms",
  rows: ["snub"],
  columns: ["digonal", "triangular", "square"],
  data: convertTable(snubAntiprismTable),
}

export const others: Table = {
  caption: "Other Johnson Solids",
  rows: [""],
  columns: ["", "", "", "", "", "", ""],
  data: convertTable(elementaryTable),
}

export const elementaryTwoRows = chunk(elementaryTable[0], 4)
export const othersTwoRows: Table = {
  caption: "Other Johnson Solids",
  rows: [""],
  columns: ["", "", "", ""],
  data: convertTable(elementaryTwoRows),
}

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
}
