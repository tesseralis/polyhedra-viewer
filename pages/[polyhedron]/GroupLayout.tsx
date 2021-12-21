import { css } from "@emotion/react"
import { Canvas } from "@react-three/fiber"
import { OrthographicCamera } from "@react-three/drei"
import { useRouter } from "next/router"
import Markdown from "components/HomePage/Markdown"

export default function GroupLayout({
  position,
  zoom,
  children,
  aspectRatio = "1 / 1",
  title,
  text,
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
        color: #999999;
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
      {/* <section
        css={css`
          display: relative;
          overflow: scroll;
          padding: 1rem;

          > h1 {
            font-size: 1.25rem;
            padding-bottom: 1rem;
          }
        `}
      >
        <h1>{title}</h1>
        <Markdown source={text} />
      </section> */}
    </div>
  )
}
