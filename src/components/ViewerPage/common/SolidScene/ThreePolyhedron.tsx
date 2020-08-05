import { zip } from "lodash-es"
import { SolidData } from "math/polyhedra"
import React, { useRef, useMemo } from "react"
import {
  Color,
  Vector3,
  BufferAttribute,
  DoubleSide,
  Face3,
  BufferGeometry,
  FrontSide,
  Geometry,
} from "three"
import { useFrame, useUpdate } from "react-three-fiber"

function convertFace(face: number[], color: Color) {
  const [v0, ...vs] = face
  const pairs = zip(vs.slice(0, vs.length - 1), vs.slice(1))
  return pairs.map(([v1, v2]) => {
    return new Face3(v0, v1!, v2!, undefined, color)
  })
}

function convertFaces(faces: number[][], colors: Color[]) {
  return zip(faces, colors).flatMap(([face, color]) =>
    convertFace(face!, color!),
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
  colors: Color[]
  config: SolidConfig
  onClick?(point: Vector3): void
  onPointerMove?(point: Vector3): void
  onPointerOut?(point: Vector3): void
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
  const hasMoved = useRef(false)
  const { showFaces, showEdges, showInnerFaces, opacity } = config

  const ref = useUpdate(
    (geom: Geometry) => {
      geom.vertices = vertices
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
    const positions = new Float32Array(300 * 3) // 3 vertices per point
    geom.setAttribute("position", new BufferAttribute(positions, 3))
    return geom
  }, [])

  useFrame(() => {
    const positions = edgeGeom.attributes.position.array as number[]
    edges.forEach((edge: [number, number], i: number) => {
      const [i1, i2] = edge
      const vs = [...vertices[i1].toArray(), ...vertices[i2].toArray()]
      for (let j = 0; j < 6; j++) {
        positions[i * 6 + j] = vs[j]
      }
    })
    edgeGeom.setDrawRange(0, edges.length * 2)
    edgeGeom.attributes.position.needsUpdate = true
  })

  return (
    <>
      {showFaces && (
        <mesh
          onPointerDown={(e) => {
            hasMoved.current = false
          }}
          onPointerUp={(e) => {
            if (hasMoved.current) return
            onClick?.(e.point)
          }}
          onPointerMove={(e) => {
            hasMoved.current = true
            onPointerMove?.(e.point)
          }}
          onPointerOut={(e) => {
            onPointerOut?.(e.point)
          }}
        >
          <geometry ref={ref} attach="geometry" />
          <meshStandardMaterial
            side={showInnerFaces ? DoubleSide : FrontSide}
            attach="material"
            color="grey"
            args={[{ vertexColors: true }]}
            transparent={opacity < 1}
            opacity={opacity}
          />
        </mesh>
      )}
      {showEdges && (
        <lineSegments geometry={edgeGeom}>
          <lineBasicMaterial
            attach="material"
            color={0x444444}
            linewidth={1}
            transparent
            opacity={0.8}
          />
        </lineSegments>
      )}
    </>
  )
}
