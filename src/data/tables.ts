import { chunk, range } from "lodash-es"
import { Operation, operations, families } from "./specs/Classical"
import {
  PolyhedronSpecs,
  Classical,
  Composite,
  Capstone,
  Elementary,
  Polygon,
  PrimaryPolygon,
  primaryPolygons,
  polygonTypes,
  PolygonType,
  prismaticTypes,
  facets,
  gyrations,
  alignments,
} from "./specs"
import { Count, counts } from "./specs/Composite"
import { getSpecs2 } from "./specs/getSpecs"

const gyrateLabels = gyrations.map((gyrate) => `${gyrate}-`)
const alignLabels = alignments.map((align) => `${align}-`)

export type Column = { name: string; sub: string[] } | string
type Data = PolyhedronSpecs | string
export type DataEntry = Data | Data[]
export type DataRow = DataEntry[]

export interface Table {
  caption: string
  rows: string[]
  columns: Column[]
  data: DataRow[]
}

function* classicalRow(operation: Operation) {
  for (const family of families) {
    if (Classical.hasFacet(operation)) {
      if (family === 3) {
        yield Classical.query.withData({ operation, family, facet: "face" })
      } else {
        yield facets.map((facet) =>
          Classical.query.withData({ operation, family, facet }),
        )
      }
    } else {
      yield Classical.query.withData({ operation, family })
    }
  }
}

function* classicalRows() {
  for (const operation of operations) {
    yield [...classicalRow(operation)]
  }
}

export const classical: Table = {
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
  data: [...classicalRows()],
}

function* prismaticRow(base: PrimaryPolygon, type: PolygonType) {
  for (const elongation of prismaticTypes) {
    yield Capstone.query.withData({ base, type, elongation, count: 0 })
  }
}

function* prismaticRows() {
  for (const base of families) {
    for (const type of polygonTypes) {
      yield [...prismaticRow(base, type)]
    }
  }
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
  data: [...prismaticRows()],
}

function capstoneEntry(data: Capstone["data"], rotunda?: any) {
  if (
    data.base === 3 &&
    data.type === "primary" &&
    data.elongation === "antiprism"
  ) {
    return "coplanar"
  }
  if (rotunda === "half" && data.count === 1) return ""
  const rotundaCount = rotunda === "half" ? 1 : rotunda ? data.count : 0
  if (Capstone.hasGyrate(data)) {
    return gyrations.map((gyrate) =>
      Capstone.query.withData({ ...data, gyrate, rotundaCount }),
    )
  } else {
    return Capstone.query.withData({ ...data, rotundaCount })
  }
}

function* capstoneRow(base: Polygon, type: PolygonType, rotunda?: any) {
  for (const count of [1, 2]) {
    for (const elongation of ["null", ...prismaticTypes]) {
      yield capstoneEntry(
        {
          base: base as any,
          type,
          count: count as any,
          elongation: elongation as any,
        },
        rotunda,
      )
    }
  }
}

function* fastigiumRow() {
  yield getSpecs2("digonal cupola")
  yield "coplanar"
  yield "concave"
  yield ["coplanar", getSpecs2("digonal gyrobicupola")]
  yield ["coplanar", "coplanar"]
  yield "concave"
}

function* capstoneRows() {
  for (const base of primaryPolygons) {
    yield [...capstoneRow(base as Polygon, "primary")]
  }
  // cupola
  yield [...fastigiumRow()]
  for (const base of primaryPolygons) {
    yield [...capstoneRow(base as Polygon, "secondary")]
  }
  yield [...capstoneRow(5, "secondary", "half")]
  yield [...capstoneRow(5, "secondary", true)]
}

const capstoneTable = [...capstoneRows()]

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
    { name: "bi-", sub: gyrateLabels },
    { name: "elongated bi-", sub: gyrateLabels },
    "gyroelongated bi-",
  ],
  data: capstoneTable,
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
  data: capstoneMonoTable,
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
    { name: "bi-", sub: gyrateLabels },
    { name: "elongated bi-", sub: gyrateLabels },
    "gyroelongated bi-",
  ],
  data: capstoneBiTable,
}

const augSources = [
  "triangular prism",
  "pentagonal prism",
  "hexagonal prism",
  "dodecahedron",
  "truncated tetrahedron",
  "truncated cube",
  "truncated dodecahedron",
]

function augmentEntry(source: PolyhedronSpecs, augmented: Count) {
  if (Composite.hasAlignment({ source: source as any, augmented })) {
    return alignments.map(
      (align) =>
        Composite.query.where(
          (s) =>
            s.data.source.equals(source) &&
            s.data.augmented === augmented &&
            s.data.align === align,
        )[0],
    )
  } else {
    return Composite.query.where(
      (s) => s.data.source.equals(source) && s.data.augmented === augmented,
    )[0]
  }
}

function* augmentedRow(source: PolyhedronSpecs) {
  for (const augmented of range(1, Composite.modifyLimit(source as any) + 1)) {
    yield augmentEntry(source, augmented as any)
  }
}

function* augmentedRows() {
  for (const sourceName of augSources) {
    yield [...augmentedRow(getSpecs2(sourceName))]
  }
}

export const augmented: Table = {
  caption: "Augmented Polyhedra",
  rows: augSources,
  columns: [
    "augmented",
    { name: "biaugmented", sub: alignLabels },
    "triaugmented",
  ],
  data: [...augmentedRows()],
}

function diminishedEntry(diminished: Count) {
  if (diminished === 3) {
    return [0, 1].map(
      (augmented) =>
        Composite.query.where(
          (s) =>
            s.isDiminishedSolid() &&
            s.data.diminished === diminished &&
            s.data.augmented === augmented,
        )[0],
    )
  } else if (diminished === 2) {
    return alignments.map(
      (align) =>
        Composite.query.where(
          (s) =>
            s.isDiminishedSolid() &&
            s.data.align === align &&
            s.data.diminished === diminished,
        )[0],
    )
  } else {
    return Composite.query.where(
      (s) => s.isDiminishedSolid() && s.data.diminished === diminished,
    )[0]
  }
}

function* diminishedRow() {
  for (const diminished of counts.slice(1)) {
    yield diminishedEntry(diminished)
  }
}

export const icosahedra: Table = {
  caption: "Diminished Icosahedra",
  rows: ["icosahedron"],
  columns: [
    "diminished",
    { name: "bidiminished", sub: alignLabels },
    { name: "tridiminished", sub: ["--", "augmented"] },
  ],
  data: [[...diminishedRow()]],
}

function gyrateEntry(gyrate: Count, diminished: Count) {
  if (gyrate + diminished === 2) {
    return alignments.map((align) => {
      return Composite.query.where(
        (s) =>
          s.isGyrateSolid() &&
          s.data.align === align &&
          s.data.gyrate === gyrate &&
          s.data.diminished === diminished,
      )[0]
    })
  } else {
    return Composite.query.where(
      (s) =>
        s.isGyrateSolid() &&
        s.data.gyrate === gyrate &&
        s.data.diminished === diminished,
    )[0]
  }
}

function* gyrateRow(gyrate: Count) {
  for (const diminished of counts) {
    if (gyrate + diminished <= 3) {
      yield gyrateEntry(gyrate, diminished)
    }
  }
}

function* gyrateRows() {
  for (const gyrate of counts) {
    yield [...gyrateRow(gyrate)]
  }
}

export const gyrateTable = [...gyrateRows()]
export const rhombicosidodecahedra: Table = {
  caption: "Gyrate and Diminished Rhombicosidodecahedra",
  rows: ["--", "gyrate", "bigyrate", "trigyrate"],
  columns: [
    { name: "--", sub: alignLabels },
    { name: "diminished", sub: alignLabels },
    { name: "bidiminished", sub: alignLabels },
    "tridiminished",
  ],
  data: gyrateTable,
}

const gyrateRhombicos = gyrateTable.slice(1).map((row) => [row[0]])
export const gyrateRhombicosidodecahedra: Table = {
  caption: "Gyrate Rhombicosidodecahedra",
  rows: ["gyrate", "bigyrate", "trigyrate"],
  columns: [{ name: "--", sub: alignLabels }],
  data: gyrateRhombicos,
}

const diminishedRhombicos = gyrateTable.slice(0, 3).map((row) => row.slice(1))
export const diminishedRhombicosidodecahedra: Table = {
  caption: "Diminished Rhombicosidodecahedra",
  rows: ["--", "gyrate", "bigyrate"],
  columns: [
    { name: "diminished", sub: alignLabels },
    { name: "bidiminished", sub: alignLabels },
    "tridiminished",
  ],
  data: diminishedRhombicos,
}

function snubAntiprismRow() {
  return Capstone.query.where((cap) => cap.isSnub())
}

export const snubAntiprismTable = [snubAntiprismRow()]
export const snubAntiprisms: Table = {
  caption: "Snub Antiprisms",
  rows: ["snub"],
  columns: ["digonal", "triangular", "square"],
  data: [snubAntiprismRow()],
}
export const elementaryTable = [[...Elementary.getAll()]]
export const others: Table = {
  caption: "Other Johnson Solids",
  rows: [""],
  columns: ["", "", "", "", "", "", ""],
  data: elementaryTable,
}

export const elementaryTwoRows = chunk(elementaryTable[0], 4)
export const othersTwoRows: Table = {
  caption: "Other Johnson Solids",
  rows: [""],
  columns: ["", "", "", ""],
  data: elementaryTwoRows,
}

export const sections: Record<string, Table> = {
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
}
