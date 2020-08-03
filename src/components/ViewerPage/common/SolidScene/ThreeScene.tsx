import React, { useRef } from "react"
import { Canvas, extend, useThree, useFrame } from "react-three-fiber"
import ThreePolyhedron from "./ThreePolyhedron"
import useSolidContext from "./useSolidContext"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls"

extend({ TrackballControls })

function CameraControls() {
  const camera = useRef<any>()
  const {
    gl: { domElement },
  } = useThree()
  // Ref to the controls, so that we can update them on every frame using useFrame
  const controls = useRef<any>()
  useFrame((state) => controls.current.update())
  // FIXME
  return (
    <>
      <perspectiveCamera ref={camera}>
        <pointLight position={[10, 10, 10]} />
      </perspectiveCamera>
      {/* @ts-ignore */}
      <trackballControls
        ref={controls}
        args={[camera.current, domElement]}
        enabled
        noPan
        rotateSpeed={15.0}
        staticMoving
      />
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
