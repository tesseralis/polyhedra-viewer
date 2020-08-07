import { pick } from "lodash-es"
import React, { useState, useRef } from "react"
import { Table } from "tables"
import { Color } from "three"
import PolyhedronModel from "components/ViewerPage/common/SolidScene/PolyhedronModel"
import { getGeometry } from "math/operations/operationUtils"
import ConfigCtx from "components/ConfigCtx"
import createForme from "math/formes/createForme"

import { useFrame } from "react-three-fiber"

const rowSpacing = 2
const colSpacing = 7
const innerSpacing = 3

function PolyhedronEntry({ entry, position, navigate }: any) {
  const ref = useRef<any>()
  const [hovered, setHovered] = useState(false)
  useFrame(() => {
    const rotation = ref.current?.rotation
    if (rotation) {
      rotation.y += 0.01
    }
  })
  if (!entry || typeof entry === "string") return null
  if (entry instanceof Array) {
    return (
      <group>
        {entry.map((e, i) => {
          return (
            <PolyhedronEntry
              key={i}
              entry={e}
              navigate={navigate}
              position={[
                position[0] - innerSpacing * (0.5 - i),
                position[1],
                position[2],
              ]}
            />
          )
        })}
      </group>
    )
  }
  const isDupe = entry.name() !== entry.canonicalName()
  const forme = createForme(entry, getGeometry(entry))
  const geom = forme.orient()

  const config = ConfigCtx.useState()
  const { colors } = config
  const faceColors = geom.faces.map((face) => {
    const color = new Color(colors[face.numSides])
    if (hovered) {
      color.offsetHSL(0, 0, 0.2)
    }
    if (isDupe) {
      color.offsetHSL(0, -0.5, 0.2)
    }
    return color
  })

  return (
    <group ref={ref} position={position}>
      <PolyhedronModel
        onClick={() => navigate(`/${escape(entry.name())}`)}
        onPointerMove={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        value={geom.solidData}
        colors={faceColors}
        config={pick(config, ["showFaces", "showEdges", "showInnerFaces"])}
      />
    </group>
  )
}

function PolyhedronRow({ row, position, navigate }: any) {
  return (
    <group position={position}>
      {row.map((entry: any, i: number) => (
        <PolyhedronEntry
          key={i}
          navigate={navigate}
          entry={entry}
          position={[i * colSpacing, position[1], 0]}
        />
      ))}
    </group>
  )
}

interface Props {
  table: Table
  navigate: (blah: any) => void
}

export default function PolyhedronGroup({ table, navigate }: Props) {
  const { data } = table
  return (
    <group>
      {data.map((row, i) => (
        <PolyhedronRow
          key={i}
          row={row}
          navigate={navigate}
          position={[0, -i * rowSpacing, 0]}
        />
      ))}
    </group>
  )
}
