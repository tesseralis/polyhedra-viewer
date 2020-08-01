import Classical, {
  Operation,
  operations,
  families,
  facets,
} from "./specs/Classical"
import Capstone, {
  polygonTypes,
  PolygonType,
  gyrations,
} from "./specs/Capstone"
import { Polygon, PrimaryPolygon, primaryPolygons } from "./polygons"
import { PrismaticType, prismaticTypes } from "./specs/common"
import Composite, { Count, counts, alignments } from "./specs/Composite"
import ModifiedAntiprism from "./specs/ModifiedAntiprism"
import Elementary from "./specs/Elementary"
import { chunk, range } from "lodash-es"
import PolyhedronSpecs from "./specs/PolyhedronSpecs"
import { getSpecs2 } from "./specs/getSpecs"

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

export const classicalTable = [...classicalRows()]

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

export const prismaticTable = [...prismaticRows()]

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
    console.log("finding entry", data)
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

export const capstoneTable = [...capstoneRows()]
console.log(capstoneTable)

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

export const augmentedTable = [...augmentedRows()]

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

export const diminishedTable = [[...diminishedRow()]]

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

export const snubAntiprismTable = [[...ModifiedAntiprism.getAll()]]
export const elementaryTable = [[...Elementary.getAll()]]
