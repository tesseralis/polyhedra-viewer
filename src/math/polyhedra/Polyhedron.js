// @flow strict
import _ from 'lodash';

import { find } from 'util.js';
import { isValidSolid, getSolidData } from 'data';
import { Vec3D, getCentroid } from 'math/linAlg';

import type { SolidData } from './solidTypes';
import Face from './Face';
import Vertex from './Vertex';
import Edge from './Edge';
import Builder from './SolidBuilder';
import type { VertexArg } from './SolidBuilder';

function calculateEdges(faces: Face[]) {
  return _(faces)
    .flatMap(face => face.edges.map(e => e.undirected()))
    .uniqWith((e1, e2) => e1.equals(e2))
    .value();
}

export default class Polyhedron {
  _solidData: SolidData;
  faces: Face[];
  vertices: Vertex[];
  _edges: Edge[];

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
  }

  get edges() {
    if (!this._edges) {
      this._edges = calculateEdges(this.faces);
    }
    return this._edges;
  }

  get solidData() {
    if (!this._solidData.edges) {
      this._solidData.edges = _.map(this.edges, 'value');
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
    const edgesToFaces = {};
    _.forEach(this.faces, face => {
      _.forEach(face.edges, ({ v1, v2 }) => {
        _.set(edgesToFaces, [v1.index.toString(), v2.index.toString()], face);
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
    return _.maxBy(this.faces, 'numSides');
  }

  smallestFace() {
    return _.minBy(this.faces, 'numSides');
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

  volume() {
    return _(this.faces)
      .map(face => (face.area() * face.distanceToCenter()) / 3)
      .sum();
  }

  /** Get the face that is closest to the given point. */
  hitFace(point: Vec3D) {
    return _.minBy(this.faces, face => face.plane().getDistanceToPoint(point));
  }

  // Mutations
  // =========

  withChanges(changes: Builder => Builder) {
    return changes(new Builder(this)).build();
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

  // Property predicates
  // ===================

  isUniform = _.once(() => {
    const vertexRegular =
      _(this.vertices)
        .map(v => v.adjacentFaceCounts())
        .uniqWith(_.isEqual)
        .size() === 1;
    if (!vertexRegular) return false;

    // Special case for pseudo-rhombicuboctahedron
    return !_.some(
      this.faces,
      face =>
        face.numSides === 4 &&
        _.isEqual(face.adjacentFaceCounts(), { '3': 1, '4': 3 }),
    );
  });

  isQuasiRegular() {
    if (!this.isUniform()) return false;
    const adjFaces = this.getVertex().adjacentFaceCounts();
    return _.every(adjFaces, count => count % 2 === 0);
  }

  isRegular() {
    return this.isUniform() && this.faceTypes().length === 1;
  }

  // TODO reimplement this in terms of face functions
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

  // Symmetry
  // ========

  // TODO Handle chirality
  symmetry = _.once(() => {
    if (!this.isUniform()) {
      throw new Error('Only uniform solids are supported right now');
    }

    const symmetryCounts = {
      T: { '3': 4, '6': 4 },
      O: { '3': 8, '4': 6, '6': 8, '8': 6 },
      I: { '3': 20, '5': 12, '6': 20, '10': 12 },
    };

    const faceCounts = this.numFacesBySides();

    for (let [symmetry, counts] of _.entries(symmetryCounts)) {
      if (_.some(faceCounts, (n, face: number) => n === counts[face])) {
        return symmetry;
      }
    }

    if (faceCounts[4] > 3) {
      return `P${faceCounts[4]}`;
    }
    if (faceCounts[3] > 6) {
      return `A${faceCounts[3] / 2}`;
    }
  });
}
