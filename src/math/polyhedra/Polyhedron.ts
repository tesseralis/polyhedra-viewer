import {
  once,
  set,
  countBy,
  maxBy,
  minBy,
  sortBy,
  sum,
  isEqual,
} from "lodash-es"

import { isValidSolid, getSolidData } from "data"
import { Vec3D, getCentroid } from "math/geom"

import * as meta from "../../data/names"
import * as symmetry from "../../data/symmetry"
import { SolidData } from "./solidTypes"
import Face from "./Face"
import Vertex from "./Vertex"
import Edge from "./Edge"
import Builder from "./SolidBuilder"
import { VertexArg, FaceArg } from "./SolidBuilder"

function calculateEdges(faces: Face[]) {
  return faces.flatMap(face => face.edges).filter(e => e.v1.index < e.v2.index)
}

export default class Polyhedron {
  _solidData: SolidData
  name: string
  faces: Face[]
  vertices: Vertex[]
  private _edges?: Edge[]

  static get(name: string) {
    if (!isValidSolid(name)) {
      throw new Error(`Invalid solid name: ${name}`)
    }
    return new Polyhedron(getSolidData(name))
  }

  constructor(solidData: SolidData) {
    this._solidData = solidData
    this.vertices = solidData.vertices.map(
      (vertex, vIndex) => new Vertex(this, vIndex),
    )
    this.faces = solidData.faces.map((face, fIndex) => new Face(this, fIndex))
    this.name = solidData.name ?? ""
  }

  get edges() {
    if (!this._edges) {
      this._edges = calculateEdges(this.faces)
    }
    return this._edges
  }

  get solidData() {
    if (!this._solidData.edges) {
      this._solidData.edges = this.edges.map(e => e.value)
    }
    return this._solidData
  }

  toString() {
    return `Polyhedron { V=${this.numVertices()}, E=${this.numEdges()}, F=${this.numFaces()} }`
  }

  toJSON() {
    return this.solidData
  }

  // Memoized mapping of edges to faces, used for quickly finding adjacency
  edgeToFaceGraph = once(() => {
    const edgesToFaces: NestedRecord<number, number, Face> = {}
    for (const face of this.faces) {
      for (const { v1, v2 } of face.edges) {
        set(edgesToFaces, [v1.index, v2.index], face)
      }
    }
    return edgesToFaces
  })

  // Simple properties
  // =================

  numVertices() {
    return this.vertices.length
  }

  numFaces() {
    return this.faces.length
  }

  numEdges() {
    return this.edges.length
  }

  numFacesBySides() {
    return countBy(this.faces, "numSides")
  }

  // Search functions
  // ================

  getVertex() {
    return this.vertices[0]
  }

  getFace() {
    return this.faces[0]
  }

  getEdge() {
    return this.edges[0]
  }

  largestFace() {
    return maxBy(this.faces, "numSides")!
  }

  smallestFace() {
    return minBy(this.faces, "numSides")!
  }

  faceWithNumSides(n: number) {
    const face = this.faces.find(f => f.numSides === n)
    if (!face) throw new Error(`No face of ${n} sides exists`)
    return face
  }

  // The list of the type of faces this polyhedron has, ordered
  faceTypes() {
    return sortBy(Object.keys(this.numFacesBySides()))
  }

  vertexConfiguration() {
    return countBy(
      this.vertices.map(v => v.configuration()),
      config => config.join("."),
    )
  }

  // Geometric properties
  // ====================

  // Get the edge length of this polyhedron, assuming equal edges
  edgeLength() {
    return this.getFace().sideLength()
  }

  centroid() {
    return getCentroid(this.vertices.map(v => v.vec))
  }

  surfaceArea() {
    return sum(this.faces.map(face => face.area()))
  }

  normalizedSurfaceArea() {
    return this.surfaceArea() / this.edgeLength() ** 2
  }

  volume() {
    return sum(
      this.faces.map(face => (face.area() * face.distanceToCenter()) / 3),
    )
  }

  normalizedVolume() {
    return this.volume() / this.edgeLength() ** 3
  }

  sphericity() {
    const v = this.volume()
    const a = this.surfaceArea()
    return (Math.PI ** (1 / 3) * (6 * v) ** (2 / 3)) / a
  }

  /** Get the face that is closest to the given point. */
  hitFace(point: Vec3D) {
    return minBy(this.faces, face => face.plane().getDistanceToPoint(point))!
  }

  // Mutations
  // =========

  withChanges(changes: (b: Builder) => Builder) {
    return changes(new Builder(this)).build()
  }

  withName(name: string) {
    return new Polyhedron({ ...this.solidData, name })
  }

  // TODO support all the solid builder functions
  // return a new polyhedron with the given vertices
  withVertices(vertices: VertexArg[]) {
    return this.withChanges(s => s.withVertices(vertices))
  }

  withFaces(faces: FaceArg[]) {
    return this.withChanges(s => s.withFaces(faces))
  }

  withoutFaces(faces: Face[]) {
    return this.withChanges(s => s.withoutFaces(faces))
  }

  addPolyhedron(other: Polyhedron) {
    return this.withChanges(s => s.addPolyhedron(other))
  }

  /** Center the polyhedron on its centroid. */
  center() {
    const centroid = this.centroid()
    return this.withVertices(this.vertices.map(v => v.vec.sub(centroid)))
  }

  normalizeToVolume(volume: number) {
    const scale = Math.cbrt(volume / this.volume())
    return this.withVertices(this.vertices.map(v => v.vec.scale(scale)))
  }

  // Meta Properties
  // ===============
  //
  // The following properties rely on the name of the polyhedron.

  type = () => meta.getType(this.name)

  alternateNames = () => meta.getAlternateNames(this.name)

  symbol = () => meta.toConwayNotation(this.name)

  symmetry = once(() => symmetry.getSymmetry(this.name))

  symmetryName = once(() => symmetry.getSymmetryName(this.symmetry()))

  order = () => symmetry.getOrder(this.name)

  isUniform() {
    return [
      "Platonic solid",
      "Archimedean solid",
      "Prism",
      "Antiprism",
    ].includes(this.type())
  }

  isQuasiRegular() {
    return ["octahedron", "cuboctahedron", "icosidodecahedron"].includes(
      this.name,
    )
  }

  isRegular() {
    return this.type() === "Platonic solid"
  }

  isChiral() {
    return [
      "snub cube",
      "snub dodecahedron",
      "gyroelongated triangular bicupola",
      "gyroelongated square bicupola",
      "gyroelongated pentagonal bicupola",
      "gyroelongated pentagonal cupolarotunda",
      "gyroelongated pentagonal birotunda",
    ].includes(this.name)
  }

  isHoneycomb() {
    return [
      "cube",
      "truncated octahedron",
      "triangular prism",
      "hexagonal prism",
      "gyrobifastigium",
    ].includes(this.name)
  }

  isDeltahedron() {
    const facesBySides = Object.keys(this.numFacesBySides())
    return facesBySides.length === 1 && +facesBySides[0] === 3
  }

  faceAdjacencyList() {
    const faceAdjacencyCounts = this.faces.map(face => ({
      n: face.numSides,
      adj: face.adjacentFaceCounts(),
    }))
    return sortBy(
      faceAdjacencyCounts,
      ["n", "adj.length"].concat([3, 4, 5, 6, 8, 10].map(n => `adj[${n}]`)),
    )
  }

  isSame(other: Polyhedron) {
    return isEqual(this.faceAdjacencyList(), other.faceAdjacencyList())
  }
}
