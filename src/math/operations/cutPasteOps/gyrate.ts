import _ from 'lodash';

import { Vec3D, withOrigin } from 'math/geom';
import { Polyhedron, Cap } from 'math/polyhedra';
import { mapObject } from 'utils';
import { getCapAlignment, getGyrateDirection } from './cutPasteUtils';
import { getTransformedVertices } from '../operationUtils';
import makeOperation from '../makeOperation';

const TAU = 2 * Math.PI;

interface Options {
  cap: Cap;
}

function applyGyrate(polyhedron: Polyhedron, { cap }: Options) {
  // get adjacent faces
  const boundary = cap.boundary();

  // rotate the cupola/rotunda top
  const theta = TAU / boundary.numSides;

  const oldToNew = mapObject(boundary.vertices, (vertex, i) => [
    vertex.index,
    i,
  ]);

  const mockPolyhedron = polyhedron.withChanges(solid =>
    solid.addVertices(boundary.vertices).mapFaces(face => {
      if (face.inSet(cap.faces())) {
        return face;
      }
      return face.vertices.map(v => {
        return v.inSet(boundary.vertices)
          ? polyhedron.numVertices() + oldToNew[v.index]
          : v.index;
      });
    }),
  );

  const endVertices = getTransformedVertices(
    [cap],
    p =>
      withOrigin(p.normalRay(), v => v.getRotatedAroundAxis(p.normal(), theta)),
    mockPolyhedron.vertices,
  );

  // TODO the animation makes the cupola shrink and expand.
  // Make it not do that.
  return {
    animationData: {
      start: mockPolyhedron,
      endVertices,
    },
  };
}

export const gyrate = makeOperation('gyrate', {
  apply: applyGyrate,
  optionTypes: ['cap'],

  resultsFilter(polyhedron, config, relations) {
    const options: any = {};
    const { cap } = config;
    if (!cap) {
      throw new Error('Invalid cap');
    }
    if (_.some(relations, 'direction')) {
      options.direction = getGyrateDirection(polyhedron, cap);
      if (
        _.filter(
          relations,
          relation =>
            relation.direction === options.direction && !!relation.align,
        ).length > 1
      ) {
        options.align = getCapAlignment(polyhedron, cap);
      }
    }
    return options;
  },

  allOptionCombos(polyhedron) {
    return Cap.getAll(polyhedron).map(cap => ({ cap }));
  },

  hitOption: 'cap',
  getHitOption(polyhedron, hitPnt) {
    const cap = Cap.find(polyhedron, hitPnt);
    return cap ? { cap } : {};
  },

  faceSelectionStates(polyhedron, { cap }) {
    const allCapFaces = _.flatMap(Cap.getAll(polyhedron), cap => cap.faces());
    return _.map(polyhedron.faces, face => {
      if (_.isObject(cap) && face.inSet(cap.faces())) return 'selected';
      if (face.inSet(allCapFaces)) return 'selectable';
    });
  },
});
