// @flow strict
import _ from 'lodash';

import { flatMap } from 'util.js';
import { withOrigin } from 'math/linAlg';
import { Peak } from 'math/polyhedra';
import type { Operation } from '../operationTypes';
import { mapObject } from 'util.js';
import { getPeakAlignment, getGyrateDirection } from './cutPasteUtils';
import { getTransformedVertices } from '../operationUtils';

const TAU = 2 * Math.PI;

interface GyrateOptions {
  peak: Peak;
}

function applyGyrate(polyhedron, { peak }) {
  // get adjacent faces
  const boundary = peak.boundary();

  // rotate the cupola/rotunda top
  const theta = TAU / boundary.numSides;

  const oldToNew = mapObject(boundary.vertices, (vertex, i) => [
    vertex.index,
    i,
  ]);

  const mockPolyhedron = polyhedron.withChanges(solid =>
    solid.addVertices(boundary.vertices).mapFaces(face => {
      if (face.inSet(peak.faces())) {
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
    [peak],
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

export const gyrate: Operation<GyrateOptions> = {
  apply: applyGyrate,

  getSearchOptions(polyhedron, config, relations) {
    const options = {};
    const { peak } = config;
    if (!peak) {
      throw new Error('Invalid peak');
    }
    // TODO can we not rely on relations?
    if (_.some(relations, 'direction')) {
      options.direction = getGyrateDirection(polyhedron, peak);
      if (
        _.filter(
          relations,
          relation =>
            relation.direction === options.direction && !!relation.align,
        ).length > 1
      ) {
        options.align = getPeakAlignment(polyhedron, peak);
      }
    }
    return options;
  },

  getAllApplyArgs(polyhedron) {
    return Peak.getAll(polyhedron).map(peak => ({ peak }));
  },

  getApplyArgs(polyhedron, hitPnt) {
    const peak = Peak.find(polyhedron, hitPnt);
    return peak ? { peak } : {};
  },

  getSelectState(polyhedron, { peak }) {
    const allPeakFaces = flatMap(Peak.getAll(polyhedron), peak => peak.faces());
    return _.map(polyhedron.faces, face => {
      if (_.isObject(peak) && face.inSet(peak.faces())) return 'selected';
      if (face.inSet(allPeakFaces)) return 'selectable';
    });
  },
};
