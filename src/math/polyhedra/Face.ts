import _ from 'lodash';

import { getCyclic, flatMapUniq } from 'utils';
import { VIndex, FIndex } from './solidTypes';
import Polyhedron from './Polyhedron';
import VEList from './VEList';
import Edge from './Edge';

export default class Face extends VEList {
  index: FIndex;
  value: VIndex[];

  constructor(polyhedron: Polyhedron, index: FIndex) {
    const value = polyhedron._solidData.faces[index];
    const vertices = _.map(value, vIndex => polyhedron.vertices[vIndex]);
    const edges = _.map(
      vertices,
      (v, i) => new Edge(v, getCyclic(vertices, i + 1)),
    );

    super(vertices, edges);
    this.index = index;
    this.value = value;
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
    return flatMapUniq(
      this.vertices,
      vertex => vertex.adjacentFaces(),
      'index',
    );
  }

  /** Return adjacent faces counted by number of sides */
  adjacentFaceCounts() {
    return _.countBy(this.adjacentFaces(), 'numSides');
  }

  withPolyhedron(polyhedron: Polyhedron) {
    return polyhedron.faces[this.index];
  }
}
