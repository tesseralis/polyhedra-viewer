import React from "react"
import { Canvas } from "@react-three/fiber"
import { useRouter } from "next/router"
import { useStyle } from "styles"
import { tableSections } from "lib/tables"
import PolyhedronTable from "components/MuseumPage/PolyhedronTable"
import { OrthographicCamera, TrackballControls } from "@react-three/drei"

export default function GroupPage({ group }: any) {
  const router = useRouter()
  const style = useStyle({
    position: "absolute",
    backgroundColor: "#111",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  })
  const table = tableSections.find((table) => table.id === group)!
  return (
    <div {...style()}>
      <Canvas>
        <OrthographicCamera makeDefault position={[0, 0, 5]} zoom={20}>
          {[]}
        </OrthographicCamera>
        <directionalLight position={[0, 0.5, 1]} />
        <TrackballControls enabled noRotate panSpeed={5} />
        <group>
          {table.tables?.map((table, j) => {
            return (
              <group key={table.caption} position={[j * subsecSpacing, 0, 0]}>
                <PolyhedronTable navigate={router} table={table} />
              </group>
            )
          })}
        </group>
      </Canvas>
    </div>
  )
}

// TODO deduplicate with the controls in the other scene
const sectionSpacing = 50
const subsecSpacing = 20
