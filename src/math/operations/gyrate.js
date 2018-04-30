// @flow
import _ from 'lodash';
import { getNormalRay, rotateAround } from 'math/linAlg';
import { Polyhedron, Peak } from 'math/polyhedra';
import type { Operation } from './operationTypes';
import { deduplicateVertices } from './operationUtils';
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
  const boundaryVertices = boundary.map(
    vIndex => polyhedron.vertexVectors()[vIndex],
  );
  const normalRay = getNormalRay(boundaryVertices);
  const theta = TAU / boundary.length;

  const newBoundaryVertices = boundary.map(
    vIndex => polyhedron.vertices[vIndex],
  );
  const oldToNew = mapObject(boundary, (vIndex, i) => [vIndex, i]);

  // mock faces for animation
  const mockFaces = polyhedron.getFaces().map(face => {
    if (!face.inSet(peak.faces())) {
      return face.vIndices();
    }
    return face.vIndices().map((vIndex, i) => {
      return _.includes(boundary, vIndex)
        ? polyhedron.numVertices() + oldToNew[vIndex]
        : vIndex;
    });
  });

  const mockPolyhedron = Polyhedron.of(
    polyhedron.vertices.concat(newBoundaryVertices),
    mockFaces,
  );

  const newVertices = mockPolyhedron.vertexVectors().map((v, vIndex) => {
    if (
      _.includes(peak.innerVertexIndices(), vIndex) ||
      vIndex >= polyhedron.numVertices()
    ) {
      return rotateAround(v, normalRay, theta).toArray();
    }
    return v.toArray();
  });

  // FIXME the interpolation doesn't work cause it's radial
  return {
    animationData: {
      start: mockPolyhedron,
      endVertices: newVertices,
    },
    result: deduplicateVertices(mockPolyhedron.withVertices(newVertices)),
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
