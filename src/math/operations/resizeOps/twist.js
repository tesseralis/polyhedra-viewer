// @flow strict
import _ from 'lodash';
import { Polyhedron } from 'math/polyhedra';
import { getTwistSign } from '../operationUtils';
import {
  getSnubAngle,
  getExpandedFaces,
  isExpandedFace,
  getResizedVertices,
  expansionType,
} from './resizeUtils';
import makeOperation from '../makeOperation';

function pivot(list, value) {
  const index = _.indexOf(list, value);
  return [..._.slice(list, index), ..._.slice(list, 0, index)];
}

// TODO deduplicate with turn
function bisectEdgeFaces(expandedFaces, twist) {
  let newFaces = [];
  const found = [];

  _.forEach(expandedFaces, face => {
    _.forEach(face.edges, edge => {
      const twinFace = edge.twinFace();
      if (twinFace.inSet(found)) return;

      const [v1, v2, v3, v4] = pivot(
        _.map(twinFace.vertices, 'index'),
        edge.v2.index,
      );

      const fs =
        twist === 'left'
          ? [[v1, v2, v4], [v2, v3, v4]]
          : [[v1, v2, v3], [v1, v3, v4]];
      newFaces = newFaces.concat(fs);
      found.push(twinFace);
    });
  });

  return expandedFaces[0].polyhedron.withChanges(solid =>
    solid.withoutFaces(found).addFaces(newFaces),
  );
}

function joinEdgeFaces(twistFaces, twist) {
  const newFaces = [];
  const found = [];
  _.forEach(twistFaces, face => {
    _.forEach(face.edges, edge => {
      const edgeFace = edge.twinFace();
      if (edgeFace.inSet(found)) return;

      const [v1, v2] = edge.twin().vertices;
      const [v3, v4] =
        twist === 'left'
          ? edge
              .twin()
              .prev()
              .twin()
              .next().vertices
          : edge
              .twin()
              .next()
              .twin()
              .prev().vertices;

      newFaces.push([v1, v2, v3, v4]);
      const otherFace = (twist === 'left'
        ? edge.twin().prev()
        : edge.twin().next()
      ).twinFace();
      found.push(edgeFace, otherFace);
    });
  });

  return twistFaces[0].polyhedron.withChanges(solid =>
    solid.withoutFaces(found).addFaces(newFaces),
  );
}

// TODO deduplicate with expand/contract
function doTwist(polyhedron, referenceName, twist = 'left') {
  const reference = Polyhedron.get(referenceName);
  const isSnub = expansionType(polyhedron) === 'snub';
  const f0 = polyhedron.largestFace();
  const n = f0.numSides;
  const twistFaces = getExpandedFaces(polyhedron, n);

  const referenceFace =
    _.find(reference.faces, face => isExpandedFace(reference, face, n)) ||
    reference.getFace();
  const referenceLength =
    (referenceFace.distanceToCenter() / reference.edgeLength()) *
    polyhedron.edgeLength();

  const refFaces = getExpandedFaces(reference, n);
  const angle = !isSnub
    ? getTwistSign(twist) * Math.abs(getSnubAngle(reference, refFaces))
    : -getSnubAngle(polyhedron, twistFaces);
  const snubTwist = angle > 0 ? 'left' : 'right';

  const duplicated = isSnub
    ? polyhedron
    : bisectEdgeFaces(twistFaces, snubTwist);
  const endVertices = getResizedVertices(twistFaces, referenceLength, angle);

  return {
    animationData: {
      start: duplicated,
      endVertices,
    },
    result: isSnub
      ? joinEdgeFaces(twistFaces, snubTwist).withVertices(endVertices)
      : undefined,
  };
}

export const twist = makeOperation('twist', {
  apply(polyhedron, { twist: twistOpt }, result) {
    return doTwist(polyhedron, result, twistOpt);
  },
  optionTypes: ['twist'],
  allOptionCombos(polyhedron) {
    if (expansionType(polyhedron) !== 'snub') {
      return [{ twist: 'left' }, { twist: 'right' }];
    }
    return [{}];
  },
});
