import React from "react"
import { Canvas } from "react-three-fiber"
import { useRouter } from "next/router"
import { useStyle } from "styles"
import { tableSections } from "lib/tables"
import PolyhedronTable from "./PolyhedronTable"
import { OrthographicCamera, TrackballControls } from "drei"

// TODO deduplicate with the controls in the other scene
const sectionSpacing = 50
const subsecSpacing = 25
// TODO why is this so slow to load??
export default function MuseumScene() {
  const router = useRouter()
  const style = useStyle({
    position: "absolute",
    backgroundColor: "#111",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  })
  return (
    <div {...style()}>
      <Canvas>
        <OrthographicCamera makeDefault position={[0, 0, 75]}>
          {[]}
        </OrthographicCamera>
        <directionalLight position={[0, 0.5, 1]} />
        <TrackballControls enabled noRotate panSpeed={5} />
        <group>
          {tableSections.map((section, i) => {
            if (section.tables) {
              return section.tables.map((table, j) => (
                <group key={table.caption} position={[j * subsecSpacing, 0, 0]}>
                  <PolyhedronTable navigate={router} table={table} />
                </group>
              ))
            }
            if (section.subsections) {
              return section.subsections.map((subsec, j) => {
                return (
                  <group key={j} position={[0, -(i + j) * sectionSpacing, 0]}>
                    {subsec.tables!.map((table, k) => (
                      <group
                        key={table.caption}
                        position={[k * subsecSpacing, 0, 0]}
                      >
                        <PolyhedronTable navigate={router} table={table} />
                      </group>
                    ))}
                  </group>
                )
              })
            }
            return null
          })}
        </group>
      </Canvas>
    </div>
  )
}
