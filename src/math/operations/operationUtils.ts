import _ from 'lodash';
import { Twist } from 'types';
import {
  Polyhedron,
  Vertex,
  Edge,
  VertexList,
  VertexArg,
} from 'math/polyhedra';
import { Vec3D, Transform } from 'math/geom';
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
    .map(v => polyhedron.vertices[_.get(oldToNew, v.index, v.index) as any])
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

export function getTwistSign(twist?: Twist) {
  switch (twist) {
    case 'left':
      return 1;
    case 'right':
      return -1;
    default:
      return 0;
  }
}

// Return the indices required to create faces when duplicating vertices
// along an edge
export function getEdgeFacePaths(edge: Edge, twist?: Twist) {
  const [v1, v2] = _.map(edge.vertices, 'index');
  const [f1, f2] = _.map(edge.adjacentFaces(), 'index');
  switch (twist) {
    case 'left':
      return [
        [[f1, v1], [f2, v2], [f1, v2]], // face 1
        [[f1, v1], [f2, v1], [f2, v2]], // face 2
      ];
    case 'right':
      return [
        [[f1, v2], [f1, v1], [f2, v1]], // face 1
        [[f2, v1], [f2, v2], [f1, v2]], // face 2
      ];
    default:
      return [[[f1, v2], [f1, v1], [f2, v1], [f2, v2]]];
  }
}

export function getTransformedVertices<T extends VertexList>(
  vLists: T[],
  iteratee: (key: T) => Transform | Vec3D,
  vertices: Vertex[] = vLists[0].polyhedron.vertices,
) {
  const result: VertexArg[] = [...vertices];
  _.forEach(vLists, vList => {
    _.forEach(vList.vertices, v => {
      const t = iteratee(vList);
      result[v.index] = typeof t === 'function' ? t(v.vec) : t;
    });
  });
  return result;
}
