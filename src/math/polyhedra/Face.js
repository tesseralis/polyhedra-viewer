// @flow
import _ from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';

import Polyhedron from './Polyhedron';
import { VIndex, FIndex } from './solidTypes';
import { getCyclic, numSides } from './solidUtils';
import {
  PRECISION,
  getPlane,
  getCentroid,
  getNormal,
  getNormalRay,
} from 'math/linAlg';

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

  vIndices() {
    return this.face;
  }

  numSides(fIndex: FIndex) {
    return numSides(this.face);
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

  adjacentFaces() {
    const adjacentFaceIndices = this.polyhedron.faceGraph()[this.fIndex];
    return adjacentFaceIndices.map(fIndex => this.polyhedron.getFace(fIndex));
  }

  edgeLength() {
    const [v0, v1] = this.vertices;
    return v0.distanceTo(v1);
  }

  plane() {
    return getPlane(this.vertices);
  }

  apothem() {
    return this.edgeLength() / (2 * Math.tan(Math.PI / this.numSides()));
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
    // FIXME make the `getNormal` function normalize
    return getNormal(this.vertices).getNormalized();
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
}
