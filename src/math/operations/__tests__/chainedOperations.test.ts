import { Facet } from "data/specs/Classical"
import { Polyhedron } from "math/polyhedra"
import { OpName, operations } from "math/operations"
import { validateOperationApplication } from "../operationTestUtils"
import { getGeometry } from "math/operations/operationUtils"
import { getSpecs2 } from "data/specs/getSpecs"
import createForme from "math/formes/createForme"

interface Args {
  face?: number
  facet?: Facet
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
    return { ...args, cap: polyhedron.caps()[0] }
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

// FIXME these often rely on changing the specs,
// so I don't know how they're going to exist next.
// Probably need to have a "change specs" function
xdescribe("chained tests", () => {
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
        { op: "sharpen", args: { facet: "vertex" }, expected: "icosahedron" },
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
          args: { cap: true },
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
          args: { cap: true },
          expected: "metabiaugmented truncated dodecahedron",
        },
        ["sharpen", "metabiaugmented dodecahedron"],
      ],
    },
  ]

  for (const test of tests) {
    const { start, description, operations } = test
    const specs = getSpecs2(start)
    let polyhedron = createForme(specs, getGeometry(specs))
    it(description, () => {
      operations.forEach((opInfo) => {
        const { op, args, expected } = getOpInfo(opInfo, polyhedron.geom)

        expect(polyhedron).toSatisfy((p) => op.canApplyTo(p))
        const result = validateOperationApplication(op, polyhedron, args)

        polyhedron = result.result
        expect(polyhedron.geom.name).toEqual(expected)
      })
    })
  }
})
