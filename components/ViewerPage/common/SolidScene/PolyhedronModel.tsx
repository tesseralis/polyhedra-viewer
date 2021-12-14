import { zip } from "lodash-es"
import { SolidData } from "math/polyhedra"
import { useRef, useLayoutEffect, useMemo } from "react"
import {
  Color,
  Vector3,
  BufferAttribute,
  DoubleSide,
  BufferGeometry,
  FrontSide,
} from "three"
import { Appearance } from "./getFormeColors"
import { useFrame } from "@react-three/fiber"

function convertFace(face: number[]) {
  const [v0, ...vs] = face
  const pairs = zip(vs.slice(0, vs.length - 1), vs.slice(1))
  return pairs
    .map(([v1, v2]) => {
      return [v0, v1!, v2!]
    })
    .flat()
}

function getFaceColors(face: number[], appearance: Appearance) {
  const [v0, ...vs] = face
  const pairs = zip(vs.slice(0, vs.length - 1), vs.slice(1))
  const { color, material } = appearance
  return pairs
    .map(([v1, v2]) => {
      if (color instanceof Color) {
        return [color, color, color]
      } else {
        return [v0, v1!, v2!].map((v) => color[face.indexOf(v)])
      }
    })
    .flat()
}

function getVerticesFromFaces(faces: number[][], vertices: number[][]) {
  return faces.flatMap((face) => {
    return convertFace(face).map((i) => vertices[i])
  })
}

function getColorsFromFaces(faces: number[][], appearances: Appearance[]) {
  return faces.flatMap((face, i) => {
    return getFaceColors(face, appearances[i])
  })
}

interface SolidConfig {
  showFaces: boolean
  showEdges: boolean
  showInnerFaces: boolean
}

interface Props {
  value: SolidData
  appearance: Appearance[]
  config: SolidConfig
  onClick?(point: Vector3): void
  onPointerMove?(point: Vector3): void
  onPointerOut?(point: Vector3): void
}

function SolidFaces({
  value,
  appearance,
  onClick,
  onPointerMove,
  onPointerOut,
  config,
}: Props) {
  const { vertices, faces } = value
  const ref = useRef<any>()
  const faceVertices = getVerticesFromFaces(
    faces,
    vertices.map((v) => v.toArray()),
  )
  const vertexArray = new Float32Array(faceVertices.flat())

  const colorArray = getColorsFromFaces(faces, appearance)
  // https://www.donmccurdy.com/2020/06/17/color-management-in-threejs/
  // TODO Is there a better place to put the conversion call?
  const colorBuffer = new Float32Array(
    colorArray.flatMap((x) => x.clone().convertSRGBToLinear().toArray()),
  )
  useLayoutEffect(() => {
    ref.current.verticesNeedUpdate = true
    ref.current.computeVertexNormals()
  }, [vertices, faces, appearance])

  const hasMoved = useRef(false)
  const { showFaces, showInnerFaces } = config
  return (
    <mesh
      visible={true}
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
      <bufferGeometry ref={ref}>
        <bufferAttribute
          attachObject={["attributes", "position"]}
          args={[vertexArray, 3]}
        />
        <bufferAttribute
          attachObject={["attributes", "color"]}
          args={[colorBuffer, 3]}
        />
      </bufferGeometry>
      <meshStandardMaterial
        side={showInnerFaces ? DoubleSide : FrontSide}
        args={[{ vertexColors: true }]}
      />
    </mesh>
  )
}

function SolidEdges({ value, config }: Props) {
  const geomRef = useRef<BufferGeometry>()
  const { vertices, edges = [] } = value
  const { showEdges } = config
  const vertexArray = useMemo(() => new Float32Array(300 * 3), [])

  useFrame(() => {
    const positions = geomRef.current?.attributes.position.array as number[]
    edges.forEach((edge: [number, number], i: number) => {
      const [i1, i2] = edge
      // Scale edges slightly so they don't overlap
      // TODO do this in a way that doesn't rely on it being centered
      const vs = [
        ...vertices[i1].clone().multiplyScalar(1.001).toArray(),
        ...vertices[i2].clone().multiplyScalar(1.001).toArray(),
      ]
      for (let j = 0; j < 6; j++) {
        positions[i * 6 + j] = vs[j]
      }
    })
    if (geomRef.current) {
      geomRef.current.setDrawRange(0, edges.length * 2)
      geomRef.current.attributes.position.needsUpdate = true
    }
  })

  return (
    <lineSegments>
      <bufferGeometry ref={geomRef}>
        <bufferAttribute
          attachObject={["attributes", "position"]}
          args={[vertexArray, 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial
        attach="material"
        color={0x444444}
        linewidth={1}
        transparent
        visible={showEdges}
        opacity={0.5}
      />
    </lineSegments>
  )
}

export default function PolyhedronModel(props: Props) {
  return (
    <group>
      <SolidFaces {...props} />
      <SolidEdges {...props} />
    </group>
  )
}
