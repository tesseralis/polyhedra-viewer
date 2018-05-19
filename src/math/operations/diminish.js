// @flow strict
import _ from 'lodash';

import { hasMultiple, removeExtraneousVertices } from './operationUtils';
import { Peak } from 'math/polyhedra';
import type { Operation } from './operationTypes';
import { getPeakAlignment, getCupolaGyrate } from './applyOptionUtils';

function removePeak(polyhedron, peak) {
  return removeExtraneousVertices(
    polyhedron.withChanges(solid =>
      solid.withoutFaces(peak.faces()).addFaces([peak.boundary().vertices]),
    ),
  );
}

interface DiminishOptions {
  peak: Peak;
}

export const diminish: Operation<DiminishOptions> = {
  apply(polyhedron, { peak }) {
    return removePeak(polyhedron, peak);
  },

  getSearchOptions(polyhedron, config, relations) {
    const options = {};
    const { peak } = config;
    if (!peak) {
      throw new Error('Invalid peak');
    }
    const vertices = peak.innerVertices();
    // If diminishing a pentagonal cupola/rotunda, check which one it is
    if (vertices.length === 5) {
      options.using = 'U5';
    } else if (vertices.length === 10) {
      options.using = 'R5';
    }

    if (hasMultiple(relations, 'gyrate')) {
      options.gyrate = getCupolaGyrate(polyhedron, peak);
    }

    if (options.gyrate !== 'ortho' && hasMultiple(relations, 'align')) {
      options.align = getPeakAlignment(polyhedron, peak);
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

  isHighlighted(polyhedron, applyArgs, face) {
    if (_.isObject(applyArgs.peak) && face.inSet(applyArgs.peak.faces())) {
      return true;
    }
  },
};
