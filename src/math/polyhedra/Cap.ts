import { once, countBy, isEqual } from "lodash-es"

import { flatMapUniq, find } from "utils"
import { CapType, PolygonType, PrimaryPolygon } from "specs"
import Facet from "./Facet"
import type Polyhedron from "./Polyhedron"
import type Face from "./Face"
import type Vertex from "./Vertex"
import type Edge from "./Edge"
import FaceLike from "./FaceLike"

type FaceConfiguration = { [key: string]: number }

// Find the boundary of a connected set of faces
function getBoundary(faces: Face[]) {
  const e0 = find(
    faces.flatMap((f) => f.edges),
    (e) => !e.twin().face.inSet(faces),
  )!

  const result: Edge[] = []
  let e = e0
  let count = 0
  do {
    if (count++ > 20) throw new Error("we done goofed")
    if (!e.twin().face.inSet(faces)) {
      result.push(e)
      const nextTwin = e.next().twin()
      if (nextTwin.face.inSet(faces)) {
        e = nextTwin.next()
      } else {
        e = e.next()
      }
    } else {
      e = e.twin().next()
    }
  } while (!e.equals(e0))
  return new FaceLike(
    result.map((e) => e.v1),
    result,
  )
}

type CapBase = 2 | PrimaryPolygon

interface Constructor<T> {
  new (facet: T, base: CapBase): Cap
}
function createMapper<T>(
  mapper: (p: Polyhedron, base: CapBase) => T[],
  Base: Constructor<T>,
) {
  return function* (polyhedron: Polyhedron, opts: CapSearchOpts) {
    for (const value of mapper(polyhedron, opts.base)) {
      const cap = new Base(value, opts.base)
      if (cap.isValid()) {
        yield cap
      }
    }
  }
}

export interface CapSearchOpts {
  base: CapBase
  type: PolygonType
  rotunda?: boolean
  fastigium?: boolean
}

export default abstract class Cap extends Facet {
  type: CapType
  private _innerVertices: Vertex[]
  private faceConfiguration: FaceConfiguration

  static *getAll(polyhedron: Polyhedron, opts: CapSearchOpts) {
    if (opts.type === "primary") {
      yield* Pyramid.getAll(polyhedron, opts)
    } else if (opts.fastigium) {
      yield* Fastigium.getAll(polyhedron, opts)
    } else {
      yield* Cupola.getAll(polyhedron, opts)
      if (opts.rotunda) {
        yield* Rotunda.getAll(polyhedron, opts)
      }
    }
  }

  constructor(
    innerVertices: Vertex[],
    type: CapType,
    faceConfiguration: FaceConfiguration,
  ) {
    super(innerVertices[0].polyhedron)
    this._innerVertices = innerVertices
    this.type = type
    this.faceConfiguration = faceConfiguration
  }

  innerVertices() {
    return this._innerVertices
  }

  get vertices() {
    return this.allVertices()
  }

  private allVertices = once(() => {
    return this.innerVertices().concat(this.boundary().vertices)
  })

  faces = once(() => {
    return flatMapUniq(this.innerVertices(), (v) => v.adjacentFaces(), "index")
  })

  boundary = once(() => {
    return getBoundary(this.faces())
  })

  // NOTE for convenience, this calculates the centroid of the *boundary* not of all the vertices
  centroid = () => this.boundary().centroid()

  normal = () => this.boundary().normal()

  adjacentFaces = () => this.boundary().adjacentFaces()

  isValid() {
    return this.innerVertices().every((vertex) => {
      const faceCount = countBy(vertex.adjacentFaces(), "numSides")
      return isEqual(faceCount, this.faceConfiguration)
    })
  }
}

class Pyramid extends Cap {
  constructor(vertex: Vertex, base: CapBase) {
    super([vertex], "pyramid", {
      "3": base,
    })
  }
  static getAll = createMapper(
    (p, base) => p.vertices.filter((v) => v.adjacentFaces().length === base),
    Pyramid,
  )
}

class Fastigium extends Cap {
  constructor(edge: Edge, base: CapBase) {
    super(edge.vertices, "cupola", { "3": 1, "4": 2 })
  }
  static getAll = createMapper(
    (p, base) =>
      p.edges.filter((e) => e.adjacentFaces().every((f) => f.numSides === 4)),
    Fastigium,
  )
}

class Cupola extends Cap {
  constructor(face: Face, base: CapBase) {
    super(face.vertices, "cupola", countBy([3, 4, 4, base]))
  }
  static getAll = createMapper(
    (p, base) =>
      p
        .facesWithNumSides(base)
        .filter((f) => f.adjacentFaces().every((f2) => f2.numSides === 4)),
    Cupola,
  )
}

class Rotunda extends Cap {
  constructor(face: Face, base: CapBase) {
    super(
      flatMapUniq(face.vertices, (v) => v.adjacentVertices(), "index"),
      "rotunda",
      { "5": 2, "3": 2 },
    )
  }
  static getAll = createMapper((p, base) => p.facesWithNumSides(base), Rotunda)
}
