import React from "react"
import { Canvas } from "@react-three/fiber"
import { useStyle } from "styles"
import { OrthographicCamera } from "@react-three/drei"
import { useRouter } from "next/router"

export default function GroupLayout({ position, zoom, children }: any) {
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
        <OrthographicCamera makeDefault position={position} zoom={zoom}>
          {[]}
        </OrthographicCamera>
        <directionalLight position={[0, 0.5, 1]} />
        {/* <TrackballControls enabled noRotate panSpeed={5} /> */}
        <group>{children(router)}</group>
      </Canvas>
    </div>
  )
}
