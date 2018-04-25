import _ from 'lodash';
import { getBoundary } from './solidUtils';

const withMapper = property => Base =>
  class extends Base {
    static getAll(polyhedron) {
      return (_.isFunction(polyhedron[property])
        ? polyhedron[property]()
        : polyhedron[property]
      )
        .map(arg => new Base(polyhedron, arg))
        .filter(peak => peak.isValid());
    }
  };

export default class Peak {
  static getAll(polyhedron) {
    const pyramids = Pyramid.getAll(polyhedron);
    if (pyramids.length > 0) return pyramids;

    const fastigium = Fastigium.getAll(polyhedron);
    if (fastigium.length > 0) return fastigium;

    const cupolaRotunda = Cupola.getAll(polyhedron).concat(
      Rotunda.getAll(polyhedron)
    );
    if (cupolaRotunda.length > 0) return cupolaRotunda;
    return [];
  }

  constructor(polyhedron, vIndices, type) {
    this.polyhedron = polyhedron;
    this.vIndices = vIndices;
    this.type = type;
  }

  innerVertexIndices() {
    return this.vIndices;
  }

  topPoint() {}

  faceConfiguration() {}

  faceIndices = _.memoize(() => {
    return this.polyhedron.adjacentFaceIndices(...this.innerVertexIndices());
  });

  faces = _.memoize(() => {
    return this.polyhedron.adjacentFaces(...this.innerVertexIndices());
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
    constructor(polyhedron, vIndex) {
      super(polyhedron, [vIndex], 'pyramid');
      this.vIndex = vIndex;
    }

    faceConfiguration = () => ({ 3: this.faces().length });

    topPoint() {
      return this.polyhedron.vertices[this.vIndex];
    }
  }
);

const Fastigium = withMapper('edges')(
  class extends Peak {
    constructor(polyhedron, edge) {
      super(polyhedron, edge, 'fastigium');
      this.edge = edge;
    }

    faceConfiguration = () => ({ 3: 1, 4: 2 });

    topPoint() {
      const [v1, v2] = this.edge.map(v => this.polyhedron.vertexVectors()[v]);
      const midpoint = v1.add(v2).scale(0.5);
      return midpoint.toArray();
    }
  }
);

const Cupola = withMapper('fIndices')(
  class extends Peak {
    constructor(polyhedron, fIndex) {
      super(polyhedron, polyhedron.faces[fIndex], 'cupola');
      this.fIndex = fIndex;
    }

    faceConfiguration = () =>
      _.countBy([3, 4, 4, this.innerVertexIndices().length]);

    topPoint() {
      return this.polyhedron.faceCentroid(this.fIndex);
    }
  }
);

const Rotunda = withMapper('fIndices')(
  class extends Peak {
    constructor(polyhedron, fIndex) {
      super(
        polyhedron,
        polyhedron.adjacentVertexIndices(...polyhedron.faces[fIndex]),
        'rotunda'
      );
      this.fIndex = fIndex;
    }

    faceConfiguration = () => ({ 5: 2, 3: 2 });

    topPoint() {
      return this.polyhedron.faceCentroid(this.fIndex);
    }
  }
);
