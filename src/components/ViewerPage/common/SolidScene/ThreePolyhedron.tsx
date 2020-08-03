import { zip } from "lodash"
import React, { useRef } from "react"
import { DoubleSide, Vector3, Face3, Color } from "three"
import { useUpdate } from "react-three-fiber"

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

export default function ThreePolyhedron({
  onClick,
  onPointerMove,
  value,
  colors,
}: any) {
  // This reference will give us direct access to the mesh
  const mesh = useRef<any>()
  const { vertices, faces } = value

  const ref = useUpdate(
    (geom: any) => {
      geom.vertices = convertVertices(vertices)
      geom.verticesNeedUpdate = true
      geom.faces = convertFaces(faces, colors)
      geom.elementsNeedUpdate = true
      geom.colorsNeedUpdate = true
      geom.computeFaceNormals()
    },
    [vertices, faces, colors],
  )

  return (
    <mesh
      ref={mesh}
      scale={[1, 1, 1]}
      onClick={(e) => {
        onClick?.(e.point.toArray())
      }}
      onPointerMove={(e) => {
        onPointerMove?.(e.point.toArray())
      }}
    >
      <geometry ref={ref} attach="geometry" />
      <meshStandardMaterial
        side={DoubleSide}
        attach="material"
        color="grey"
        args={[{ vertexColors: true }]}
      />
    </mesh>
  )
}
