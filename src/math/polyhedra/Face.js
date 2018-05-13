// @flow
import _ from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';

import { replace, getCyclic } from 'util.js';
import Polyhedron from './Polyhedron';
import { VIndex, FIndex, Edge } from './solidTypes';
import EdgeObj from './Edge';
import {
  PRECISION,
  getPlane,
  getCentroid,
  getNormal,
  getNormalRay,
} from 'math/linAlg';

function getEdge(v1: VIndex, v2: VIndex) {
  return v1 < v2 ? [v1, v2] : [v2, v1];
}

export default class Face {
  polyhedron: Polyhedron;
  fIndex: FIndex;
  face: VIndex[];
  vertices: $ReadOnly<Vec3D>[];

  constructor(polyhedron: Polyhedron, fIndex: FIndex) {
    this.polyhedron = polyhedron;
    this.fIndex = fIndex;
    this.face = polyhedron.faces[fIndex];
    this.vertices = polyhedron.vertexVectors(this.face);
  }

  get numSides() {
    return this.face.length;
  }

  vIndices() {
    return this.face;
  }

  getVertices() {
    return _.map(this.face, vIndex => this.polyhedron.vertexObjs[vIndex]);
  }

  nextVertex(vIndex: VIndex) {
    return getCyclic(this.face, this.face.indexOf(vIndex) + 1);
  }

  prevVertex(vIndex: VIndex) {
    return getCyclic(this.face, this.face.indexOf(vIndex) - 1);
  }

  replaceVertex(vIndex: VIndex, ...vIndices: VIndex[]) {
    return replace(this.face, this.face.indexOf(vIndex), ...vIndices);
  }

  getEdges(): Edge[] {
    return _.map(this.face, (vertex, i) => {
      return getEdge(vertex, getCyclic(this.face, i + 1));
    });
  }

  edges(): EdgeObj[] {
    return _.map(this.face, (vertex, i) => {
      return new EdgeObj(
        this.polyhedron,
        ...getEdge(vertex, getCyclic(this.face, i + 1)),
      );
    });
  }

  directedEdge(i: number) {
    const vIndex = getCyclic(this.face, i);
    return [vIndex, getCyclic(this.face, i + 1)];
  }

  directedEdges() {
    return _.map(this.face, (vIndex, i) => this.directedEdge(i));
  }

  // FIXME
  directedEdgeObj(i: number) {
    return new EdgeObj(this.polyhedron, ...this.directedEdge(i));
  }

  directedEdgeObjs() {
    return _.map(this.face, (vIndex, i) => this.directedEdgeObj(i));
  }

  numUniqueSides() {
    const uniqueVertices = _.filter(
      this.vertices,
      (vertex: Vec3D, i: VIndex) => {
        return !vertex.equalsWithTolerance(
          getCyclic(this.vertices, i + 1),
          PRECISION,
        );
      },
    );
    return uniqueVertices.length;
  }

  // Return true if this face is the same as the given face (within a polyhedron)
  equals(other: Face) {
    return this.fIndex === other.fIndex;
    // return this.polyhedron === other.polyhedron && this.fIndex === other.fIndex;
  }

  inSet(faces: Face[]) {
    return _.some(faces, face => this.equals(face));
  }

  indexIn(faces: Face[]) {
    return _.findIndex(faces, face => this.equals(face));
  }

  adjacentFaces() {
    return this.polyhedron.faceGraph()[this.fIndex];
  }

  directedAdjacentFaces() {
    return _.map(this.directedEdgeObjs(), edge => edge.adjacentFaces()[1]);
  }

  edgeLength() {
    const [v0, v1] = this.vertices;
    return v0.distanceTo(v1);
  }

  plane() {
    return getPlane(this.vertices);
  }

  apothem() {
    return this.edgeLength() / (2 * Math.tan(Math.PI / this.numSides));
  }

  /** Return the centroid of the face given by the face index */
  centroid() {
    return getCentroid(this.vertices);
  }

  // TODO decide what should return a Vec3D and what should return an array
  distanceToCenter() {
    const origin = this.polyhedron.centroid();
    return origin.distanceTo(this.centroid());
  }

  /** Return the normal of the face given by the face index */
  normal() {
    return getNormal(this.vertices);
  }

  normalRay() {
    return getNormalRay(this.vertices);
  }

  isValid() {
    return _.every(this.vertices, (v, i: number) => {
      const v1 = getCyclic(this.vertices, i + 1);
      return v.distanceTo(v1) > PRECISION;
    });
  }

  withPolyhedron(polyhedron: Polyhedron) {
    return new Face(polyhedron, this.fIndex);
  }
}
