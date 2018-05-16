// @flow
import _ from 'lodash';
import { Vec3D } from 'math/linAlg';

import {
  PRECISION,
  isPlanar,
  getPlane,
  getCentroid,
  getNormal,
  getNormalRay,
} from 'math/linAlg';
import { find, getCyclic } from 'util.js';
import Polyhedron from './Polyhedron';
import Edge from './Edge';
import Vertex from './Vertex';

// A list of vertices connected by edges
export default class VEList {
  polyhedron: Polyhedron;
  vertices: Vertex[];
  edges: Edge[];
  vectors: Vec3D[];

  constructor(veList: Vertex[] | Edge[]) {
    this.polyhedron = veList[0].polyhedron;
    if (veList[0] instanceof Vertex) {
      this.vertices = (veList: any);
      this.edges = _.map(
        this.vertices,
        (v, i: number) => new Edge(v, getCyclic(this.vertices, i + 1)),
      );
    } else {
      this.edges = (veList: any);
      this.vertices = _.map(this.edges, 'v1');
    }
    this.vectors = _.map(this.vertices, 'vec');
  }

  get numSides() {
    return this.vertices.length;
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

  sideLength() {
    return this.edges[0].length();
  }

  isPlanar() {
    return isPlanar(this.vectors);
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

  // TODO check if planar?
  isValid() {
    return _.every(this.edges, edge => edge.length() > PRECISION);
  }
}
