import {
  mapValues,
  castArray,
  isObject,
  pickBy,
  mergeWith,
  compact,
  range,
} from "lodash-es"
import { polygonPrefixes } from "./polygons"
import {
  Table,
  Data as TableData,
  prisms,
  capstones,
  augmented,
} from "./oldTables"
import { toConwayNotation } from "./names"
import { mapObject } from "utils"

export interface Relation {
  value: string
  gyrate?: "ortho" | "gyro"
  align?: "meta" | "para"
  direction?: "forward" | "back"
  chiral?: boolean
}
type Graph = NestedRecord<string, string, any>
type FullGraph = NestedRecord<string, string, Relation[]>

// Make everything an array
function normalize(graph: Graph) {
  return mapValues(graph, ops =>
    mapValues(ops, relations => {
      return castArray(relations).map(relation =>
        isObject(relation) ? relation : { value: relation },
      )
    }),
  )
}

/** Remove nullish values from a graph */
function compactGraph(graph: Graph) {
  return mapValues(graph, operations => {
    const mappedOps = mapValues(operations, opts =>
      opts.filter((opt: any) => !!opt.value),
    )
    return pickBy(mappedOps, "length")
  })
}

const customizer = (objValue: unknown, srcValue: unknown) => {
  if (objValue instanceof Array) {
    return objValue.concat(srcValue)
  }
}

function graphMerge(object: Graph, other: Graph) {
  return mergeWith(object, other, customizer)
}

function graphMergeAll(...objects: Graph[]) {
  return objects.reduce(graphMerge)!
}

const getInverseOperation = (operation: string) => {
  switch (operation) {
    case "dual":
    case "gyrate":
    case "twist":
    case "turn":
      return operation
    case "augment":
      return "diminish"
    case "diminish":
      return "augment"
    case "truncate":
    case "rectify":
      return "sharpen"
    case "expand":
    case "snub":
      return "contract"
    case "elongate":
    case "gyroelongate":
      return "shorten"
    default:
      throw new Error(`Invalid operation: ${operation}`)
  }
}

/**
 * Populate a graph with inverse operations.
 */
function makeBidirectional(graph: FullGraph) {
  const result: FullGraph = {}
  for (const [source, operations] of Object.entries(graph)) {
    for (const [operation, sinks] of Object.entries(operations)) {
      for (const sink of sinks) {
        const sinkValue = sink.value
        if (!sinkValue) {
          continue
        }
        if (!result[sinkValue]) {
          result[sinkValue] = {}
        }
        const reverseOp = getInverseOperation(operation)
        if (!result[sinkValue][reverseOp]) {
          result[sinkValue][reverseOp] = []
        }
        if (sinkValue === source) {
          continue
        }
        const newValue = { ...sink, value: source }
        if (operation === "gyrate" && sink.direction) {
          newValue.direction = "back"
        }
        result[sinkValue][reverseOp].push(newValue)
      }
    }
  }
  return graphMerge(result, graph)
}

function getKeyedTable(table: Table) {
  const result: NestedRecord<string, string, any> = {}
  table.rows.forEach((row, i) => {
    result[row] = {}
    table.columns.forEach((column, j) => {
      const colName = typeof column === "object" ? column.name : column
      result[row][colName] = table.data[i][j]
    })
  })
  return result
}

const invalidNames = ["concave", "coplanar"]
function convertTableNotation(notation: TableData): any {
  if (Array.isArray(notation)) return notation.map(convertTableNotation)
  if (notation[0] === "!") return notation.substring(1)
  if (invalidNames.includes(notation)) return null
  return notation
}

function convertTable(table: Table) {
  return {
    ...table,
    data: table.data.map(row => row.map(convertTableNotation)),
  }
}

const [prismMap, capstoneMap, augmentationMap] = [prisms, capstones, augmented]
  .map(convertTable)
  .map(getKeyedTable)

const hasCupolaRotunda = (name: string) =>
  name.includes("pentagonal") && !name.includes("pyramid")
const cupolaRotunda = capstoneMap["cupola-rotunda"]

const getOrthoGyroAugment = (value: TableData, using: string) => {
  if (value instanceof Array) {
    return [
      { using, value: value[0], gyrate: "ortho" },
      { using, value: value[1], gyrate: "gyro" },
    ]
  } else {
    return [{ using, value }]
  }
}

const getCupolaRotunda = (using: string, colName: string) => {
  const altUsing = using.includes("U") ? "R5" : "U5"
  return getOrthoGyroAugment(cupolaRotunda[colName], altUsing)
}

const getAugmentations = (using: string) => (
  rowName: string,
  colName: string,
) => {
  return compact(
    [
      getOrthoGyroAugment(capstoneMap[rowName][colName], using),
      hasCupolaRotunda(rowName) && getCupolaRotunda(using, colName),
    ].flat(),
  )
}

const getCapstoneFromPrism = (prismRow: string) => {
  const isPyramid = ["triangular", "square", "pentagonal"].includes(prismRow)
  if (isPyramid) {
    return `${prismRow} pyramid`
  }
  const m = polygonPrefixes.of(prismRow as any)
  return `${polygonPrefixes.get((m / 2) as any)} cupola`
}

const capstoneConway: Record<string, string> = {
  pyramid: "Y",
  cupola: "U",
  rotunda: "R", // not official, I don't think
}

const getCapstoneConway = (name: string) => {
  const [sides, type] = name.split(" ")
  return `${capstoneConway[type]}${polygonPrefixes.of(sides as any)}`
}

const elongations = (
  pValue: string,
  aValue: string,
  gyrate?: string,
  chiral?: boolean,
) => {
  return {
    elongate: { value: pValue },
    gyroelongate: { value: aValue, gyrate, chiral },
  }
}

const archimedean = {
  T: {
    dual: "T",
    truncate: "tT",
    rectify: "O",
    expand: "aC",
    snub: "I",
  },
  C: {
    dual: "O",
    truncate: "tC",
    rectify: "aC",
    expand: "eC",
    snub: { value: "sC", chiral: true },
  },
  O: {
    truncate: "tO",
    rectify: "aC",
    expand: "eC",
    snub: { value: "sC", chiral: true },
  },
  tT: { expand: "tO" },
  tC: { expand: "bC" },
  tO: { expand: "bC" },
  tD: { expand: "bD" },
  tI: { expand: "bD" },
  aC: {
    // TODO (possibly) coxeter snub (semi-snub) and rectify relations
    truncate: "bC",
    twist: "I",
  },
  eC: {
    twist: { value: "sC", chiral: true },
  },
  D: {
    dual: "I",
    truncate: "tD",
    rectify: "aD",
    expand: "eD",
    snub: { value: "sD", chiral: true },
  },
  I: {
    truncate: "tI",
    rectify: "aD",
    expand: "eD",
    snub: { value: "sD", chiral: true },
  },
  aD: {
    truncate: "bD",
  },
  eD: {
    twist: { value: "sD", chiral: true },
  },
}

const baseCapstones = (() => {
  let graph: Graph = {}
  // relation of prisms and antiprisms
  for (const [name, row] of Object.entries(prismMap)) {
    const { prism, antiprism } = row
    const hasRotunda = name.startsWith("decagonal")
    const capstoneRow = getCapstoneFromPrism(name)
    const { elongated, gyroelongated } = capstoneMap[capstoneRow]
    const rotundaRow = capstoneMap["pentagonal rotunda"]
    const using = getCapstoneConway(capstoneRow)
    graph = graphMerge(graph, {
      [prism]: {
        augment: [
          { value: elongated, using },
          hasRotunda && { value: rotundaRow.elongated, using: "R5" },
        ],
        turn: antiprism,
      },
      [antiprism]: {
        augment: [
          { value: gyroelongated, using },
          hasRotunda && { value: rotundaRow.gyroelongated, using: "R5" },
        ],
      },
    })
  }
  // for diminished icosahedra
  graph["A5"]["augment"][0].align = "para"

  for (const [name, row] of Object.entries(capstoneMap)) {
    const {
      "--": base,
      elongated,
      gyroelongated,
      "bi-": bi,
      "elongated bi-": elongatedBi,
      "gyroelongated bi-": gyroelongatedBi,
    } = row
    const conway = getCapstoneConway(name)
    const augmentations = getAugmentations(conway)
    graph = graphMerge(graph, {
      [base]: {
        ...elongations(elongated, gyroelongated),
        augment: augmentations(name, "bi-"),
      },
      [elongated]: {
        augment: augmentations(name, "elongated bi-"),
        turn: gyroelongated,
      },
      [gyroelongated]: {
        augment: augmentations(name, "gyroelongated bi-"),
      },
      [gyroelongatedBi]: {
        gyrate: bi instanceof Array ? { value: gyroelongatedBi } : null,
      },
    })

    if (!(bi instanceof Array)) {
      graph = graphMerge(graph, {
        [bi]: elongations(elongatedBi, gyroelongatedBi),
        [elongatedBi]: {
          turn: gyroelongatedBi,
        },
      })
    } else {
      const [ortho, gyro] = bi
      const [elongBiOrtho, elongBiGyro] = elongatedBi
      graph = graphMerge(graph, {
        [ortho]: elongations(elongBiOrtho, gyroelongatedBi, "ortho", true),
        [gyro]: elongations(elongBiGyro, gyroelongatedBi, "gyro", true),
        [elongBiOrtho]: {
          turn: { value: gyroelongatedBi, gyrate: "ortho", chiral: true },
        },
        [elongBiGyro]: {
          turn: { value: gyroelongatedBi, gyrate: "gyro", chiral: true },
        },
      })
    }

    // gyrate relationships
    for (const cell of Object.values(row)) {
      if (cell instanceof Array) {
        const [ortho, gyro] = cell
        graph = graphMerge(graph, {
          [ortho]: {
            gyrate: gyro,
          },
        })
      }
    }
  }

  return graph
})()

const getAugmentee = (name: string) => {
  if (name.includes("prism")) return "Y4"
  if (name === "dodecahedron") return "Y5"
  const type = name.split(" ")[1]
  switch (type) {
    case "tetrahedron":
      return "U3"
    case "cube":
      return "U4"
    case "dodecahedron":
      return "U5"
    default:
      return null
  }
}

const getBiAugmented = (biaugmented: TableData, using: string) => {
  if (biaugmented instanceof Array) {
    return [
      { using, value: biaugmented[0], align: "para" },
      { using, value: biaugmented[1], align: "meta" },
    ]
  }
  return [{ using, value: biaugmented }]
}

const baseAugmentations = (() => {
  let graph = {}
  for (const [name, row] of Object.entries(augmentationMap)) {
    const base = toConwayNotation(name)
    const { augmented, biaugmented, triaugmented } = row
    const augmentee = getAugmentee(name)
    graph = graphMerge(graph, {
      [base]: {
        augment: { using: augmentee, value: augmented },
      },
      [augmented]: {
        augment: getBiAugmented(biaugmented, augmentee!),
      },
      [biaugmented instanceof Array ? biaugmented[1] : biaugmented]: {
        augment: { using: augmentee, value: triaugmented },
      },
    })
  }
  return graph
})()

const diminishedIcosahedra = (() => {
  return {
    J63: {
      augment: [
        { using: "Y3", value: "J64" },
        { using: "Y5", value: "J62" },
      ],
    },
    J62: {
      augment: { using: "Y5", align: "meta", value: "J11" },
    },
  }
})()

const rhombicosidodecahedra = (() => {
  const getAugment = (relations: Relation[]) =>
    relations.map(relation => ({ ...relation, using: "U5" }))
  const getGyrate = (relations: Relation[]) =>
    relations.map(relation => ({ ...relation, direction: "forward" }))
  return {
    // tridiminished
    J83: {
      augment: getAugment([
        { value: "J81", gyrate: "gyro" },
        { value: "J82", gyrate: "ortho" },
      ]),
    },
    // bidiminished
    J81: {
      augment: getAugment([
        { value: "J76", gyrate: "gyro", align: "meta" },
        { value: "J78", gyrate: "ortho" },
      ]),
      gyrate: getGyrate([{ value: "J82" }]),
    },
    J82: {
      augment: getAugment([
        { value: "J78", gyrate: "gyro" },
        { value: "J79", gyrate: "ortho" },
      ]),
    },
    J80: {
      augment: getAugment([
        { value: "J76", gyrate: "gyro", align: "para" },
        { value: "J77", gyrate: "ortho" },
      ]),
    },
    // diminished
    J76: {
      augment: getAugment([
        { value: "eD", gyrate: "gyro" },
        { value: "J72", gyrate: "ortho" },
      ]),
      gyrate: getGyrate([
        { value: "J77", align: "para" },
        { value: "J78", align: "meta" },
      ]),
    },
    J77: {
      augment: getAugment([
        { value: "J72", gyrate: "gyro", align: "para" },
        { value: "J73", gyrate: "ortho" },
      ]),
    },
    J78: {
      augment: getAugment([
        { value: "J72", gyrate: "gyro", align: "meta" },
        { value: "J74", gyrate: "ortho" },
      ]),
      gyrate: getGyrate([{ value: "J79" }]),
    },
    J79: {
      augment: getAugment([
        { value: "J74", gyrate: "gyro" },
        { value: "J75", gyrate: "ortho" },
      ]),
    },

    // gyrate
    eD: {
      gyrate: getGyrate([{ value: "J72" }]),
    },
    J72: {
      gyrate: getGyrate([
        { value: "J73", align: "para" },
        { value: "J74", align: "meta" },
      ]),
    },
    J74: {
      gyrate: getGyrate([{ value: "J75" }]),
    },
  }
})()

const elementary = (() => {
  const empty = mapObject(range(87, 93), j => [`J${j}`, {}])
  return {
    ...empty,
    // TODO semisnub to create snub antiprisms
    // snub antiprisms
    // T: {
    //   snub: 'J84',
    // },
    // A4: {
    //   snub: 'J85',
    // },
    J84: {},
    J85: {},

    // other johnson solids
    J86: {
      augment: { using: "Y4", value: "J87" },
    },
  }
})()

const normalized = [
  archimedean,
  baseCapstones,
  baseAugmentations,
  diminishedIcosahedra,
  rhombicosidodecahedra,
  elementary,
]
  .map(normalize)
  .map(compactGraph)

export default makeBidirectional(graphMergeAll(...normalized)) as FullGraph
