import React, { useRef } from "react"
import { Canvas, extend, useThree, useFrame } from "react-three-fiber"
import { useStyle } from "styles"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls"
import { tableSections } from "tables"
import PolyhedronGroup from "./PolyhedronGroup"

extend({ TrackballControls })

function Controls() {
  const {
    camera,
    gl: { domElement },
  } = useThree()
  const controls = useRef<TrackballControls | undefined>()

  useFrame(() => {
    camera.updateMatrixWorld()
    controls.current?.update()
  })

  return (
    <trackballControls
      ref={controls}
      args={[camera, domElement]}
      enabled
      noRotate
      rotateSpeed={8.0}
      // staticMoving // TODO make this configurable
    />
  )
}

const sectionSpacing = 40
const subsecSpacing = 25
export default function MuseumScene() {
  const style = useStyle({
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  })
  return (
    <div {...style()}>
      <Canvas>
        <Controls />
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <group>
          {tableSections.map((section, i) => {
            if (section.tables) {
              return section.tables.map((table, j) => (
                <group key={table.caption} position={[j * subsecSpacing, 0, 0]}>
                  <PolyhedronGroup table={table} />
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
                        <PolyhedronGroup table={table} />
                      </group>
                    ))}
                  </group>
                )
              })
            }
          })}
        </group>
      </Canvas>
    </div>
  )
}
