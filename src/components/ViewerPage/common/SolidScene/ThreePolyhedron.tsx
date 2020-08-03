import { zip } from "lodash"
import { SolidData } from "math/polyhedra"
import React, { useRef, useMemo } from "react"
import {
  BufferAttribute,
  DoubleSide,
  Vector3,
  Face3,
  Color,
  BufferGeometry,
  FrontSide,
  Geometry,
} from "three"
import { useFrame, useUpdate } from "react-three-fiber"

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

interface SolidConfig {
  showFaces: boolean
  showEdges: boolean
  showInnerFaces: boolean
  opacity: number
}

interface Props {
  value: SolidData
  colors: number[][]
  config: SolidConfig
  onClick?(point: any): void
  onPointerMove?(point: any): void
  onPointerOut?(point: any): void
}

export default function ThreePolyhedron({
  onClick,
  onPointerMove,
  onPointerOut,
  value,
  colors,
  config,
}: Props) {
  const { vertices, faces, edges = [] } = value
  const hit = useRef(new Vector3())
  const { showFaces, showEdges, showInnerFaces, opacity } = config

  const ref = useUpdate(
    (geom: Geometry) => {
      geom.vertices = convertVertices(vertices)
      geom.verticesNeedUpdate = true
      geom.faces = convertFaces(faces, colors)
      geom.elementsNeedUpdate = true
      geom.colorsNeedUpdate = true
      geom.computeFaceNormals()
    },
    [vertices, faces, colors],
  )

  const edgeGeom = useMemo(() => {
    const geom = new BufferGeometry()
    const positions = new Float32Array(200 * 3) // 3 vertices per point
    geom.setAttribute("position", new BufferAttribute(positions, 3))
    return geom
  }, [])

  useFrame(() => {
    const positions = edgeGeom.attributes.position.array as number[]
    edges.forEach((edge: any, i: number) => {
      const [i1, i2] = edge
      const v1 = vertices[i1]
      const v2 = vertices[i2]

      positions[i * 6 + 0] = v1[0]
      positions[i * 6 + 1] = v1[1]
      positions[i * 6 + 2] = v1[2]
      positions[i * 6 + 3] = v2[0]
      positions[i * 6 + 4] = v2[1]
      positions[i * 6 + 5] = v2[2]
    })
    edgeGeom.setDrawRange(0, edges.length * 2)
    edgeGeom.attributes.position.needsUpdate = true
  })

  return (
    <>
      {showFaces && (
        <mesh
          onPointerDown={(e) => {
            // FIXME it's still pretty finnicky..
            hit.current.copy(e.point)
          }}
          onPointerUp={(e) => {
            if (!hit.current.equals(e.point)) return
            onClick?.(e.point.toArray())
          }}
          onPointerMove={(e) => {
            hit.current.copy(e.point)
            onPointerMove?.(e.point.toArray())
          }}
          onPointerOut={(e) => {
            onPointerOut?.(e.point.toArray())
          }}
        >
          <geometry ref={ref} attach="geometry" />
          <meshStandardMaterial
            side={showInnerFaces ? DoubleSide : FrontSide}
            attach="material"
            color="grey"
            args={[{ vertexColors: true }]}
            opacity={opacity}
          />
        </mesh>
      )}
      {showEdges && (
        <lineSegments geometry={edgeGeom}>
          <lineBasicMaterial
            attach="material"
            color={0x222222}
            linewidth={1}
            opacity={0.9}
          />
        </lineSegments>
      )}
    </>
  )
}
