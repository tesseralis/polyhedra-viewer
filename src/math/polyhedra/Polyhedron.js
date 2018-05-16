// @flow
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
      (vertex, vIndex) => new Vertex((this: any), vIndex),
    );
    this.faces = solidData.faces.map(
      (face, fIndex) => new Face((this: any), fIndex),
    );
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

  // Search functions
  // ================

  getVertex() {
    return this.vertices[0];
  }

  getFace() {
    return this.faces[0];
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

  /** Get the face that is closest to the given point. */
  hitFace(point: Vec3D) {
    return _.minBy(this.faces, face => face.plane().getDistanceToPoint(point));
  }

  // Mutations
  // =========

  withChanges(changes: Builder => Builder) {
    return changes(new Builder((this: any))).build();
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

  // Test functions
  // ==============

  faceAdjacencyList() {
    const faceAdjacencyCounts = _.map(this.faces, face => ({
      n: face.numSides,
      adj: _.countBy(face.adjacentFaces(), 'numSides'),
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
