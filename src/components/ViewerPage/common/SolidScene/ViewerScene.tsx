import { pick } from "lodash-es"
import React, { useEffect, useRef } from "react"
import { PerspectiveCamera } from "three"
import { Canvas, extend, useThree, useFrame } from "react-three-fiber"
import { TrackballControls } from "three/examples/jsm/controls/TrackballControls"
import ThreePolyhedron from "./PolyhedronModel"
import useSolidContext from "./useSolidContext"
import useHitOptions from "./useHitOptions"
import ConfigCtx from "components/ConfigCtx"

extend({ TrackballControls })

function CameraControls() {
  const {
    setDefaultCamera,
    gl: { domElement },
  } = useThree()
  // Ref to the controls, so that we can update them on every frame using useFrame
  const camera = useRef<PerspectiveCamera | undefined>()
  const controls = useRef<TrackballControls | undefined>()
  useEffect(() => {
    if (camera.current) setDefaultCamera(camera.current)
  }, [setDefaultCamera])
  useFrame(() => {
    camera.current?.updateMatrixWorld()
    controls.current?.update()
  })
  // FIXME v4 This needs to adjusted when resizing the screen
  return (
    <>
      <perspectiveCamera ref={camera} position={[0, 0, 5]}>
        <pointLight />
      </perspectiveCamera>
      {camera.current && (
        <trackballControls
          ref={controls}
          args={[camera.current, domElement]}
          enabled
          noPan
          rotateSpeed={8.0}
          staticMoving // TODO make this configurable
        />
      )}
    </>
  )
}

export default function ViewerScene() {
  const { colors, solidData } = useSolidContext()
  const { setHitOption, unsetHitOption, applyWithHitOption } = useHitOptions()
  const config = ConfigCtx.useState()
  return (
    <Canvas gl={{ antialias: true }}>
      <CameraControls />
      <ambientLight />
      <ThreePolyhedron
        value={solidData}
        colors={colors}
        config={pick(config, [
          "showFaces",
          "showEdges",
          "showInnerFaces",
          "opacity",
        ])}
        onPointerMove={setHitOption}
        onClick={applyWithHitOption}
        onPointerOut={unsetHitOption}
      />
    </Canvas>
  )
}
