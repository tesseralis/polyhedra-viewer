// @flow

import _ from 'lodash';
import { isPlanar } from 'math/linAlg';

import Polyhedron from './Polyhedron';
import Face from './Face';
import Vertex from './Vertex';
import Edge from './Edge';

type PeakType = 'pyramid' | 'cupola' | 'rotunda' | 'fastigium' | 'prism';
type FaceConfiguration = { [string]: number };

// Get a "face" (list of vertices) representing the boundary of the given faces
function getBoundary(faces: Face[]) {
  const edges = {};
  // build up a lookup table for every pair of edges to that face
  _.forEach(faces, face => {
    // for the pairs of vertices, find the face that contains the corresponding pair
    _.forEach(face.edges, edge => {
      const [i1, i2] = _.map(edge.vertices, 'index');
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
    this.vertices = vertices;
    this.type = type;
  }

  innerVertices() {
    return this.vertices;
  }

  topPoint() {}

  faceConfiguration: () => FaceConfiguration;

  faces = _.memoize(() => {
    return _(this.innerVertices())
      .flatMap(v => v.adjacentFaces())
      .uniqBy('index')
      .value();
  });

  // TODO I'm still not a fan of this; I think the best would be to make this a face-like object
  // so you can get the things underneath it
  boundary = _.memoize(() => {
    const boundary = getBoundary(this.faces());
    return boundary.map(vIndex => this.polyhedron.vertices[vIndex]);
  });

  isValid() {
    const matchFaces = _.every(this.innerVertices(), vertex => {
      const faceCount = _.countBy(vertex.adjacentFaces(), 'numSides');
      return _.isEqual(faceCount, this.faceConfiguration());
    });
    return matchFaces && isPlanar(_.map(this.boundary(), 'vec'));
  }
}
const Pyramid = withMapper('vertices')(
  class extends Peak {
    vertex: Vertex;

    constructor(polyhedron, vertex) {
      super(polyhedron, [vertex], 'pyramid');
      this.vertex = vertex;
    }

    faceConfiguration = () => ({ '3': this.faces().length });

    topPoint() {
      return this.vertex.vec;
    }
  },
);

const Fastigium = withMapper('edges')(
  class extends Peak {
    edge: Edge;

    constructor(polyhedron, edge) {
      super(polyhedron, edge.vertices, 'fastigium');
      this.edge = edge;
    }

    faceConfiguration = () => ({ '3': 1, '4': 2 });

    topPoint() {
      return this.edge.midpoint();
    }
  },
);

const Cupola = withMapper('faces')(
  class extends Peak {
    face: Face;

    constructor(polyhedron, face) {
      super(polyhedron, face.vertices, 'cupola');
      this.face = face;
    }

    faceConfiguration = () => _.countBy([3, 4, 4, this.innerVertices().length]);

    topPoint() {
      return this.face.centroid();
    }
  },
);

const Rotunda = withMapper('faces')(
  class extends Peak {
    face: Face;

    constructor(polyhedron, face) {
      super(
        polyhedron,
        _(face.vertices)
          .flatMap(v => v.adjacentVertices())
          .uniqBy('index')
          .value(),
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
