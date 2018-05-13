// @flow

import _ from 'lodash';
import { isPlanar } from 'math/linAlg';
import type { Edge } from './solidTypes';

import Polyhedron from './Polyhedron';
import Face from './Face';
import Vertex from './Vertex';

type PeakType = 'pyramid' | 'cupola' | 'rotunda' | 'fastigium' | 'prism';
type FaceConfiguration = { [string]: number };

// Get a "face" (list of vertices) representing the boundary of the given faces
function getBoundary(faces: Face[]) {
  const edges = {};
  // build up a lookup table for every pair of edges to that face
  _.forEach(faces, face => {
    // for the pairs of vertices, find the face that contains the corresponding pair
    _.forEach(face.directedEdges(), edge => {
      const [i1, i2] = edge;
      if (_.includes(edges[i2], i1)) {
        _.pull(edges[i2], i1);
      } else {
        if (!edges[i1]) {
          edges[i1] = [];
        }
        edges[i1].push(i2);
      }
    });
  });

  const cycle = _(edges)
    .pickBy('length')
    .mapValues(0)
    .value();
  const first = _.values(cycle)[0];
  const result = [first];
  for (let i = cycle[first]; i !== first; i = cycle[i]) {
    result.push(i);
  }
  return result;
}

const withMapper = property => Base =>
  class extends Base {
    static getAll(polyhedron: Polyhedron) {
      const mapper = _.get(polyhedron, property);
      return (typeof mapper === 'function' ? mapper() : mapper)
        .map(arg => new Base(polyhedron, arg))
        .filter(peak => peak.isValid());
    }
  };

export default class Peak {
  polyhedron: Polyhedron;
  vertices: Vertex[];
  type: PeakType;

  static getAll(polyhedron: Polyhedron) {
    const pyramids = Pyramid.getAll(polyhedron);
    if (pyramids.length > 0) return pyramids;

    const fastigium = Fastigium.getAll(polyhedron);
    if (fastigium.length > 0) return fastigium;

    const cupolaRotunda = Cupola.getAll(polyhedron).concat(
      Rotunda.getAll(polyhedron),
    );
    if (cupolaRotunda.length > 0) return cupolaRotunda;
    return [];
  }

  constructor(polyhedron: Polyhedron, vertices: Vertex[], type: PeakType) {
    this.polyhedron = polyhedron;
    // this.vIndices = vIndices;
    this.vertices = vertices;
    this.type = type;
  }

  innerVertices() {
    return this.vertices;
  }

  topPoint() {}

  faceConfiguration: () => FaceConfiguration;

  faces = _.memoize(() => {
    return this.polyhedron.adjacentFaces(
      ..._.map(this.innerVertices(), 'index'),
    );
  });

  // FIXME
  boundary = _.memoize(() => {
    return getBoundary(this.faces());
  });

  boundaryVertices() {
    return this.boundary().map(vIndex => this.polyhedron.vertexObjs[vIndex]);
  }

  isValid() {
    const matchFaces = _.every(this.innerVertices(), vertex => {
      const faceCount = _.countBy(vertex.adjacentFaces(), 'numSides');
      return _.isEqual(faceCount, this.faceConfiguration());
    });
    return (
      matchFaces && isPlanar(this.polyhedron.vertexVectors(this.boundary()))
    );
  }
}
const Pyramid = withMapper('getVertices')(
  class extends Peak {
    vertex: Vertex;

    constructor(polyhedron, vertex) {
      super(polyhedron, [vertex], 'pyramid');
      this.vertex = vertex;
    }

    faceConfiguration = () => ({ '3': this.faces().length });

    topPoint() {
      return this.vertex.value;
    }
  },
);

const Fastigium = withMapper('edges')(
  class extends Peak {
    edge: Edge;

    constructor(polyhedron, edge) {
      super(
        polyhedron,
        edge.map(vIndex => polyhedron.getVertices()[vIndex]),
        'fastigium',
      );
      this.edge = edge;
    }

    faceConfiguration = () => ({ '3': 1, '4': 2 });

    topPoint() {
      const [v1, v2] = this.polyhedron.vertexVectors(this.edge);
      return v1.add(v2).scale(0.5);
    }
  },
);

const Cupola = withMapper('getFaces')(
  class extends Peak {
    face: Face;

    constructor(polyhedron, face) {
      super(polyhedron, face.getVertices(), 'cupola');
      this.face = face;
    }

    faceConfiguration = () => _.countBy([3, 4, 4, this.innerVertices().length]);

    topPoint() {
      return this.face.centroid();
    }
  },
);

const Rotunda = withMapper('getFaces')(
  class extends Peak {
    face: Face;

    constructor(polyhedron, face) {
      super(
        polyhedron,
        polyhedron.adjacentVertices(...face.getVertices()),
        'rotunda',
      );
      this.face = face;
    }

    faceConfiguration = () => ({ '5': 2, '3': 2 });

    topPoint() {
      return this.face.centroid();
    }
  },
);
