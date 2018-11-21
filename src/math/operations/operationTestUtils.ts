import _ from 'lodash';
import { PRECISION } from 'math/geom';
import { Polyhedron } from 'math/polyhedra';

function isProperPolyhedron(polyhedron: Polyhedron) {
  const expectedSideLength = polyhedron.edgeLength();
  for (let edge of polyhedron.edges) {
    const sideLength: number = edge.length();
    if (_.isNaN(sideLength)) {
      console.log(`edge ${edge} has length NaN`);
      return false;
    }
    if (Math.abs(sideLength - expectedSideLength) > PRECISION) {
      console.log(
        `edge ${edge} has length ${sideLength} which is different from ${expectedSideLength}`,
      );
      return false;
    }
    // Make sure the whole thing is convex
    if (edge.dihedralAngle() > Math.PI - PRECISION) {
      console.log(`polyhedron concave at edge ${edge}`);
      return false;
    }
  }

  // Make sure all faces are facing the right way
  const centroid = polyhedron.centroid();
  for (let face of polyhedron.faces) {
    const faceCentroid = face.centroid();
    const normal = face.normal();
    const expectedNormal = faceCentroid.sub(centroid);
    if (normal.angleBetween(expectedNormal, true) > Math.PI / 2) {
      console.log(`polyhedron inside out at ${face.index}`);
      return false;
    }
  }
  return true;
}

export function setupOperations() {
  expect.extend({
    toBeValidPolyhedron(received) {
      const { result } = received;
      const isProper = isProperPolyhedron(result);
      const matchesName = result.isSame(Polyhedron.get(result.name));
      return {
        message: () => {
          if (!isProper)
            return `expected ${
              this.isNot ? 'an improper' : 'a proper'
            } CRF polyhedron`;
          return `expected polyhedron to ${this.isNot ? 'not be' : 'be'} a ${
            result.name
          }`;
        },
        pass: isProper && matchesName,
      };
    },
  });
}
