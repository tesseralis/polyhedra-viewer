// @flow
import _ from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';
import { isValidSolid, getSolidData } from 'data';
import { atIndices } from 'util.js';
import {
  vec,
  getMidpoint,
  isPlanar,
  getPlane,
  getNormal,
  getCentroid,
  PRECISION,
} from './linAlg';
import type { Vector } from './linAlg';
import {
  numSides,
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

  numVertices() {
    return this.vertices.length;
  }

  numFaces() {
    return this.faces.length;
  }

  numSides(fIndex: FIndex) {
    return numSides(this.faces[fIndex]);
  }

  numUniqueSides(fIndex: FIndex) {
    const face = this.faces[fIndex];
    const faceVertices = this.vertexVectors(face);
    const uniqueVertices = _.filter(
      faceVertices,
      (vertex: Vec3D, i: VIndex) => {
        return !vertex.equalsWithTolerance(
          faceVertices[(i + 1) % faceVertices.length],
          PRECISION,
        );
      },
    );
    return uniqueVertices.length;
  }

  vIndices = () => {
    return _.range(this.numVertices());
  };

  fIndices = () => {
    return _.range(this.numFaces());
  };

  // Return the number of each type of faces of each face
  faceCount() {
    return _.countBy(this.faces, numSides);
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

  edgeLength(fIndex: FIndex = 0) {
    const [v0, v1] = this.vertexVectors(this.faces[fIndex]);
    return v0.distanceTo(v1);
  }

  // get the apothem of the given face
  apothem(fIndex: FIndex) {
    return (
      this.edgeLength(fIndex) / (2 * Math.tan(Math.PI / this.numSides(fIndex)))
    );
  }

  // Return the faces adjacent to the given vertices
  adjacentFaceIndices(...vIndices: VIndex[]): FIndex[] {
    return _(vIndices)
      .flatMap(vIndex => this.vertexToFaceGraph()[vIndex])
      .uniq()
      .value();
  }

  adjacentFaces(...vIndices: VIndex[]) {
    return atIndices(this.faces, this.adjacentFaceIndices(...vIndices));
  }

  // Get the list of adjacent faces to this polyhedron in ccw order
  directedAdjacentFaceIndices(vIndex: VIndex) {
    const { faces } = this;
    const touchingFaceIndices = _.clone(this.adjacentFaceIndices(vIndex));
    const result = [];
    let next: FIndex = touchingFaceIndices[0];
    const checkVertex = f =>
      prevVertex(faces[next], vIndex) === nextVertex(faces[f], vIndex);
    do {
      result.push(next);
      next = _.find(touchingFaceIndices, checkVertex);
    } while (result.length < touchingFaceIndices.length);
    return result;
  }

  // Return the number of faces by side for the given vertex
  adjacentFaceCount(vIndex: VIndex) {
    return _.countBy(this.adjacentFaces(vIndex), numSides);
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
    this.faces.forEach((face, fIndex) => {
      face.forEach(vIndex => {
        mapping[vIndex].push(fIndex);
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

  /** Return the centroid of the face given by the face index */
  faceCentroid(fIndex: FIndex) {
    return getCentroid(
      this.faces[fIndex].map(vIndex => this.vertexVectors()[vIndex]),
    );
  }

  // TODO decide what should return a Vec3D and what should return an array
  distanceToCenter(fIndex: FIndex = 0) {
    const origin = this.centroid();
    const faceCentroid = this.faceCentroid(fIndex);
    return origin.distanceTo(faceCentroid);
  }

  /** Return the normal of the face given by the face index */
  faceNormal(fIndex: FIndex) {
    return getNormal(this.vertexVectors(this.faces[fIndex])).getNormalized();
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
      // throw new Error(`The edge ${edge} is not connected to two faces.`)
      return 2 * Math.PI;
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
    const faceAdjacencyCounts = _.map(
      this.faceGraph(),
      (adjFaces: FIndex[], fIndex: string) => ({
        n: numSides(this.faces[parseInt(fIndex, 10)]),
        adj: _.countBy(adjFaces, fIndex2 => numSides(this.faces[fIndex2])),
      }),
    );
    return _.sortBy(
      faceAdjacencyCounts,
      ['n', 'adj.length'].concat([3, 4, 5, 6, 8, 10].map(n => `adj[${n}]`)),
    );
  }

  isFaceValid(fIndex: FIndex) {
    return _.every(getEdges(this.faces[fIndex]), edge => {
      const [v0, v1] = this.vertexVectors(edge);
      return v0.distanceTo(v1) > PRECISION;
    });
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

  hitFaceIndex(point: Vector) {
    return _.minBy(this.fIndices(), fIndex => {
      const face = this.faces[fIndex];
      const plane = getPlane(this.vertexVectors(face));
      return plane.getDistanceToPoint(point);
    });
  }

  peaks() {
    return Peak.getAll((this: any));
  }

  findPeak(point: Vector) {
    const hitPoint = vec(point);
    const hitFaceIndex = this.hitFaceIndex(hitPoint);
    const peaks = this.peaks().filter(peak =>
      _.includes(peak.faceIndices(), hitFaceIndex),
    );
    if (peaks.length === 0) {
      return null;
    }
    return _.minBy(peaks, peak => peak.topPoint().distanceTo(hitPoint));
  }
}
