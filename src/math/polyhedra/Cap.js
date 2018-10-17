// @flow strict

import _ from 'lodash';

import { flatMapUniq } from 'utils';
import { Vec3D } from 'math/geom';
import Polyhedron from './Polyhedron';
import Face from './Face';
import Vertex, { VertexList } from './Vertex';
import Edge from './Edge';
import VEList from './VEList';

type CapType = 'pyramid' | 'cupola' | 'rotunda' | 'fastigium' | 'prism';
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
  return new VEList(_.map(result, 'v1'), result);
}

const withMapper = property => Base =>
  class extends Base {
    static getAll(polyhedron: Polyhedron) {
      const mapper = _.get(polyhedron, property);
      return (typeof mapper === 'function' ? mapper() : mapper)
        .map(arg => new Base(polyhedron, arg))
        .filter(cap => cap.isValid());
    }
  };

export default class Cap implements VertexList {
  polyhedron: Polyhedron;
  _innerVertices: Vertex[];
  type: CapType;
  topPoint: Vec3D;
  faceConfiguration: FaceConfiguration;

  static find(polyhedron: Polyhedron, hitPoint: Vec3D) {
    const hitFace = polyhedron.hitFace(hitPoint);
    const caps = Cap.getAll(polyhedron).filter(cap =>
      hitFace.inSet(cap.faces()),
    );
    if (caps.length === 0) {
      return null;
    }
    return _.minBy(caps, cap => cap.topPoint.distanceTo(hitPoint));
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

  constructor(
    polyhedron: Polyhedron,
    innerVertices: Vertex[],
    type: CapType,
    topPoint: Vec3D,
    faceConfiguration: FaceConfiguration,
  ) {
    this.polyhedron = polyhedron;
    this._innerVertices = innerVertices;
    this.type = type;
    this.topPoint = topPoint;
    this.faceConfiguration = faceConfiguration;
  }

  innerVertices() {
    return this._innerVertices;
  }

  get vertices() {
    return this.allVertices();
  }

  allVertices = _.once(() => {
    return _.concat(this.innerVertices(), this.boundary().vertices);
  });

  faces = _.once(() => {
    return flatMapUniq(this.innerVertices(), v => v.adjacentFaces(), 'index');
  });

  boundary = _.once(() => {
    return getBoundary(this.faces());
  });

  normal() {
    return this.boundary().normal();
  }

  normalRay() {
    return this.boundary().normalRay();
  }

  isValid() {
    const matchFaces = _.every(this.innerVertices(), vertex => {
      const faceCount = _.countBy(vertex.adjacentFaces(), 'numSides');
      return _.isEqual(faceCount, this.faceConfiguration);
    });
    return (
      matchFaces &&
      _.every(this.faces(), face => face.isValid()) &&
      this.boundary().isPlanar()
    );
  }

  withPolyhedron(other: Polyhedron) {
    return Cap.find(other, this.topPoint);
  }
}
const Pyramid = withMapper('vertices')(
  class extends Cap {
    constructor(polyhedron, vertex) {
      super(polyhedron, [vertex], 'pyramid', vertex.vec, {
        '3': vertex.adjacentEdges().length,
      });
    }
  },
);

const Fastigium = withMapper('edges')(
  class extends Cap {
    constructor(polyhedron, edge) {
      const config = { '3': 1, '4': 2 };
      super(polyhedron, edge.vertices, 'fastigium', edge.midpoint(), config);
    }
  },
);

const Cupola = withMapper('faces')(
  class extends Cap {
    constructor(polyhedron, face) {
      super(
        polyhedron,
        face.vertices,
        'cupola',
        face.centroid(),
        _.countBy([3, 4, 4, face.numSides]),
      );
    }
  },
);

const Rotunda = withMapper('faces')(
  class extends Cap {
    constructor(polyhedron, face) {
      super(
        polyhedron,
        flatMapUniq(face.vertices, v => v.adjacentVertices(), 'index'),
        'rotunda',
        face.centroid(),
        { '5': 2, '3': 2 },
      );
    }
  },
);
