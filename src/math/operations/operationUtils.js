// @flow
import _ from 'lodash';
import Polyhedron from 'math/Polyhedron';
import { PRECISION, getMidpoint, getPlane, rotateAround } from 'math/linAlg';
import { numSides } from 'math/solidUtils';
import { VIndex, FIndex } from 'math/solidTypes';

export const hasMultiple = (relations: any, property: any) =>
  _(relations)
    .map(property)
    .uniq()
    .compact()
    .value().length > 1;

// Remove vertices (and faces) from the polyhedron when they are all the same
export function deduplicateVertices(polyhedron: Polyhedron) {
  // group vertex indices by same
  const vertices = polyhedron.vertexVectors();
  const points = [];
  const verticesByPoint = {};
  _.forEach(vertices, (vertex, index: VIndex) => {
    const pointIndex = _.findIndex(points, point =>
      vertex.equalsWithTolerance(point, PRECISION),
    );
    if (pointIndex === -1) {
      points.push(vertex);
      verticesByPoint[points.length - 1] = [index];
    } else {
      verticesByPoint[pointIndex].push(index);
    }
  });

  // replace vertices that are the same
  let newFaces = polyhedron.faces;
  _.forEach(verticesByPoint, groupedVertices => {
    if (groupedVertices.length <= 1) return;
    newFaces = newFaces.map(face =>
      face.map(
        vertex =>
          _.includes(groupedVertices, vertex) ? groupedVertices[0] : vertex,
      ),
    );
  });
  // remove vertices in faces and extraneous faces
  newFaces = newFaces.map(_.uniq).filter(face => numSides(face) >= 3);

  // remove extraneous vertices
  return removeExtraneousVertices(polyhedron.withFaces(newFaces));
}

/**
 * Remove vertices in the polyhedron that aren't connected to any faces,
 * and remap the faces to the smaller indices
 */
export function removeExtraneousVertices(polyhedron: Polyhedron) {
  const { vertices, faces } = polyhedron;
  // Vertex indices to remove
  const toRemove = _.difference(polyhedron.vIndices(), _.flatMap(faces));
  const numToRemove = toRemove.length;

  // Map the `numToRemove` last vertices of the polyhedron (that don't overlap)
  // to the first few removed vertices
  const newToOld = _(polyhedron.vIndices())
    .takeRight(numToRemove)
    .difference(toRemove)
    .map((vIndex, i) => [vIndex, toRemove[i]])
    .fromPairs()
    .value();
  const oldToNew = _.invert(newToOld);

  const newVertices = _(vertices)
    .map((vertex, vIndex) => vertices[_.get(oldToNew, vIndex, vIndex)])
    .dropRight(numToRemove)
    .value();
  const newFaces = faces.map(face =>
    face.map((vIndex: VIndex) => _.get(newToOld, vIndex, vIndex)),
  );
  return Polyhedron.of(newVertices, newFaces);
}

export function getResizedVertices(
  polyhedron: Polyhedron,
  fIndices: FIndex[],
  resizedLength: number,
  angle: number = 0,
) {
  // Update the vertices with the expanded-out version
  const f0 = fIndices[0];
  const sideLength = polyhedron.edgeLength(f0);
  const baseLength = polyhedron.distanceToCenter(f0) / sideLength;
  const result = [...polyhedron.vertices];
  _.forEach(fIndices, fIndex => {
    const normal = polyhedron.faceNormal(fIndex);
    const expandFace = polyhedron.faces[fIndex];
    _.forEach(expandFace, vIndex => {
      const vertex = polyhedron.vertexVectors()[vIndex];
      const rotated =
        angle === 0
          ? vertex
          : rotateAround(vertex, polyhedron.normalRay(fIndex), angle);
      const scale = (resizedLength - baseLength) * sideLength;
      result[vIndex] = rotated.add(normal.scale(scale)).toArray();
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
  fIndex: FIndex,
  nSides?: number,
) {
  const type = expansionType(polyhedron);
  if (nSides && polyhedron.numSides(fIndex) !== nSides) return false;
  if (!polyhedron.isFaceValid(fIndex)) return false;
  return _.every(
    polyhedron.faceGraph()[fIndex],
    fIndex2 => polyhedron.numSides(fIndex2) === edgeShape[type],
  );
}

export function getSnubAngle(polyhedron: Polyhedron, numSides: number) {
  const f0 =
    _.find(polyhedron.fIndices(), fIndex =>
      isExpandedFace(polyhedron, fIndex, numSides),
    ) || 0;
  const face0 = polyhedron.faces[f0];

  const faceCentroid = polyhedron.faceCentroid(f0);
  const snubFaceIndices = _.filter(
    polyhedron.fIndices(),
    fIndex =>
      isExpandedFace(polyhedron, fIndex, numSides) &&
      !_.includes(polyhedron.adjacentFaceIndices(...face0), fIndex),
  );
  const [v0, v1] = polyhedron.vertexVectors(face0);
  const midpoint = getMidpoint(v0, v1);
  const f1 = _.minBy(snubFaceIndices, fIndex =>
    midpoint.distanceTo(polyhedron.faceCentroid(fIndex)),
  );
  const plane = getPlane([
    faceCentroid,
    polyhedron.faceCentroid(f1),
    polyhedron.centroid(),
  ]);
  const projected = plane.getProjectedPoint(midpoint);

  const angle = midpoint
    .sub(faceCentroid)
    .angleBetween(projected.sub(faceCentroid), true);

  // This always ensures the same chirality for everything
  return numSides === 3 ? angle : -angle;
}
