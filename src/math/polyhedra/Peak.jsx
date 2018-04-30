// @flow

import _ from 'lodash';
import { getBoundary } from './solidUtils';
import { vec } from 'math/linAlg';
import type { Edge, VIndex } from './solidTypes';

import Polyhedron from './Polyhedron';
import Face from './Face';

type PeakType = 'pyramid' | 'cupola' | 'rotunda' | 'fastigium' | 'prism';
type FaceConfiguration = { [string]: number };

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
  vIndices: VIndex[];
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

  constructor(polyhedron: Polyhedron, vIndices: VIndex[], type: PeakType) {
    this.polyhedron = polyhedron;
    this.vIndices = vIndices;
    this.type = type;
  }

  innerVertexIndices() {
    return this.vIndices;
  }

  topPoint() {}

  // faceConfiguration(): FaceConfiguration;
  faceConfiguration: () => FaceConfiguration;

  faceIndices = _.memoize(() => {
    return this.polyhedron.adjacentFaceIndices(...this.innerVertexIndices());
  });

  faces = _.memoize(() => {
    return this.polyhedron
      .adjacentFaces(...this.innerVertexIndices())
      .map(face => face.vIndices());
  });

  boundary = _.memoize(() => {
    return getBoundary(this.faces());
  });

  isValid() {
    const matchFaces = _.every(this.innerVertexIndices(), vIndex => {
      const faceCount = this.polyhedron.adjacentFaceCount(vIndex);
      return _.isEqual(faceCount, this.faceConfiguration());
    });
    return matchFaces && this.polyhedron.isPlanar(this.boundary());
  }
}
const Pyramid = withMapper('vIndices')(
  class extends Peak {
    vIndex: VIndex;

    constructor(polyhedron, vIndex) {
      super(polyhedron, [vIndex], 'pyramid');
      this.vIndex = vIndex;
    }

    faceConfiguration = () => ({ '3': this.faces().length });

    topPoint() {
      return vec(this.polyhedron.vertices[this.vIndex]);
    }
  },
);

const Fastigium = withMapper('edges')(
  class extends Peak {
    edge: Edge;

    constructor(polyhedron, edge) {
      super(polyhedron, edge, 'fastigium');
      this.edge = edge;
    }

    faceConfiguration = () => ({ '3': 1, '4': 2 });

    topPoint() {
      const [v1, v2] = this.edge.map(v => this.polyhedron.vertexVectors()[v]);
      return v1.add(v2).scale(0.5);
    }
  },
);

const Cupola = withMapper('fIndices')(
  class extends Peak {
    face: Face;

    constructor(polyhedron, fIndex) {
      super(polyhedron, polyhedron.faces[fIndex], 'cupola');
      this.face = polyhedron.getFace(fIndex);
    }

    faceConfiguration = () =>
      _.countBy([3, 4, 4, this.innerVertexIndices().length]);

    topPoint() {
      return this.face.centroid();
    }
  },
);

const Rotunda = withMapper('fIndices')(
  class extends Peak {
    face: Face;

    constructor(polyhedron, fIndex) {
      super(
        polyhedron,
        polyhedron.adjacentVertexIndices(...polyhedron.faces[fIndex]),
        'rotunda',
      );
      this.face = polyhedron.getFace(fIndex);
    }

    faceConfiguration = () => ({ '5': 2, '3': 2 });

    topPoint() {
      return this.face.centroid();
    }
  },
);
