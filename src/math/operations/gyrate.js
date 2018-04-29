// @flow
import _ from 'lodash';
import { vec, getCentroid, getNormal } from 'math/linAlg';
import Polyhedron from 'math/Polyhedron';
import Peak from 'math/Peak';
import { numSides } from 'math/solidUtils';
import type { Operation } from './operationTypes';
import { deduplicateVertices } from './operationUtils';
import { mapObject } from 'util.js';
import { getPeakAlignment, getGyrateDirection } from 'math/applyOptionUtils';

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
  const normal = getNormal(boundaryVertices).getNormalized();
  const centroid = getCentroid(boundaryVertices);
  const theta = TAU / numSides(boundary);

  const newBoundaryVertices = boundary.map(
    vIndex => polyhedron.vertices[vIndex],
  );
  const oldToNew = mapObject(boundary, (vIndex, i) => [vIndex, i]);

  // mock faces for animation
  const mockFaces = polyhedron.faces.map((face, fIndex) => {
    if (!_.includes(peak.faceIndices(), fIndex)) {
      return face;
    }
    return face.map((vIndex, i) => {
      return _.includes(boundary, vIndex)
        ? polyhedron.numVertices() + oldToNew[vIndex]
        : vIndex;
    });
  });

  const mockPolyhedron = Polyhedron.of(
    polyhedron.vertices.concat(newBoundaryVertices),
    mockFaces,
  );

  const newVertices = mockPolyhedron.vertices.map((vertex, vIndex) => {
    // FIXME make more elegant
    if (
      _.includes(peak.innerVertexIndices(), vIndex) ||
      vIndex >= polyhedron.numVertices()
    ) {
      return vec(vertex)
        .sub(centroid)
        .getRotatedAroundAxis(normal, theta)
        .add(centroid)
        .toArray();
    }
    return vertex;
  });

  // FIXME something's broken also the interpolation doesn't work cause it's radial fuuuu
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

  isHighlighted(polyhedron, applyArgs, fIndex) {
    if (
      _.isObject(applyArgs.peak) &&
      _.includes(applyArgs.peak.faceIndices(), fIndex)
    ) {
      // return polygonColors(diminishColors)[getColorIndex(face)]
      return true;
    }
  },
};
