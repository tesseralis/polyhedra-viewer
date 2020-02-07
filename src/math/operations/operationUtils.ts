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

export function expandEdges(
  polyhedron: Polyhedron,
  edges: Edge[],
  twist?: Twist,
) {
  // Collect the list of vertices that are connected to the extruding edges
  interface VE {
    vertex: Vertex;
    edges: Edge[];
  }
  const vertsToDupe: Record<string, VE> = {};
  for (let edge of edges) {
    if (!vertsToDupe[edge.v1.index]) {
      vertsToDupe[edge.v1.index] = {
        vertex: edge.v1,
        edges: [],
      };
    }
    vertsToDupe[edge.v1.index].edges.push(edge);

    if (!vertsToDupe[edge.v2.index]) {
      vertsToDupe[edge.v2.index] = {
        vertex: edge.v2,
        edges: [],
      };
    }
    vertsToDupe[edge.v2.index].edges.push(edge.twin());
  }

  // maps old vertices to new vertices
  const newFaces: number[][] = [];

  // maps old vertices to faces to vertices
  const v2fMap = polyhedron.faces.map(f => [] as number[][]);

  // maps old vertices to new vertex edges
  const v2eMap = polyhedron.vertices.map(v => [] as number[][]);

  const newVertices = polyhedron.vertices.map(v => v.vec);
  // create a new vertex and return its index
  function newVertex(value: Vertex) {
    newVertices.push(value.vec);
    return newVertices.length - 1;
  }

  // For each changed vertex:
  // 1. duplicate it some number of times
  // 2. keep track of the edges/faces that are mapped to it
  _.forEach(vertsToDupe, ({ vertex: v, edges }) => {
    const adjFaces = v.adjacentFaces();
    // If there is only one adjacent edge
    if (edges.length === 1) {
      // FIXME this should work on antiprisms, crap
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
      // If there are two edges, do one duplicationg
      const vIndex2 = newVertex(v);
      // v2vMap[v.index].push(vIndex2);

      // split into two "sides", picking one or the other based on the side

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

  return polyhedron.withChanges(
    solid =>
      solid
        .withVertices(newVertices)
        .mapFaces(f =>
          _.flatMap(f.vertices, v => v2fMap[f.index][v.index] ?? v.index),
        )
        .addFaces(
          _.flatMap(edges, e => {
            const [vi1, vi2] = v2eMap[e.v1.index][e.v2.index];
            const [vi3, vi4] = v2eMap[e.v2.index][e.v1.index];
            // TODO handle twists
            switch (twist) {
              case 'left':
                // v1 - v4
                // |  \ |
                // v2 - v3
                return [
                  [vi1, vi2, vi3],
                  [vi1, vi3, vi4],
                ];
              case 'right':
                // v1 - v4
                // |  / |
                // v2 - v3
                return [
                  [vi1, vi2, vi4],
                  [vi2, vi3, vi4],
                ];
              default:
                // v1 - v4
                // |    |
                // v2 - v3
                return [[vi1, vi2, vi3, vi4]];
            }
          }),
        )
        .addFaces(newFaces),
    // TODO handle adding faces
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
