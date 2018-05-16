// @flow
import _ from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';

import { find, getCyclic } from 'util.js';
import Polyhedron from './Polyhedron';
import { VIndex, FIndex } from './solidTypes';
import Edge from './Edge';
import Vertex from './Vertex';
import {
  PRECISION,
  getPlane,
  getCentroid,
  getNormal,
  getNormalRay,
} from 'math/linAlg';

export default class Face {
  polyhedron: Polyhedron;
  index: FIndex;
  value: VIndex[];
  vertices: Vertex[];
  edges: Edge[];
  vectors: $ReadOnly<Vec3D>[];

  constructor(polyhedron: Polyhedron, index: FIndex) {
    this.polyhedron = polyhedron;
    this.index = index;
    this.value = polyhedron._solidData.faces[index];
    this.vertices = _.map(this.value, vIndex => polyhedron.vertices[vIndex]);
    this.edges = _.map(
      this.vertices,
      (v, i) => new Edge(v, getCyclic(this.vertices, i + 1)),
    );
    this.vectors = _.map(this.vertices, 'vec');
  }

  get numSides() {
    return this.value.length;
  }

  nextEdge(e: Edge) {
    return find(this.edges, e2 => e2.v1.equals(e.v2));
  }

  prevEdge(e: Edge) {
    return find(this.edges, e2 => e2.v2.equals(e.v1));
  }

  numUniqueSides() {
    return _.filter(this.edges, edge => edge.length() > PRECISION).length;
  }

  // Return true if this face is the same as the given face (within a polyhedron)
  equals(other: Face) {
    return this.index === other.index;
    // return this.polyhedron === other.polyhedron && this.index === other.index;
  }

  inSet(faces: Face[]) {
    return _.some(faces, face => this.equals(face));
  }

  /** Return the set of faces that share a vertex to this face (including itself) */
  vertexAdjacentFaces() {
    return _(this.vertices)
      .flatMap(vertex => vertex.adjacentFaces())
      .uniqBy('index')
      .value();
  }

  adjacentFaces() {
    return _.map(this.edges, edge => edge.twin().face);
  }

  sideLength() {
    return this.edges[0].length();
  }

  plane() {
    return getPlane(this.vectors);
  }

  apothem() {
    return this.sideLength() / (2 * Math.tan(Math.PI / this.numSides));
  }

  /** Return the centroid of the face given by the face index */
  centroid() {
    return getCentroid(this.vectors);
  }

  distanceToCenter() {
    const origin = this.polyhedron.centroid();
    return origin.distanceTo(this.centroid());
  }

  /** Return the normal of the face given by the face index */
  normal() {
    return getNormal(this.vectors);
  }

  normalRay() {
    return getNormalRay(this.vectors);
  }

  isValid() {
    return _.every(this.edges, edge => edge.length() > PRECISION);
  }

  withPolyhedron(polyhedron: Polyhedron) {
    return new Face(polyhedron, this.index);
  }
}
