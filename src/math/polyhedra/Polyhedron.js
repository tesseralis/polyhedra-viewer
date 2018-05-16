// @flow
import _ from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';

import { find } from 'util.js';
import { isValidSolid, getSolidData } from 'data';
import { getCentroid } from 'math/linAlg';
import type { Point } from 'math/linAlg';
import type { VIndex, SolidData } from './solidTypes';

import Peak from './Peak';
import FaceObj from './Face';
import VertexObj from './Vertex';
import EdgeObj from './Edge';

export default class Polyhedron {
  solidData: SolidData;
  faces: FaceObj[];
  vertices: VertexObj[];
  _edges: EdgeObj[];

  static get(name: string) {
    if (!isValidSolid(name)) {
      throw new Error(`Invalid solid name: ${name}`);
    }
    return new Polyhedron(getSolidData(name));
  }

  static of(vertices: Point[], faces: VIndex[][]) {
    return new Polyhedron({ vertices, faces });
  }

  constructor(solidData: SolidData) {
    this.solidData = solidData;
    this.vertices = solidData.vertices.map(
      (vertex, vIndex) => new VertexObj((this: any), vIndex),
    );
    this.faces = solidData.faces.map(
      (face, fIndex) => new FaceObj((this: any), fIndex),
    );
  }

  toJSON() {
    if (this.solidData.edges) return this.solidData;
    return {
      ...this.solidData,
      edges: _.map(this.edges, 'value'),
    };
  }

  getVertex() {
    return this.vertices[0];
  }

  getFace() {
    return this.faces[0];
  }

  calculateEdges() {
    return _(this.faces)
      .flatMap(face => face.edges.map(e => e.undirected()))
      .uniqWith((e1, e2) => e1.equals(e2))
      .value();
  }

  get edges() {
    if (!this._edges) {
      this._edges = this.calculateEdges();
    }
    return this._edges;
  }

  biggestFace() {
    return _.maxBy(this.faces, 'numSides');
  }

  smallestFace() {
    return _.minBy(this.faces, 'numSides');
  }

  faceWithNumSides(n: number) {
    return find(this.faces, { numSides: n });
  }

  numVertices() {
    return this.vertices.length;
  }

  numFaces() {
    return this.faces.length;
  }

  // Return the number of each type of faces of each face
  faceCount() {
    return _.countBy(this.faces, 'numSides');
  }

  // The list of the type of faces this polyhedron has, ordered
  faceTypes() {
    return _(this.faces)
      .map('numSides')
      .uniq()
      .sortBy()
      .value();
  }

  // Get the edge length of this polyhedron, assuming equal edges
  edgeLength() {
    return this.getFace().edgeLength();
  }

  edgeToFaceGraph = _.memoize(() => {
    const edgesToFaces = {};
    _.forEach(this.faces, face => {
      _.forEach(face.edges, ({ v1, v2 }) => {
        _.set(edgesToFaces, [v1.index, v2.index], face);
      });
    });
    return edgesToFaces;
  });

  // return a new polyhedron with the given vertices
  withVertices(vertices: Point[]) {
    return new Polyhedron({ ...this.toJSON(), vertices });
  }

  withVertexVectors(vecs: Vec3D[]) {
    const vertices = vecs.map(v => v.toArray());
    return this.withVertices(vertices);
  }

  // return a new polyhedron with the given faces
  withFaces(faces: VIndex[][]) {
    return new Polyhedron({ ...this.toJSON(), faces, edges: undefined });
  }

  addVertices(vertices: Point[]) {
    return this.withVertices(this.solidData.vertices.concat(vertices));
  }

  addFaces(faces: VIndex[][]) {
    return this.withFaces(this.solidData.faces.concat(faces));
  }

  addPolyhedron(other: Polyhedron) {
    return this.addVertices(other.solidData.vertices).addFaces(
      other.solidData.faces.map(vIndices =>
        vIndices.map(vIndex => vIndex + this.numVertices()),
      ),
    );
  }

  removeFace(face: FaceObj) {
    const removed = [...this.solidData.faces];
    _.pullAt(removed, [face.index]);
    return this.withFaces(removed);
  }

  removeFaces(faces: FaceObj[]) {
    const removed = [...this.solidData.faces];
    _.pullAt(removed, _.map(faces, 'index'));
    return this.withFaces(removed);
  }

  mapFaces(iteratee: FaceObj => VIndex[][]) {
    return this.withFaces(this.faces.map(iteratee));
  }

  centroid() {
    return getCentroid(_.map(this.vertices, 'vec'));
  }

  faceAdjacencyList() {
    const faceAdjacencyCounts = _.map(this.faces, face => ({
      n: face.numSides,
      adj: _.countBy(face.adjacentFaces(), face2 => face2.numSides),
    }));
    return _.sortBy(
      faceAdjacencyCounts,
      ['n', 'adj.length'].concat([3, 4, 5, 6, 8, 10].map(n => `adj[${n}]`)),
    );
  }

  isSame(other: Polyhedron) {
    if (!_.isEqual(this.faceCount(), other.faceCount())) return false;
    return _.isEqual(this.faceAdjacencyList(), other.faceAdjacencyList());
  }

  /**
   * Center the polyhedron on its centroid.
   */
  center() {
    const centroid = this.centroid();
    return this.withVertexVectors(this.vertices.map(v => v.vec.sub(centroid)));
  }

  hitFace(point: Point) {
    return _.minBy(this.faces, face => face.plane().getDistanceToPoint(point));
  }

  peaks() {
    return Peak.getAll((this: any));
  }

  findPeak(hitPoint: Point) {
    const hitFace = this.hitFace(hitPoint);
    const peaks = this.peaks().filter(peak => hitFace.inSet(peak.faces()));
    if (peaks.length === 0) {
      return null;
    }
    return _.minBy(peaks, peak => peak.topPoint().distanceTo(hitPoint));
  }
}
