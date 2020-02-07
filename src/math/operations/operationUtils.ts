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
import { getCyclic } from 'utils';
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

/**
 * Get the expansion face arrangement for the given vertices
 * @param vs the four vertex indices to arrange
 * @param twist the pattern to arrange: left | right for two triangles, square by default
 */
function getEdgeFaces<V>([v1, v2, v3, v4]: V[], twist?: Twist) {
  switch (twist) {
    case 'left':
      // v1 - v4
      // |  \ |
      // v2 - v3
      return [
        [v1, v2, v3],
        [v1, v3, v4],
      ];
    case 'right':
      // v1 - v4
      // |  / |
      // v2 - v3
      return [
        [v1, v2, v4],
        [v2, v3, v4],
      ];
    default:
      // v1 - v4
      // |    |
      // v2 - v3
      return [[v1, v2, v3, v4]];
  }
}

export function expandEdges(
  polyhedron: Polyhedron,
  edges: Edge[],
  twist?: Twist,
) {
  // Collect the list of vertices that are connected to the extruding edges
  const vertsToDupe = polyhedron.vertices.map<Edge[]>(v => []);
  for (let edge of edges) {
    vertsToDupe[edge.v1.index].push(edge);
    vertsToDupe[edge.v2.index].push(edge.twin());
  }

  // Use to keep track of any other new faces that are created
  const newFaces: number[][] = [];

  // Keep track of the new vIndices that each face and edge should be mapped to
  const v2fMap = polyhedron.faces.map<number[][]>(f => []);
  const v2eMap = polyhedron.vertices.map<[number, number][]>(v => []);

  const newVertices = polyhedron.vertices.map(v => v.vec);
  // create a new vertex and return its index
  function newVertex(value: Vertex) {
    newVertices.push(value.vec);
    return newVertices.length - 1;
  }

  // For each changed vertex:
  // 1. duplicate it some number of times
  // 2. keep track of the edges/faces that are mapped to it
  _.forEach(vertsToDupe, edges => {
    // If the vertex isn't associated with any edges, do nothing
    if (!edges.length) return;

    const v = edges[0].v1;
    const adjFaces = v.adjacentFaces();
    // If there is only one adjacent edge
    if (edges.length === 1) {
      if (adjFaces.length === 3) {
        // If the vertex has an odd number of faces, add a new side to the middle face
        const vIndex2 = newVertex(v);

        const edge = edges[0];
        const oppFace = edge.prev().twinFace();

        //          /
        //        v/
        // ===e====  oppFace
        //       v2\
        //          \

        v2fMap[edge.face.index][v.index] = [vIndex2];
        v2fMap[oppFace.index][v.index] = [v.index, vIndex2];
        v2fMap[edge.twinFace().index][v.index] = [v.index];
        v2eMap[v.index][edge.v2.index] = [vIndex2, v.index];
      } else {
        // If it has an even number of faces, create a new triangle face
        // TODO implement this
        throw new Error(
          'this type of extension not supported yet: single edge at vertex with even number of adjacent faces',
        );
      }
    } else if (edges.length === 2) {
      // If there are two edges, do one duplication
      const vIndex2 = newVertex(v);

      // split into two "sides", picking one or the other based which side of the edges
      // we fall across

      //          |
      //          v2
      // ===e1====:===e2====
      //          v
      //          |
      const [e1, e2] = edges;
      v2eMap[v.index][e1.v2.index] = [v.index, vIndex2];
      v2eMap[v.index][e2.v2.index] = [vIndex2, v.index];
      let e = e1;
      while (!e.equals(e2)) {
        v2fMap[e.face.index][v.index] = [v.index];
        e = e.prev().twin();
      }
      while (!e.equals(e1)) {
        v2fMap[e.face.index][v.index] = [vIndex2];
        e = e.prev().twin();
      }
    } else {
      if (v.adjacentFaces().length !== edges.length) {
        throw new Error(
          'If there are more than two edges per vertex, all edges of the vertex must be in the list',
        );
      }

      const newIndices = _.times(edges.length - 1, () => newVertex(v));
      const vIndices = [v.index, ...newIndices];
      newFaces.push(vIndices);

      // get in-order list of adjacent edges
      const adjEdges = v.adjacentEdges();
      //          /e2
      //       v0/
      // ---e0--- v2
      //       v1\
      //          \e1
      vIndices.forEach((vIndex, i) => {
        const e = adjEdges[i];
        v2eMap[v.index][e.v2.index] = [vIndex, getCyclic(vIndices, i - 1)];
        v2fMap[e.face.index][v.index] = [vIndex];
      });
    }
  });

  return polyhedron.withChanges(solid =>
    solid
      .withVertices(newVertices)
      .mapFaces(f =>
        _.flatMap(f.vertices, v => v2fMap[f.index][v.index] ?? v.index),
      )
      .addFaces(
        _.flatMap(edges, e => {
          const { v1, v2 } = e;
          return getEdgeFaces(
            [...v2eMap[v1.index][v2.index], ...v2eMap[v2.index][v1.index]],
            twist,
          );
        }),
      )
      .addFaces(newFaces),
  );
}

/**
 * Apply a transformation per vertex list. This function allows transformations like
 * "blow up these faces away from a center point" or "expand these faces out radially".
 *
 * @param vLists The list of `VertexList`s to apply transformations to
 * @param iteratee the function to apply on each `VertexList` to generate a transform.
 * The function can either return a transform or a single vector value.
 * @param vertices The list of vertices to transform and return.
 * This defaults to the vertices of the polyhedron attached to the first `VertexList`.
 */
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
