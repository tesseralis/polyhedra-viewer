import { css } from "@emotion/react"
import Icon from "@mdi/react"

import { scales } from "styles"
import { SrOnly } from "components/common"
import { fonts } from "styles"

import { RawSolidData } from "math/polyhedra"
import { mdiDownload } from "@mdi/js"

function formatDecimal(number: number) {
  return Number.isInteger(number) ? `${number}.0` : number
}

function vToObj(vertex: number[]) {
  return "v " + vertex.map(formatDecimal).join(" ")
}

function fToObj(face: number[]) {
  return "f " + face.map((i) => i + 1).join(" ")
}

function toObj({ vertices, faces }: RawSolidData) {
  const vObj = vertices.map(vToObj)
  const fObj = faces.map(fToObj)
  return vObj.concat(fObj).join("\n")
}

const fileFormats = [
  {
    ext: "json",
    serializer: JSON.stringify,
  },
  {
    ext: "obj",
    serializer: toObj,
  },
]

interface Props {
  name: string
  solid: RawSolidData
}

function DownloadLink({
  ext,
  serializer,
  solid,
  name,
}: typeof fileFormats[0] & Props) {
  const filename = `${name}.${ext}`
  // FIXME this breaks server-side
  // const blob = new Blob([serializer(solid)], {
  //   type: "text/plain;charset=utf-8",
  // })
  // const url = window.URL.createObjectURL(blob)

  return (
    <a
      download={filename}
      href="#"
      css={css`
        display: inline-flex;
        justify-content: center;
        padding: ${scales.spacing[2]};
        width: ${scales.size[4]};

        text-decoration: none;
        border: 1px #444 solid;
        color: #999;
        font-family: ${fonts.andaleMono};

        :not(:last-child): {
          margin-right: ${scales.spacing[2]};
        }
      `}
    >
      <SrOnly>Download as</SrOnly>.{ext}{" "}
      <span>
        <Icon path={mdiDownload} size={scales.size[1]} />
      </span>
    </a>
  )
}

export default function DataDownloader({ solid, name }: Props) {
  return (
    <div>
      <h2
        css={css`
          font-family: ${fonts.times};
          font-size: ${scales.font[4]};
          margin-bottom: ${scales.spacing[2]};
        `}
      >
        Download model
      </h2>
      <div
        css={css`
          display: flex;
          gap: 0.5rem;
        `}
      >
        {fileFormats.map((format) => (
          <DownloadLink
            key={format.ext}
            {...format}
            name={name}
            solid={solid}
          />
        ))}
      </div>
    </div>
  )
}
