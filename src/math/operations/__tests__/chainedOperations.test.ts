import { Polyhedron, Cap } from "math/polyhedra"
import { OpName, operations } from "math/operations"
import {
  expectValidPolyhedron,
  expectValidAnimationData,
} from "../operationTestUtils"

interface Args {
  face?: number
  facet?: "vertex" | "face"
  cap?: boolean
}

type OpInfoArray = [OpName, string]

interface OpInfoObject {
  op: OpName
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
    return { ...args, cap: Cap.getAll(polyhedron)[0] }
  }
  return args
}

function getOpInfo(opInfo: OpInfo, polyhedron: Polyhedron) {
  if (Array.isArray(opInfo)) {
    return { op: operations[opInfo[0]], expected: opInfo[1] }
  }
  const { op, args, expected } = opInfo
  return {
    op: operations[op],
    expected,
    args: getArgs(args, polyhedron),
  }
}

interface OpTest {
  description: string
  start: string
  operations: OpInfo[]
}

describe("chained tests", () => {
  const tests: OpTest[] = [
    {
      description: "pyramid operations",
      start: "square pyramid",
      operations: [
        { op: "augment", args: { face: 4 }, expected: "octahedron" },
        { op: "diminish", args: { cap: true }, expected: "square pyramid" },
        ["elongate", "elongated square pyramid"],
      ],
    },
    {
      description: "combining twist and turn operations",
      start: "elongated pentagonal bipyramid",
      operations: [
        ["turn", "icosahedron"],
        ["twist", "cuboctahedron"],
        ["twist", "icosahedron"],
        ["turn", "elongated pentagonal bipyramid"],
      ],
    },
    {
      description: "augmenting and contracting icosahedron",
      start: "gyroelongated pentagonal pyramid",
      operations: [
        { op: "augment", args: { face: 5 }, expected: "icosahedron" },
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
        { op: "unrectify", args: { facet: "vertex" }, expected: "icosahedron" },
        ["contract", "tetrahedron"],
      ],
    },
    {
      description: "truncation and rectification",
      start: "tetrahedron",
      operations: [
        ["truncate", "truncated tetrahedron"],
        ["sharpen", "tetrahedron"],
        ["rectify", "octahedron"],
        ["rectify", "cuboctahedron"],
        ["truncate", "truncated cuboctahedron"],
        ["sharpen", "cuboctahedron"],
        { op: "unrectify", args: { facet: "face" }, expected: "cube" },
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
          args: { cap: true },
          expected: "diminished rhombicosidodecahedron",
        },
      ],
    },
  ]

  for (const test of tests) {
    const { start, description, operations } = test
    let polyhedron = Polyhedron.get(start)
    it(description, () => {
      operations.forEach((opInfo) => {
        const { op, args, expected } = getOpInfo(opInfo, polyhedron)

        expect(op.canApplyTo(polyhedron)).toBeTruthy()
        const result = op.apply(polyhedron, args as any)
        expectValidPolyhedron(result)
        expectValidAnimationData(result, polyhedron, op.name)

        polyhedron = result.result
        expect(polyhedron.name).toBe(expected)
      })
    })
  }
})
