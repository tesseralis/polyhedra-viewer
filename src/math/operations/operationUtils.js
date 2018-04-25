// @flow
import _ from 'lodash';
import Polyhedron from 'math/Polyhedron';
import { vec, PRECISION } from 'math/linAlg';
import { numSides } from 'math/solidUtils';
import { VIndex } from 'math/solidTypes';

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
