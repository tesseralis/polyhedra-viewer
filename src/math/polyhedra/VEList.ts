import _ from 'lodash';
import { Vec3D } from 'math/geom';

import {
  PRECISION,
  isPlanar,
  getPlane,
  getCentroid,
  getNormal,
  getNormalRay,
} from 'math/geom';
import { find } from 'utils';
import Polyhedron from './Polyhedron';
import Edge from './Edge';
import Vertex, { VertexList } from './Vertex';

// A list of vertices connected by edges
export default class VEList implements VertexList {
  polyhedron: Polyhedron;
  vertices: Vertex[];
  edges: Edge[];
  vectors: Vec3D[];

  constructor(vertices: Vertex[], edges: Edge[]) {
    this.polyhedron = vertices[0].polyhedron;
    this.vertices = vertices;
    this.edges = edges;
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

  adjacentFaces() {
    return _.map(this.edges, edge => edge.twin().face);
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

  /** Get the area of a *regular* polygon */
  area() {
    return (this.numSides * this.sideLength() * this.apothem()) / 2;
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
}
