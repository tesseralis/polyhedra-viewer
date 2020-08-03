import React, { useRef } from "react"
import { Canvas, extend, useThree, useFrame } from "react-three-fiber"
import ThreePolyhedron from "./ThreePolyhedron"
import useSolidContext from "./useSolidContext"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls"

extend({ TrackballControls })

function CameraControls() {
  const {
    camera,
    gl: { domElement },
  } = useThree()
  // Ref to the controls, so that we can update them on every frame using useFrame
  const controls = useRef<any>()
  useFrame((state) => controls?.current?.update())
  // FIXME
  return (
    <>
      {/* @ts-ignore */}
      <trackballControls
        ref={controls}
        args={[camera, domElement]}
        enabled
        noPan
        rotateSpeed={8.0}
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
      <perspectiveCamera
        args={[45, window.innerWidth / window.innerHeight, 1, 500]}
        position={[0, 0, 100]}
      >
        <pointLight />
      </perspectiveCamera>
      <ThreePolyhedron value={solidData} colors={colors} />
    </Canvas>
  )
}
