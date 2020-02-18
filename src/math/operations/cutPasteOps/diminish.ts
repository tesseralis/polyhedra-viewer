import _ from 'lodash';

import { mapObject } from 'utils';
import {
  getTransformedVertices,
  removeExtraneousVertices,
} from '../operationUtils';
import makeOperation from '../makeOperation';
import { Polyhedron, Cap } from 'math/polyhedra';
import { hasMultiple, getCapAlignment, getCupolaGyrate } from './cutPasteUtils';

function removeCap(polyhedron: Polyhedron, cap: Cap) {
  const boundary = cap.boundary();
  const oldToNew = mapObject(boundary.vertices, (vertex, i) => [
    vertex.index,
    i,
  ]);
  const mockPolyhedron = polyhedron.withChanges(s =>
    s
      .addVertices(boundary.vertices)
      .mapFaces(face => {
        if (face.inSet(cap.faces())) {
          return face;
        }
        return face.vertices.map(v => {
          return v.inSet(boundary.vertices)
            ? polyhedron.numVertices() + oldToNew[v.index]
            : v.index;
        });
      })
      .addFaces([
        _.range(
          polyhedron.numVertices(),
          polyhedron.numVertices() + boundary.numSides,
        ),
      ]),
  );

  const endVertices = getTransformedVertices(
    [cap],
    p => boundary.centroid(),
    mockPolyhedron.vertices,
  );

  return {
    animationData: {
      start: mockPolyhedron,
      endVertices,
    },
    result: removeExtraneousVertices(
      polyhedron.withChanges(s =>
        s.withoutFaces(cap.faces()).addFaces([cap.boundary().vertices]),
      ),
    ),
  };
}

interface Options {
  cap: Cap;
}
export const diminish = makeOperation<Options>('diminish', {
  apply(polyhedron, { cap }) {
    return removeCap(polyhedron, cap);
  },
  optionTypes: ['cap'],

  resultsFilter(polyhedron, config, relations) {
    const options: Record<string, string> = {};
    const { cap } = config;
    if (!cap) {
      throw new Error('Invalid cap');
    }
    const vertices = cap.innerVertices();
    // If diminishing a pentagonal cupola/rotunda, check which one it is
    if (vertices.length === 5) {
      options.using = 'U5';
    } else if (vertices.length === 10) {
      options.using = 'R5';
    }

    if (hasMultiple(relations, 'gyrate')) {
      options.gyrate = getCupolaGyrate(polyhedron, cap);
    }

    if (options.gyrate !== 'ortho' && hasMultiple(relations, 'align')) {
      options.align = getCapAlignment(polyhedron, cap);
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
      if (cap instanceof Cap && face.inSet(cap.faces())) return 'selected';
      if (face.inSet(allCapFaces)) return 'selectable';
    });
  },
});
