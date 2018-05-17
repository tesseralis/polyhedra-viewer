// @flow
import _ from 'lodash';
import { Polyhedron, Face } from 'math/polyhedra';
import { PRECISION, getPlane, rotateAround } from 'math/linAlg';

export const hasMultiple = (relations: any, property: any) =>
  _(relations)
    .map(property)
    .uniq()
    .compact()
    .value().length > 1;

// Remove vertices (and faces) from the polyhedron when they are all the same
export function deduplicateVertices(polyhedron: Polyhedron) {
  // group vertex indices by same
  const unique = [];
  const oldToNew = {};

  _.forEach(polyhedron.vertices, (v, vIndex: number) => {
    const match = _.find(unique, point =>
      v.vec.equalsWithTolerance(point.vec, PRECISION),
    );
    if (match === undefined) {
      unique.push(v);
      oldToNew[vIndex] = vIndex;
    } else {
      oldToNew[vIndex] = match.index;
    }
  });

  // replace vertices that are the same
  // TODO create a filterFaces method?
  let newFaces = _(polyhedron.faces)
    .map(face => _.uniq(face.vertices.map(v => oldToNew[v.index])))
    .filter(vIndices => vIndices.length >= 3)
    .value();

  // remove extraneous vertices
  return removeExtraneousVertices(
    polyhedron.withChanges(s => s.withFaces(newFaces)),
  );
}

/**
 * Remove vertices in the polyhedron that aren't connected to any faces,
 * and remap the faces to the smaller indices
 */
export function removeExtraneousVertices(polyhedron: Polyhedron) {
  // Vertex indices to remove
  const vertsInFaces = _.flatMap(polyhedron.faces, 'vertices');
  const toRemove = _.filter(polyhedron.vertices, v => !v.inSet(vertsInFaces));
  const numToRemove = toRemove.length;

  // Map the `numToRemove` last vertices of the polyhedron (that don't overlap)
  // to the first few removed vertices
  const newToOld = _(polyhedron.vertices)
    .takeRight(numToRemove)
    .filter(v => !v.inSet(toRemove))
    .map((v, i) => [v.index, toRemove[i].index])
    .fromPairs()
    .value();
  const oldToNew = _.invert(newToOld);

  const newVertices = _(polyhedron.vertices)
    .map(v => polyhedron.vertices[_.get(oldToNew, v.index, v.index)])
    .dropRight(numToRemove)
    .value();

  return polyhedron.withChanges(solid =>
    solid
      .withVertices(newVertices)
      .mapFaces(face =>
        _.map(face.vertices, v => _.get(newToOld, v.index, v.index)),
      ),
  );
}

export function getResizedVertices(
  polyhedron: Polyhedron,
  faces: Face[],
  resizedLength: number,
  angle: number = 0,
) {
  // Update the vertices with the expanded-out version
  const f0 = faces[0];
  const sideLength = f0.sideLength();
  const baseLength = f0.distanceToCenter() / sideLength;
  const result = [...polyhedron.vertices];
  _.forEach(faces, face => {
    const normal = face.normal();
    _.forEach(face.vertices, v => {
      const rotated =
        angle === 0 ? v.vec : rotateAround(v.vec, face.normalRay(), angle);
      const scale = (resizedLength - baseLength) * sideLength;
      result[v.index] = rotated.add(normal.scale(scale));
    });
  });
  return result;
}

type ExpansionType = 'cantellate' | 'snub';

export function expansionType(polyhedron: Polyhedron): ExpansionType {
  return _.includes([20, 38, 92], polyhedron.numFaces())
    ? 'snub'
    : 'cantellate';
}

const edgeShape = {
  snub: 3,
  cantellate: 4,
};

export function isExpandedFace(
  polyhedron: Polyhedron,
  face: Face,
  nSides?: number,
) {
  const type = expansionType(polyhedron);
  if (nSides && face.numSides !== nSides) return false;
  if (!face.isValid()) return false;
  return _.every(face.adjacentFaces(), { numSides: edgeShape[type] });
}

export function getSnubAngle(polyhedron: Polyhedron, numSides: number) {
  const face0 =
    _.find(polyhedron.faces, face =>
      isExpandedFace(polyhedron, face, numSides),
    ) || polyhedron.getFace();

  const face0AdjacentFaces = face0.vertexAdjacentFaces();
  const faceCentroid = face0.centroid();
  const faceNormal = face0.normal();
  const snubFaces = _.filter(
    polyhedron.faces,
    face =>
      isExpandedFace(polyhedron, face, numSides) &&
      !face.inSet(face0AdjacentFaces),
  );
  const midpoint = face0.edges[0].midpoint();
  const face1 = _.minBy(snubFaces, face =>
    midpoint.distanceTo(face.centroid()),
  );
  const plane = getPlane([
    faceCentroid,
    face1.centroid(),
    polyhedron.centroid(),
  ]);
  const normMidpoint = midpoint.sub(faceCentroid);
  const projected = plane.getProjectedPoint(midpoint).sub(faceCentroid);
  const angle = normMidpoint.angleBetween(projected, true);
  // Return a positive angle if it's a ccw turn, a negative angle otherwise
  const sign = normMidpoint
    .cross(projected)
    .getNormalized()
    .equalsWithTolerance(faceNormal, PRECISION)
    ? -1
    : 1;
  return angle * sign;
}
