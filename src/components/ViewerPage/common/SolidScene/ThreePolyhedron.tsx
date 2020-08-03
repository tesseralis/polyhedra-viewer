import { zip } from "lodash"
import React, { useRef } from "react"
import { useFrame } from "react-three-fiber"
import { DoubleSide } from "three"
import { repeat } from "utils"

function triangulateFace(face: number[]): [number, number, number][] {
  const [v0, ...vs] = face
  const pairs = zip(vs.slice(0, vs.length - 1), vs.slice(1))
  return pairs.map((pair) => [v0, ...pair]) as any
}

function triangulateFaces(faces: number[][]) {
  return faces.flatMap(triangulateFace)
}

function triangulateColors(faces: number[][], colors: any[]) {
  return colors.flatMap((color, i) => {
    const face = faces[i]
    const reps = face.length - 2
    return repeat(color, reps)
  })
}

export default function ThreePolyhedron({ value, colors }: any) {
  // This reference will give us direct access to the mesh
  const mesh = useRef<any>()
  const geom = useRef<any>()

  const { vertices, faces } = value

  // Set up state for the hovered and active state

  // Rotate mesh every frame, this is outside of React without overhead
  // useFrame(() => (mesh.current.rotation.x = mesh.current.rotation.y += 0.01))

  const triangColors = triangulateColors(faces, colors)

  // FIXME initialize colors when we generate the polyhedron
  useFrame(() => {
    geom.current.faces.forEach((face: any, i: number) => {
      const color = triangColors[i]
      face.color.setRGB(...color)
    })
  })

  return (
    <mesh ref={mesh} scale={[2, 2, 2]}>
      {/* FIXME FUCK YOU POLYHEDRONGEOMETRY YOU ARE A FALSE MESSIAH */}
      <polyhedronGeometry
        ref={geom}
        attach="geometry"
        args={[vertices.flat(), triangulateFaces(faces).flat()]}
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
