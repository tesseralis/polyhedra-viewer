import { once, countBy, isEqual } from "lodash-es"

import { flatMapUniq, find } from "utils"
import { CapType } from "specs"
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

interface Constructor<T> {
  new (arg: T): Cap
}
function createMapper<T>(mapper: (p: Polyhedron) => T[], Base: Constructor<T>) {
  return (polyhedron: Polyhedron) => {
    const values: T[] = mapper(polyhedron)
    return values.map((arg) => new Base(arg)).filter((cap) => cap.isValid())
  }
}

export default abstract class Cap extends Facet {
  type: CapType
  private _innerVertices: Vertex[]
  private faceConfiguration: FaceConfiguration

  static getAll(polyhedron: Polyhedron): Cap[] {
    const pyramids = Pyramid.getAll(polyhedron)
    if (pyramids.length > 0) return pyramids

    const fastigium = Fastigium.getAll(polyhedron)
    if (fastigium.length > 0) return fastigium

    const cupolaRotunda = Cupola.getAll(polyhedron).concat(
      Rotunda.getAll(polyhedron),
    )
    if (cupolaRotunda.length > 0) return cupolaRotunda
    return []
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

  allVertices = once(() => {
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

  normal() {
    return this.boundary().normal()
  }

  isValid() {
    const matchFaces = this.innerVertices().every((vertex) => {
      const faceCount = countBy(vertex.adjacentFaces(), "numSides")
      return isEqual(faceCount, this.faceConfiguration)
    })
    return (
      matchFaces &&
      this.faces().every((face) => face.isValid()) &&
      this.boundary().isPlanar()
    )
  }
}

class Pyramid extends Cap {
  constructor(vertex: Vertex) {
    super([vertex], "pyramid", {
      "3": vertex.adjacentEdges().length,
    })
  }
  static getAll = createMapper((p) => p.vertices, Pyramid)
}

class Fastigium extends Cap {
  constructor(edge: Edge) {
    const config = { "3": 1, "4": 2 }
    super(edge.vertices, "cupola", config)
  }
  static getAll = createMapper((p) => p.edges, Fastigium)
}

class Cupola extends Cap {
  constructor(face: Face) {
    super(face.vertices, "cupola", countBy([3, 4, 4, face.numSides]))
  }
  static getAll = createMapper((p) => p.faces, Cupola)
}

class Rotunda extends Cap {
  constructor(face: Face) {
    super(
      flatMapUniq(face.vertices, (v) => v.adjacentVertices(), "index"),
      "rotunda",
      { "5": 2, "3": 2 },
    )
  }
  static getAll = createMapper((p) => p.faces, Rotunda)
}
