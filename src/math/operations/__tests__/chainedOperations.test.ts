import { FacetType } from "specs"
import { getSpecs } from "specs"
import { Polyhedron } from "math/polyhedra"
import { OpName, operations } from "math/operations"
import { getGeometry } from "math/operations/operationUtils"
import createForme from "math/formes/createForme"
import { validateOperationApplication } from "../operationTestUtils"
import PolyhedronForme from "math/formes/PolyhedronForme"

interface Args {
  face?: number
  facet?: FacetType
  cap?: "primary" | "secondary"
}

type ChainedOpName = OpName | "forme"
type OpInfoArray = [ChainedOpName, string]

interface OpInfoObject {
  op: ChainedOpName
  args: Args
  expected: string
}

type OpInfo = OpInfoArray | OpInfoObject

// Translate the test argument into an operation argument
function getArgs(args: Args, polyhedron: Polyhedron) {
  if (args.face) {
    return { ...args, face: polyhedron.faceWithNumSides(args.face) }
  }
  if (args.cap) {
    // TODO support cupolae
    return { ...args, cap: polyhedron.caps({ type: args.cap })[0] }
  }
  return args
}

function getOpInfo(opInfo: OpInfo, polyhedron: Polyhedron) {
  if (Array.isArray(opInfo)) {
    const [op, expected] = opInfo
    return { op, expected }
  }
  const { op, args, expected } = opInfo
  return {
    op,
    expected,
    args: getArgs(args, polyhedron),
  }
}

interface OpTest {
  description: string
  start: string
  operations: OpInfo[]
}

const chainedTests: OpTest[] = [
  {
    description: "pyramid operations",
    start: "square pyramid",
    operations: [
      { op: "augment", args: { face: 4 }, expected: "square bipyramid" },
      { op: "diminish", args: { cap: "primary" }, expected: "square pyramid" },
      ["elongate", "elongated square pyramid"],
    ],
  },
  {
    description: "combining twist and turn operations",
    start: "elongated pentagonal bipyramid",
    operations: [
      ["turn", "gyroelongated pentagonal bipyramid"],
      ["forme", "snub tetratetrahedron"],
      ["twist", "rhombitetratetrahedron"],
      ["twist", "snub tetratetrahedron"],
      ["forme", "gyroelongated pentagonal bipyramid"],
      ["turn", "elongated pentagonal bipyramid"],
    ],
  },
  {
    description: "augmenting and contracting icosahedron",
    start: "gyroelongated pentagonal pyramid",
    operations: [
      {
        op: "augment",
        args: { face: 5 },
        expected: "gyroelongated pentagonal bipyramid",
      },
      ["forme", "snub tetratetrahedron"],
      ["contract", "tetrahedron"],
    ],
  },
  {
    description: "rhombicuboctahedron expansion/contraction",
    start: "cube",
    operations: [
      ["expand", "rhombicuboctahedron"],
      { op: "contract", args: { facet: "face" }, expected: "cube" },
      ["expand", "rhombicuboctahedron"],
      { op: "contract", args: { facet: "vertex" }, expected: "octahedron" },
    ],
  },
  {
    description: "dodecahedron -> rectify -> unrectify -> contract",
    start: "dodecahedron",
    operations: [
      ["rectify", "icosidodecahedron"],
      { op: "sharpen", args: { facet: "vertex" }, expected: "icosahedron" },
      ["forme", "snub tetratetrahedron"],
      ["contract", "tetrahedron"],
    ],
  },
  {
    description: "truncation and rectification",
    start: "tetrahedron",
    operations: [
      ["truncate", "truncated tetrahedron"],
      ["sharpen", "tetrahedron"],
      ["rectify", "tetratetrahedron"],
      ["rectify", "rhombitetratetrahedron"],
      ["forme", "cuboctahedron"],
      ["truncate", "truncated cuboctahedron"],
      ["sharpen", "cuboctahedron"],
      { op: "sharpen", args: { facet: "face" }, expected: "cube" },
      ["truncate", "truncated cube"],
      {
        op: "augment",
        args: { face: 8 },
        expected: "augmented truncated cube",
      },
    ],
  },
  {
    description: "dodecahedron -> expand -> diminish",
    start: "dodecahedron",
    operations: [
      ["expand", "rhombicosidodecahedron"],
      {
        op: "diminish",
        args: { cap: "secondary" },
        expected: "diminished rhombicosidodecahedron",
      },
    ],
  },
  {
    // Make sure the Pose is fine in a chained operation
    description: "truncating/sharpening augmented classicals",
    start: "triaugmented truncated dodecahedron",
    operations: [
      {
        op: "diminish",
        args: { cap: "secondary" },
        expected: "metabiaugmented truncated dodecahedron",
      },
      ["sharpen", "metabiaugmented dodecahedron"],
    ],
  },
  {
    description: "Augmented prisms",
    start: "elongated pentagonal bipyramid",
    operations: [
      {
        op: "diminish",
        args: { cap: "primary" },
        expected: "elongated pentagonal pyramid",
      },
      {
        op: "diminish",
        args: { cap: "primary" },
        expected: "pentagonal prism",
      },
      {
        op: "augment",
        args: { face: 4 },
        expected: "augmented pentagonal prism",
      },
    ],
  },
]

function doOperationStep(opInfo: OpInfo, polyhedron: PolyhedronForme) {
  const { op, args, expected } = getOpInfo(opInfo, polyhedron.geom)
  if (op === "forme") {
    const nextSpecs = getSpecs(expected)
    expect(polyhedron.specs.canonicalName()).toEqual(nextSpecs.canonicalName())
    return createForme(nextSpecs, polyhedron.geom)
  }
  const operation = operations[op]
  expect(polyhedron).toSatisfy((p) => operation.canApplyTo(p))
  const { result } = validateOperationApplication(operation, polyhedron, args)

  expect(result.specs.name()).toEqual(expected)
  return result
}

describe("chained operations", () => {
  for (const test of chainedTests) {
    const { start, description, operations } = test
    const specs = getSpecs(start)
    let polyhedron = createForme(specs, getGeometry(specs))
    it(description, () => {
      for (const opInfo of operations) {
        polyhedron = doOperationStep(opInfo, polyhedron)
      }
    })
  }
})
