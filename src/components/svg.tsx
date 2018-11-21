import React, { SVGProps } from 'react';
import _ from 'lodash';

const { PI, sin, cos } = Math;
const TAU = 2 * PI;

export type Point2D = [number, number];

interface PointsProps {
  points: Point2D[];
  [prop: string]: any;
}

function joinPoints(points: Point2D[]) {
  return points.map(point => point.join(',')).join(' ');
}

export function PolyShape({ points, ...rest }: PointsProps) {
  return <polygon {...rest} points={joinPoints(points)} />;
}

export function PolyLine({ points, ...rest }: PointsProps) {
  return <polyline {...rest} points={joinPoints(points)} />;
}

interface PolygonProps {
  n?: number;
  r?: number;
  cx?: number;
  cy?: number;
  a?: number;
  [prop: string]: any;
}

export function polygonPoints({
  n = 3,
  r = 1,
  cx = 0,
  cy = 0,
  a = 0,
}: PolygonProps) {
  return _(n)
    .range()
    .map<number, Point2D>(i => [
      cx + r * cos(TAU * (a / 360 + i / n)),
      cy + r * sin(TAU * (a / 360 + i / n)),
    ])
    .value();
}

export function Polygon({
  n = 3,
  r = 1,
  cx = 0,
  cy = 0,
  a = 0,
  ...rest
}: PolygonProps) {
  const points = polygonPoints({ n, r, cx, cy, a });
  return <PolyShape {...rest} points={points} />;
}
