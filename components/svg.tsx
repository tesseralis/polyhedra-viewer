import React from "react"
import { range } from "lodash-es"

const { PI, sin, cos } = Math
const TAU = 2 * PI

export type Point2D = [number, number]

interface PointsProps {
  points: Point2D[]
  [prop: string]: any
}

function joinPoints(points: Point2D[]) {
  return points.map((point) => point.join(",")).join(" ")
}

// Irregular polygon
export function PolyShape({ points, ...rest }: PointsProps) {
  return <polygon {...rest} points={joinPoints(points)} />
}

export function PolyLine({ points, ...rest }: PointsProps) {
  return <polyline {...rest} points={joinPoints(points)} />
}

interface PolygonProps {
  n?: number
  r?: number
  cx?: number
  cy?: number
  a?: number
  [prop: string]: any
}

export function polygonPoints({
  n = 3,
  r = 1,
  cx = 0,
  cy = 0,
  a = 0,
}: PolygonProps) {
  return range(n).map<Point2D>((i) => [
    cx + r * cos(TAU * (a / 360 + i / n)),
    cy + r * sin(TAU * (a / 360 + i / n)),
  ])
}

// Regular polygon
export function Polygon({
  n = 3,
  r = 1,
  cx = 0,
  cy = 0,
  a = 0,
  ...rest
}: PolygonProps) {
  const points = polygonPoints({ n, r, cx, cy, a })
  return <PolyShape {...rest} points={points} />
}
