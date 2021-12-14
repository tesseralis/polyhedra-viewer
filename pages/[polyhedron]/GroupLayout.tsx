import { css } from "@emotion/react"
import { Canvas } from "@react-three/fiber"
import { OrthographicCamera } from "@react-three/drei"
import { useRouter } from "next/router"

export default function GroupLayout({
  position,
  zoom,
  children,
  aspectRatio = "1 / 1",
}: any) {
  const router = useRouter()
  return (
    <div
      css={css`
        position: absolute;
        background-color: #111;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        display: grid;
        grid-template-columns: 1fr 20rem;
      `}
    >
      <div
        css={css`
          width: 100%;
          height: 100%;
          position: relative;
          overflow: scroll;
        `}
      >
        <div
          css={css`
            width: 100%;
            aspect-ratio: ${aspectRatio};
          `}
        >
          <Canvas>
            <OrthographicCamera makeDefault position={position} zoom={zoom} />
            <directionalLight position={[0, 0.5, 1]} />
            {/* <TrackballControls enabled noRotate panSpeed={5} /> */}
            <group>{children(router)}</group>
          </Canvas>
        </div>
      </div>
      <section>
        <h1>This is content</h1>
      </section>
    </div>
  )
}
