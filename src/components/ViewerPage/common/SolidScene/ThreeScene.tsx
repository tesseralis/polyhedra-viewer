import React, { useEffect, useRef } from "react"
import { Canvas, extend, useThree, useFrame } from "react-three-fiber"
import ThreePolyhedron from "./ThreePolyhedron"
import useSolidContext from "./useSolidContext"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls"

extend({ TrackballControls })

function CameraControls() {
  const {
    setDefaultCamera,
    gl: { domElement },
  } = useThree()
  // Ref to the controls, so that we can update them on every frame using useFrame
  const camera = useRef<any>()
  const controls = useRef<any>()
  useEffect(() => {
    setDefaultCamera(camera.current)
  }, [setDefaultCamera])
  useFrame(() => {
    camera.current?.updateMatrixWorld()
    controls.current?.update()
  })
  return (
    <>
      <perspectiveCamera ref={camera} position={[0, 0, 10]}>
        <pointLight />
      </perspectiveCamera>
      {camera.current && (
        <trackballControls
          ref={controls}
          args={[camera.current, domElement]}
          enabled
          noPan
          rotateSpeed={8.0}
          staticMoving
        />
      )}
    </>
  )
}

export default function ThreeScene() {
  const { colors, solidData } = useSolidContext()
  return (
    <Canvas>
      <CameraControls />
      <ambientLight />
      <ThreePolyhedron value={solidData} colors={colors} />
    </Canvas>
  )
}
