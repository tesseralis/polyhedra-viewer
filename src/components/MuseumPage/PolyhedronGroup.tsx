import { pick } from "lodash-es"
import React, { useRef } from "react"
import { Table } from "tables"
import { Color } from "three"
import PolyhedronModel from "components/ViewerPage/common/SolidScene/PolyhedronModel"
import { getGeometry } from "math/operations/operationUtils"
import ConfigCtx from "components/ConfigCtx"
import { useFrame } from "react-three-fiber"

const rowSpacing = 2
const colSpacing = 7
const innerSpacing = 3

function PolyhedronEntry({ entry, position }: any) {
  const ref = useRef<any>()
  useFrame(() => {
    const rotation = ref.current?.rotation
    if (rotation) {
      rotation.y += 0.01
    }
    // ref.current?.rotation.x += 0.01
  })
  if (!entry || typeof entry === "string") return null
  if (entry instanceof Array) {
    // entry = entry[0]
    return (
      <group>
        {entry.map((e, i) => {
          return (
            <PolyhedronEntry
              key={i}
              entry={e}
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
  let geom
  try {
    geom = getGeometry(entry)
  } catch (e) {
    console.log(entry)
    throw e
  }
  const config = ConfigCtx.useState()
  const { colors } = config
  const faceColors = geom.faces.map((face) => new Color(colors[face.numSides]))

  return (
    <group ref={ref} position={position}>
      <PolyhedronModel
        value={geom.solidData}
        colors={faceColors}
        config={pick(config, ["showFaces", "showEdges", "showInnerFaces"])}
      />
    </group>
  )
}

function PolyhedronRow({ row, position }: any) {
  return (
    <group position={position}>
      {row.map((entry: any, i: number) => (
        <PolyhedronEntry
          key={i}
          entry={entry}
          position={[i * colSpacing, position[1], 0]}
        />
      ))}
    </group>
  )
}

interface Props {
  table: Table
}

export default function PolyhedronGroup({ table }: Props) {
  const { data } = table
  console.log({ data })
  return (
    <group>
      {data.map((row, i) => (
        <PolyhedronRow key={i} row={row} position={[0, -i * rowSpacing, 0]} />
      ))}
    </group>
  )
}
