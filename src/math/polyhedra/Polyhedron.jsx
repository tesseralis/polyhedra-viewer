// @flow
import _ from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';
import { find } from 'util.js';
import { isValidSolid, getSolidData } from 'data';
import { vec, getMidpoint, isPlanar, getCentroid } from 'math/linAlg';
import type { Vector } from 'math/linAlg';
import {
  hasEdge,
  getEdges,
  hasDirectedEdge,
  getAllEdges,
  getCyclic,
  prevVertex,
  nextVertex,
} from './solidUtils';
import type { Vertex, Face, Edge, VIndex, FIndex } from './solidTypes';

import Peak from './Peak';
import FaceObj from './Face';

interface BasePolyhedron {
  vertices: Vertex[];
  faces: Face[];
  edges?: Edge[];
  name?: string;
}

// NOTE: this file is .jsx because otherwise class properties won't be highlighted in sublime
export default class Polyhedron {
  vertices: Vertex[];
  faces: Face[];
  name: string;

  _edges: Edge[];

  static get(name: string) {
    if (!isValidSolid(name)) {
      throw new Error(`Invalid solid name: ${name}`);
    }
    return new Polyhedron({ ...getSolidData(name), name });
  }

  static of(vertices: Vertex[], faces: Face[]) {
    return new Polyhedron({ vertices, faces });
  }

  constructor({ vertices, faces, edges, name }: BasePolyhedron) {
    this.vertices = vertices;
    this.faces = faces;
    if (edges) {
      this._edges = edges;
    }
    if (name) {
      this.name = name;
    }
  }

  get edges() {
    if (!this._edges) {
      this._edges = getAllEdges(this.faces);
    }
    return this._edges;
  }

  toJSON() {
    return _.pick(this, ['vertices', 'faces', 'edges', 'name']);
  }

  getFace = _.memoize((fIndex: FIndex) => {
    // FIXME why do we need to cast?
    return new FaceObj((this: any), fIndex);
  });

  getFaces(): FaceObj[] {
    return this.fIndices().map(fIndex => this.getFace(fIndex));
  }

  numVertices() {
    return this.vertices.length;
  }

  numFaces() {
    return this.faces.length;
  }

  vIndices = () => {
    return _.range(this.numVertices());
  };

  fIndices = () => {
    return _.range(this.numFaces());
  };

  // Return the number of each type of faces of each face
  faceCount() {
    return _.countBy(this.getFaces(), face => face.numSides());
  }

  _vertexVectors: Vec3D[];

  // Return the vectors of this polyhedron as vectors
  vertexVectors(vIndices?: VIndex[]): Vec3D[] {
    if (!this._vertexVectors) {
      this._vertexVectors = this.vertices.map(vec);
    }
    return vIndices
      ? vIndices.map((vIndex: VIndex) => this._vertexVectors[vIndex])
      : this._vertexVectors;
  }

  vertexVector(vIndex: VIndex): Vec3D {
    return this.vertexVectors([vIndex])[0];
  }

  // Get the edge length of this polyhedron, assuming equal edges
  edgeLength() {
    return this.getFace(0).edgeLength();
  }

  // Return the faces adjacent to the given vertices
  adjacentFaceIndices(...vIndices: VIndex[]): FIndex[] {
    return _(vIndices)
      .flatMap(vIndex => this.vertexToFaceGraph()[vIndex])
      .map(face => face.fIndex)
      .uniq()
      .value();
  }

  adjacentFaces(...vIndices: VIndex[]) {
    return _(vIndices)
      .flatMap(vIndex => this.vertexToFaceGraph()[vIndex])
      .uniqBy(face => face.fIndex)
      .value();
  }

  directedAdjacentFaces(vIndex: VIndex) {
    const touchingFaces = this.adjacentFaces(vIndex);
    const result = [];
    let next: FaceObj = touchingFaces[0];
    const checkVertex = (f: FaceObj) =>
      prevVertex(next.vIndices(), vIndex) === nextVertex(f.vIndices(), vIndex);
    do {
      result.push(next);
      next = find(touchingFaces, checkVertex);
    } while (result.length < touchingFaces.length);
    return result;
  }
  // Return the number of faces by side for the given vertex
  adjacentFaceCount(vIndex: VIndex) {
    return _.countBy(this.adjacentFaces(vIndex), face => face.numSides());
  }

  // Get the vertices adjacent to this set of vertices
  adjacentVertexIndices(...vIndices: VIndex[]) {
    return _(vIndices)
      .flatMap(_.propertyOf(this.vertexGraph()))
      .uniq()
      .value();
  }

  vertexGraph = _.memoize(() => {
    const graph = {};
    _.forEach(this.faces, face => {
      _.forEach(face, (vIndex: VIndex, i: number) => {
        if (!graph[vIndex]) {
          graph[vIndex] = [];
        }
        graph[vIndex].push(getCyclic(face, i + 1));
      });
    });
    return graph;
  });

  vertexToFaceGraph = _.memoize(() => {
    const mapping = this.vertices.map(() => []);
    this.getFaces().forEach(face => {
      face.vIndices().forEach(vIndex => {
        mapping[vIndex].push(face);
      });
    });
    return mapping;
  });

  // return a new polyhedron with the given vertices
  withVertices(vertices: Vertex[]) {
    return new Polyhedron({ ...this.toJSON(), vertices });
  }

  // return a new polyhedron with the given faces
  withFaces(faces: Face[]) {
    return new Polyhedron({ ...this.toJSON(), faces });
  }

  withName(name: string) {
    return new Polyhedron({ ...this.toJSON(), name });
  }

  addVertices(vertices: Vertex[]) {
    return this.withVertices(this.vertices.concat(vertices));
  }

  addFaces(faces: Face[]) {
    return this.withFaces(this.faces.concat(faces));
  }

  mapVertices(iteratee: (Vertex, VIndex) => Vertex) {
    return this.withVertices(this.vertices.map(iteratee));
  }

  mapFaces(iteratee: (Face, FIndex) => Face) {
    return this.withFaces(this.faces.map(iteratee));
  }

  // Returns whether the set of vertices in this polyhedron are planar
  isPlanar(vIndices: VIndex[]) {
    return isPlanar(this.vertexVectors(vIndices));
  }

  centroid() {
    return getCentroid(this.vertexVectors());
  }

  // TODO decide what should return a Vec3D and what should return an array
  distanceToCenter() {
    return this.getFace(0).distanceToCenter();
  }

  // Get the faces adjacent to this edge, with the directed face first
  edgeFaceIndices([v1, v2]: Edge) {
    return [
      _.find(this.fIndices(), (fIndex: FIndex) =>
        hasDirectedEdge(this.faces[fIndex], [v1, v2]),
      ),
      _.find(this.fIndices(), (fIndex: FIndex) =>
        hasDirectedEdge(this.faces[fIndex], [v2, v1]),
      ),
    ];
  }

  edgeFaces(edge: Edge) {
    return this.faces.filter(face => hasEdge(face, edge));
  }

  getDihedralAngle(edge: Edge) {
    const [v1, v2] = edge.map(vIndex => this.vertexVectors()[vIndex]);
    const midpoint = getMidpoint(v1, v2);
    const [c1, c2] = this.edgeFaces(edge)
      .map(face =>
        getCentroid(face.map(vIndex => this.vertexVectors()[vIndex])),
      )
      .map(v => v.sub(midpoint));

    if (!c1 || !c2) {
      throw new Error(`The edge ${edge} is not connected to two faces.`);
      // return 2 * Math.PI;
    }

    return c1.angleBetween(c2, true);
  }

  faceGraph = _.memoize(() => {
    const edgesToFaces: { [string]: Face } = {};
    // build up a lookup table for every pair of edges to that face
    _.forEach(this.faces, (face: Face, index: FIndex) => {
      // for the pairs of vertices, find the face that contains the corresponding pair
      // ...this is n^2? more? ah who cares I'm too lazy
      _.forEach(getEdges(face), (edge: string) => {
        if (!edgesToFaces[edge]) {
          edgesToFaces[edge] = [];
        }
        // NOTE: this indexes the edge as a string (e.g. "1,2")
        edgesToFaces[edge].push(index);
      });
    });
    const graph = {};
    _.forEach(edgesToFaces, ([f1, f2]) => {
      if (!graph[f1]) graph[f1] = [];
      if (!graph[f2]) graph[f2] = [];
      graph[f1].push(f2);
      graph[f2].push(f1);
    });
    return graph;
  });

  faceAdjacencyList() {
    const faceAdjacencyCounts = _.map(this.getFaces(), face => ({
      n: face.numSides(),
      adj: _.countBy(face.adjacentFaces(), face2 => face2.numSides()),
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
    return this.withVertices(
      this.vertexVectors().map(v => v.sub(centroid).toArray()),
    );
  }

  hitFace(point: Vector) {
    return _.minBy(this.getFaces(), face =>
      face.plane().getDistanceToPoint(point),
    );
  }

  peaks() {
    return Peak.getAll((this: any));
  }

  findPeak(point: Vector) {
    const hitPoint = vec(point);
    const hitFace = this.hitFace(hitPoint);
    const peaks = this.peaks().filter(peak =>
      _.includes(peak.faceIndices(), hitFace.fIndex),
    );
    if (peaks.length === 0) {
      return null;
    }
    return _.minBy(peaks, peak => peak.topPoint().distanceTo(hitPoint));
  }
}
