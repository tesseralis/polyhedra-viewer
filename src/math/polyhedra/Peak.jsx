// @flow

import _ from 'lodash';

import { Vec3D } from 'math/linAlg';
import Polyhedron from './Polyhedron';
import Face from './Face';
import Vertex from './Vertex';
import Edge from './Edge';
import VEList from './VEList';

type PeakType = 'pyramid' | 'cupola' | 'rotunda' | 'fastigium' | 'prism';
type FaceConfiguration = { [string]: number };

// Find the boundary of a connected set of faces
function getBoundary(faces: Face[]) {
  const e0 = _(faces)
    .flatMap('edges')
    .find(e => !e.twin().face.inSet(faces));

  const result: Edge[] = [];
  let e = e0;
  let count = 0;
  do {
    if (count++ > 20) throw new Error('we done goofed');
    if (!e.twin().face.inSet(faces)) {
      result.push(e);
      const nextTwin = e.next().twin();
      if (nextTwin.face.inSet(faces)) {
        e = nextTwin.next();
      } else {
        e = e.next();
      }
    } else {
      e = e.twin().next();
    }
  } while (!e.equals(e0));
  return new VEList(result);
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

  static find(polyhedron: Polyhedron, hitPoint: Vec3D) {
    const hitFace = polyhedron.hitFace(hitPoint);
    const peaks = Peak.getAll(polyhedron).filter(peak =>
      hitFace.inSet(peak.faces()),
    );
    if (peaks.length === 0) {
      return null;
    }
    return _.minBy(peaks, peak => peak.topPoint().distanceTo(hitPoint));
  }

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

  faces = _.once(() => {
    return _(this.innerVertices())
      .flatMap(v => v.adjacentFaces())
      .uniqBy('index')
      .value();
  });

  // TODO I'm still not a fan of this; I think the best would be to make this a face-like object
  // so you can get the things underneath it
  boundary = _.once(() => {
    return getBoundary(this.faces());
  });

  boundaryVectors = _.once(() => {
    return _.map(this.boundary(), 'vec');
  });

  isValid() {
    const matchFaces = _.every(this.innerVertices(), vertex => {
      const faceCount = _.countBy(vertex.adjacentFaces(), 'numSides');
      return _.isEqual(faceCount, this.faceConfiguration());
    });
    return matchFaces && this.boundary().isPlanar();
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
