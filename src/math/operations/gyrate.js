// @flow
import _ from 'lodash';
import { getNormalRay, rotateAround } from 'math/linAlg';
import { Peak } from 'math/polyhedra';
import type { Operation } from './operationTypes';
import { mapObject } from 'util.js';
import { getPeakAlignment, getGyrateDirection } from './applyOptionUtils';

const TAU = 2 * Math.PI;

interface GyrateOptions {
  peak: Peak;
}

function applyGyrate(polyhedron, { peak }) {
  // get adjacent faces
  const boundary = peak.boundary();

  // rotate the cupola/rotunda top
  const boundaryVectors = _.map(boundary, 'vec');
  const normalRay = getNormalRay(boundaryVectors);
  const theta = TAU / boundary.length;

  const newboundary = _.map(boundary, 'value');
  const oldToNew = mapObject(boundary, (vertex, i) => [vertex.index, i]);

  // mock faces for animation
  const newFaces = polyhedron.faces.map(face => {
    if (!face.inSet(peak.faces())) {
      return face.vIndices();
    }
    return face.vertices.map(v => {
      return v.inSet(boundary)
        ? polyhedron.numVertices() + oldToNew[v.index]
        : v.index;
    });
  });

  const mockPolyhedron = polyhedron
    .addVertices(newboundary)
    .withFaces(newFaces);

  const endVertices = mockPolyhedron.vertices.map((v, vIndex) => {
    if (
      _.includes(_.map(peak.innerVertices(), 'index'), v.index) ||
      v.index >= polyhedron.numVertices()
    ) {
      return rotateAround(v.vec, normalRay, theta);
    }
    return v.vec;
  });

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
    // FIXME can we not rely on relations?
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
    const peak = polyhedron.findPeak(hitPnt);
    return peak ? { peak } : {};
  },

  isHighlighted(polyhedron, applyArgs, face) {
    if (_.isObject(applyArgs.peak) && face.inSet(applyArgs.peak.faces())) {
      return true;
    }
  },
};
