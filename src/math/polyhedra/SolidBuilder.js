// @flow
import _ from 'lodash';
import { Vec3D } from 'toxiclibsjs/geom';

import type { Point } from 'math/linAlg';
import type { VIndex, SolidData } from './solidTypes';
import Vertex from './Vertex';
import Face from './Face';
import Polyhedron from './Polyhedron';

export type VertexArg = Point | Vec3D | Vertex;

type FaceArg = (VIndex | Vertex)[] | Face;

function normalizeVertex(v: VertexArg) {
  // If it's a raw point
  if (Array.isArray(v)) return v;
  // if it's a vector
  if (v instanceof Vec3D) return v.toArray();
  // If it's a vertex object
  return v.value;
}

function normalizeVertices(vertices: VertexArg[]) {
  return _.map(vertices, normalizeVertex);
}

function normalizeFace(face: FaceArg) {
  if (Array.isArray(face)) {
    return _.map(face, v => {
      if (typeof v === 'number') return v;
      return v.index;
    });
  }
  return face.value;
}

function normalizeFaces(faces: FaceArg[]) {
  return _.map(faces, normalizeFace);
}

export default class Builder {
  polyhedron: Polyhedron;
  solidData: SolidData;

  constructor(polyhedron: Polyhedron) {
    this.polyhedron = polyhedron;
    this.solidData = { ...polyhedron.solidData };
  }

  build() {
    return new Polyhedron(this.solidData);
  }

  // return a new polyhedron with the given vertices
  withVertices(vertices: VertexArg[]) {
    _.extend(this.solidData, { vertices: normalizeVertices(vertices) });
    return this;
  }

  // return a new polyhedron with the given faces
  withFaces(faces: FaceArg[]) {
    // reset edges, since faces might have changed
    _.extend(this.solidData, {
      faces: normalizeFaces(faces),
      edges: undefined,
    });
    return this;
  }

  addVertices(vertices: Point[]) {
    return this.withVertices(this.solidData.vertices.concat(vertices));
  }

  addFaces(faces: VIndex[][]) {
    return this.withFaces(this.solidData.faces.concat(faces));
  }

  /** Map the faces of the *original* solid to new ones */
  mapFaces(iteratee: Face => FaceArg[]) {
    return this.withFaces((_.map(this.polyhedron.faces, iteratee): any));
  }

  withoutFaces(faces: Face[]) {
    const removed = [...this.solidData.faces];
    _.pullAt(removed, _.map(faces, 'index'));
    return this.withFaces(removed);
  }

  addPolyhedron(other: Polyhedron) {
    return this.addVertices(other.solidData.vertices).addFaces(
      other.faces.map(face =>
        face.vertices.map(v => v.index + this.polyhedron.numVertices()),
      ),
    );
  }
}
