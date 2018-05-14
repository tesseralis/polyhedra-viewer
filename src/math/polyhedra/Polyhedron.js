// @flow
import _ from 'lodash';
import type { Iteratee } from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';

import { find, getCyclic } from 'util.js';
import { isValidSolid, getSolidData } from 'data';
import { getCentroid } from 'math/linAlg';
import type { Point } from 'math/linAlg';
import type { Vertex, Face, Edge } from './solidTypes';

import Peak from './Peak';
import FaceObj from './Face';
import VertexObj from './Vertex';
import EdgeObj from './Edge';

interface BasePolyhedron {
  vertices: Vertex[];
  faces: Face[];
  edges?: Edge[];
  name?: string;
}

function getEdge(v1, v2) {
  return v1 < v2 ? [v1, v2] : [v2, v1];
}

export default class Polyhedron {
  vertices: Vertex[];
  faces: Face[];
  faceObjs: FaceObj[];
  vertexObjs: VertexObj[];

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
    this.vertexObjs = vertices.map(
      (vertex, vIndex) => new VertexObj((this: any), vIndex),
    );
    this.faceObjs = faces.map(
      (face, fIndex) => new FaceObj((this: any), fIndex),
    );
    if (edges) {
      this._edges = edges;
    }
  }

  getAllEdges() {
    return _(this.faces)
      .flatMap(vIndices =>
        vIndices.map((vertex, i) =>
          getEdge(vertex, getCyclic(vIndices, i + 1)),
        ),
      )
      .uniqWith(_.isEqual)
      .value();
  }

  get edges() {
    if (!this._edges) {
      this._edges = this.getAllEdges();
    }
    return this._edges;
  }

  toJSON() {
    return _.pick(this, ['vertices', 'faces', 'edges', 'name']);
  }

  getVertex() {
    return this.vertexObjs[0];
  }

  getFace() {
    return this.faceObjs[0];
  }

  getVertices = () => {
    return this.vertexObjs;
  };

  getFaces = () => {
    return this.faceObjs;
  };

  getEdges = () => {
    return _.map(this.edges, ([a, b]) => new EdgeObj((this: any), a, b));
  };

  biggestFace() {
    return _.maxBy(this.getFaces(), 'numSides');
  }

  smallestFace() {
    return _.minBy(this.getFaces(), 'numSides');
  }

  faceWithNumSides(n: number) {
    return find(this.getFaces(), { numSides: n });
  }

  numVertices() {
    return this.vertices.length;
  }

  numFaces() {
    return this.faces.length;
  }

  // Return the number of each type of faces of each face
  faceCount() {
    return _.countBy(this.getFaces(), 'numSides');
  }

  // The list of the type of faces this polyhedron has, ordered
  faceTypes() {
    return _(this.getFaces())
      .map('numSides')
      .uniq()
      .sortBy()
      .value();
  }

  // Get the edge length of this polyhedron, assuming equal edges
  edgeLength() {
    return this.getFace().edgeLength();
  }

  vertexGraph = _.memoize(() => {
    const graph = {};
    _.forEach(this.getFaces(), face => {
      _.forEach(face.edges(), edge => {
        if (!graph[edge.a]) {
          graph[edge.a] = [];
        }
        graph[edge.a].push(edge.vb);
      });
    });
    return graph;
  });

  vertexToFaceGraph = _.memoize(() => {
    const mapping = this.vertices.map(() => []);
    this.getFaces().forEach(face => {
      face.vertices.forEach(v => {
        mapping[v.index].push(face);
      });
    });
    return mapping;
  });

  faceGraph = _.memoize(() => {
    const graph = {};
    _.forEach(this.getEdges(), edge => {
      const [f1, f2] = edge.adjacentFaces();
      if (!graph[f1.index]) graph[f1.index] = [];
      if (!graph[f2.index]) graph[f2.index] = [];
      graph[f1.index].push(f2);
      graph[f2.index].push(f1);
    });
    return graph;
  });

  edgeToFaceGraph = _.memoize(() => {
    const edgesToFaces = {};
    _.forEach(this.getFaces(), face => {
      _.forEach(face.edges(), ({ a, b }) => {
        _.set(edgesToFaces, [a, b], face);
      });
    });
    return edgesToFaces;
  });

  // return a new polyhedron with the given vertices
  withVertices(vertices: Vertex[]) {
    return new Polyhedron({ ...this.toJSON(), vertices });
  }

  withVertexVectors(vecs: Vec3D[]) {
    const vertices = vecs.map(v => v.toArray());
    return this.withVertices(vertices);
  }

  // return a new polyhedron with the given faces
  withFaces(faces: Face[]) {
    return new Polyhedron({ ...this.toJSON(), faces });
  }

  addVertices(vertices: Vertex[]) {
    return this.withVertices(this.vertices.concat(vertices));
  }

  addFaces(faces: Face[]) {
    return this.withFaces(this.faces.concat(faces));
  }

  addPolyhedron(other: Polyhedron) {
    return this.addVertices(other.vertices).addFaces(
      other.faces.map(vIndices =>
        vIndices.map(vIndex => vIndex + this.numVertices()),
      ),
    );
  }

  removeFace(face: FaceObj) {
    const removed = [...this.faces];
    _.pullAt(removed, [face.index]);
    return this.withFaces(removed);
  }

  removeFaces(faceObjs: FaceObj[]) {
    const removed = [...this.faces];
    _.pullAt(removed, _.map(faceObjs, 'index'));
    return this.withFaces(removed);
  }

  mapVertices(iteratee: Iteratee<Vertex>) {
    return this.withVertices(_.map(this.vertices, iteratee));
  }

  mapFaces(iteratee: FaceObj => Face) {
    return this.withFaces(this.getFaces().map(iteratee));
  }

  centroid() {
    return getCentroid(_.map(this.vertexObjs, 'vec'));
  }

  distanceToCenter() {
    return this.getFace().distanceToCenter();
  }

  faceAdjacencyList() {
    const faceAdjacencyCounts = _.map(this.getFaces(), face => ({
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
    return this.withVertexVectors(
      this.vertexObjs.map(v => v.vec.sub(centroid)),
    );
  }

  hitFace(point: Point) {
    return _.minBy(this.getFaces(), face =>
      face.plane().getDistanceToPoint(point),
    );
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
