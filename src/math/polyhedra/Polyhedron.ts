import _ from 'lodash';

import { find } from 'utils';
import { isValidSolid, getSolidData } from 'data';
import { Vec3D, getCentroid } from 'math/geom';

import * as meta from './names';
import * as symmetry from './symmetry';
import { SolidData } from './solidTypes';
import Face from './Face';
import Vertex from './Vertex';
import Edge from './Edge';
import Builder from './SolidBuilder';
import { VertexArg } from './SolidBuilder';

function calculateEdges(faces: Face[]) {
  return _(faces)
    .flatMap(face => face.edges.map(e => e.undirected()))
    .uniqWith((e1, e2) => e1.equals(e2))
    .value();
}

export default class Polyhedron {
  _solidData: SolidData;
  name: string;
  faces: Face[];
  vertices: Vertex[];
  private _edges?: Edge[];

  static get(name: string) {
    if (!isValidSolid(name)) {
      throw new Error(`Invalid solid name: ${name}`);
    }
    return new Polyhedron(getSolidData(name));
  }

  constructor(solidData: SolidData) {
    this._solidData = solidData;
    this.vertices = solidData.vertices.map(
      (vertex, vIndex) => new Vertex(this, vIndex),
    );
    this.faces = solidData.faces.map((face, fIndex) => new Face(this, fIndex));
    this.name = solidData.name || '';
  }

  get edges() {
    if (!this._edges) {
      this._edges = calculateEdges(this.faces);
    }
    return this._edges;
  }

  get solidData() {
    if (!this._solidData.edges) {
      this._solidData.edges = _.map(this.edges, e => e.value);
    }
    return this._solidData;
  }

  toString() {
    return `Polyhedron { V=${this.numVertices()}, E=${this.numEdges()}, F=${this.numFaces()} }`;
  }

  toJSON() {
    return this.solidData;
  }

  // Memoized mapping of edges to faces, used for quickly finding adjacency
  edgeToFaceGraph = _.once(() => {
    const edgesToFaces: NestedRecord<number, number, Face> = {};
    _.forEach(this.faces, face => {
      _.forEach(face.edges, ({ v1, v2 }) => {
        _.set(edgesToFaces, [v1.index, v2.index], face);
      });
    });
    return edgesToFaces;
  });

  // Simple properties
  // =================

  numVertices() {
    return this.vertices.length;
  }

  numFaces() {
    return this.faces.length;
  }

  numEdges() {
    return this.edges.length;
  }

  numFacesBySides() {
    return _.countBy(this.faces, 'numSides');
  }

  // Search functions
  // ================

  getVertex() {
    return this.vertices[0];
  }

  getFace() {
    return this.faces[0];
  }

  getEdge() {
    return this.edges[0];
  }

  largestFace() {
    return _.maxBy(this.faces, 'numSides')!;
  }

  smallestFace() {
    return _.minBy(this.faces, 'numSides')!;
  }

  faceWithNumSides(n: number) {
    return find(this.faces, { numSides: n });
  }

  // The list of the type of faces this polyhedron has, ordered
  faceTypes() {
    return _(this.faces)
      .map('numSides')
      .uniq()
      .sortBy()
      .value();
  }

  vertexConfiguration() {
    return _.countBy(this.vertices.map(v => v.configuration()), config =>
      config.join('.'),
    );
  }

  // Geometric properties
  // ====================

  // Get the edge length of this polyhedron, assuming equal edges
  edgeLength() {
    return this.getFace().sideLength();
  }

  centroid() {
    return getCentroid(_.map(this.vertices, 'vec'));
  }

  surfaceArea() {
    return _(this.faces)
      .map(face => face.area())
      .sum();
  }

  normalizedSurfaceArea() {
    return this.surfaceArea() / this.edgeLength() ** 2;
  }

  volume() {
    return _(this.faces)
      .map(face => (face.area() * face.distanceToCenter()) / 3)
      .sum();
  }

  normalizedVolume() {
    return this.volume() / this.edgeLength() ** 3;
  }

  sphericity() {
    const v = this.volume();
    const a = this.surfaceArea();
    return (Math.PI ** (1 / 3) * (6 * v) ** (2 / 3)) / a;
  }

  /** Get the face that is closest to the given point. */
  hitFace(point: Vec3D) {
    return _.minBy(this.faces, face => face.plane().getDistanceToPoint(point))!;
  }

  // Mutations
  // =========

  withChanges(changes: (b: Builder) => Builder) {
    return changes(new Builder(this)).build();
  }

  withName(name: string) {
    return new Polyhedron({ ...this.solidData, name });
  }

  // return a new polyhedron with the given vertices
  withVertices(vertices: VertexArg[]) {
    return this.withChanges(s => s.withVertices(vertices));
  }

  /** Center the polyhedron on its centroid. */
  center() {
    const centroid = this.centroid();
    return this.withVertices(this.vertices.map(v => v.vec.sub(centroid)));
  }

  normalizeToVolume(volume: number) {
    const scale = Math.cbrt(volume / this.volume());
    return this.withVertices(this.vertices.map(v => v.vec.scale(scale)));
  }

  // Meta Properties
  // ===============
  //
  // The following properties rely on the name of the polyhedron.

  type = () => meta.getType(this.name);

  alternateNames = () => meta.getAlternateNames(this.name);

  symbol = () => meta.toConwayNotation(this.name);

  symmetry = _.once(() => symmetry.getSymmetry(this.name));

  symmetryName = _.once(() => symmetry.getSymmetryName(this.symmetry()));

  order = () => symmetry.getOrder(this.name);

  isUniform() {
    return _.includes(
      ['Platonic solid', 'Archimedean solid', 'Prism', 'Antiprism'],
      this.type(),
    );
  }

  isQuasiRegular() {
    return _.includes(
      ['octahedron', 'cuboctahedron', 'icosidodecahedron'],
      this.name,
    );
  }

  isRegular() {
    return this.type() === 'Platonic solid';
  }

  faceAdjacencyList() {
    const faceAdjacencyCounts = _.map(this.faces, face => ({
      n: face.numSides,
      adj: face.adjacentFaceCounts(),
    }));
    return _.sortBy(
      faceAdjacencyCounts,
      ['n', 'adj.length'].concat([3, 4, 5, 6, 8, 10].map(n => `adj[${n}]`)),
    );
  }

  isSame(other: Polyhedron) {
    return _.isEqual(this.faceAdjacencyList(), other.faceAdjacencyList());
  }
}
