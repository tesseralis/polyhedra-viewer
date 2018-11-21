import _ from 'lodash';
import { Twist } from 'types';
import { find } from 'utils';
import { Polyhedron, Cap, VEList, VertexList } from 'math/polyhedra';
import { inRow, inColumn } from 'math/polyhedra/tableUtils';
import { withOrigin, isInverse } from 'math/geom';
import { getTwistSign, getTransformedVertices } from '../operationUtils';

// Get antiprism height of a unit antiprism with n sides
export function antiprismHeight(n: number) {
  const sec = 1 / Math.cos(Math.PI / (2 * n));
  return Math.sqrt(1 - (sec * sec) / 4);
}

// TODO deduplicate with snub polyhedra if possible
export function getChirality(polyhedron: Polyhedron) {
  const [cap1, cap2] = Cap.getAll(polyhedron);
  const boundary = cap1.boundary();
  const isCupolaRotunda = cap1.type !== cap2.type;

  const nonTriangleFace = find(boundary.edges, e => e.face.numSides !== 3);
  const rightFaceAcross = nonTriangleFace
    .twin()
    .prev()
    .twin()
    .next()
    .twin().face;
  // I'm pretty sure this is the same logic as in augment
  if (isCupolaRotunda) {
    return rightFaceAcross.numSides !== 3 ? 'right' : 'left';
  }
  return rightFaceAcross.numSides !== 3 ? 'left' : 'right';
}

export function isGyroelongatedBiCupola(polyhedron: Polyhedron) {
  const pyrRows = ['square pyramid', 'pentagonal pyramid'];
  if (_.some(pyrRows, row => inRow(polyhedron.name, 'capstones', row))) {
    return false;
  }
  return inColumn(polyhedron.name, 'capstones', 'gyroelongated bi-');
}

function getOppositeCaps(polyhedron: Polyhedron) {
  const caps = Cap.getAll(polyhedron);
  for (let cap of caps) {
    const cap2 = _.find(caps, cap2 => isInverse(cap.normal(), cap2.normal()));
    if (cap2) return [cap, cap2];
  }
  return undefined;
}

function getOppositePrismFaces(polyhedron: Polyhedron) {
  const face1 = _.maxBy(
    _.filter(polyhedron.faces, face => {
      const faceCounts = _.countBy(
        face.vertexAdjacentFaces().filter(f => !f.equals(face)),
        'numSides',
      );
      return (
        _.isEqual(faceCounts, { '4': face.numSides }) ||
        _.isEqual(faceCounts, { '3': 2 * face.numSides })
      );
    }),
    'numSides',
  );
  if (!face1) return undefined;

  const face2 = _.find(
    polyhedron.faces,
    face2 =>
      face1.numSides === face2.numSides &&
      isInverse(face1.normal(), face2.normal()),
  );
  if (face2) return [face1, face2];
  return undefined;
}

export function getAdjustInformation(polyhedron: Polyhedron) {
  const oppositePrismFaces = getOppositePrismFaces(polyhedron);
  if (oppositePrismFaces) {
    return {
      vertexSets: oppositePrismFaces,
      boundary: oppositePrismFaces[0],
      multiplier: 1 / 2,
    };
  }
  const oppositeCaps = getOppositeCaps(polyhedron);
  if (oppositeCaps) {
    // This is an elongated bi-cap
    return {
      vertexSets: oppositeCaps,
      boundary: oppositeCaps[0].boundary(),
      multiplier: 1 / 2,
    };
  }

  // Otherwise it's an elongated single cap
  const faces = polyhedron.faces.filter(face => {
    return _.uniqBy(face.adjacentFaces(), 'numSides').length === 1;
  });
  const face = _.maxBy(faces, 'numSides')!;
  return {
    vertexSets: [face],
    boundary: face,
    multiplier: 1,
  };
}

interface AdjustInfo {
  vertexSets: any;
  readonly boundary: VEList;
  multiplier: number;
}

export function getScaledPrismVertices(
  adjustInfo: AdjustInfo,
  scale: number,
  twist?: Twist,
) {
  const { vertexSets, boundary, multiplier } = adjustInfo;
  const n = boundary.numSides;
  const angle = (getTwistSign(twist) * Math.PI) / n;

  return getTransformedVertices<VEList>(vertexSets, set =>
    withOrigin(set.normalRay(), v =>
      v
        .add(set.normal().scale(scale * multiplier))
        .getRotatedAroundAxis(set.normal(), angle * multiplier),
    ),
  );
}
