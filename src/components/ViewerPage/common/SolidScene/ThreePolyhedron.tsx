import { zip } from "lodash"
import React, { useEffect, useRef } from "react"
import { DoubleSide, Vector3, Face3, Color } from "three"

function convertVertex([x, y, z]: [number, number, number]) {
  return new Vector3(x, y, z)
}

function convertVertices(vertices: [number, number, number][]) {
  return vertices.map(convertVertex)
}

function convertFace(face: number[], [r, g, b]: any) {
  const [v0, ...vs] = face
  const pairs = zip(vs.slice(0, vs.length - 1), vs.slice(1))
  const color = new Color(r, g, b)
  return pairs.map(([v1, v2]) => {
    return new Face3(v0, v1!, v2!, undefined, color)
  })
}

function convertFaces(faces: number[][], colors: any[]) {
  return zip(faces, colors).flatMap(([face, color]) =>
    convertFace(face!, color),
  )
}

export default function ThreePolyhedron({ value, colors }: any) {
  // This reference will give us direct access to the mesh
  const mesh = useRef<any>()
  const geom = useRef<any>()

  const { vertices, faces } = value

  // Set up state for the hovered and active state

  // FIXME this doesn't update
  useEffect(() => {
    geom.current.computeFaceNormals()
  })

  return (
    <mesh ref={mesh} scale={[2, 2, 2]}>
      <geometry
        ref={geom}
        attach="geometry"
        vertices={convertVertices(vertices)}
        faces={convertFaces(faces, colors)}
      />
      <meshStandardMaterial
        side={DoubleSide}
        attach="material"
        color="grey"
        args={[{ vertexColors: true }]}
      />
    </mesh>
  )
}
