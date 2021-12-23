import { css } from "@emotion/react"
import Link from "next/link"
import { useRouter } from "next/router"
import { scales } from "styles"
import Icon from "@mdi/react"

import { media, fonts } from "styles"
import { SrOnly } from "components/common"

function LinkText({ text, hidden }: { text: string; hidden: boolean }) {
  return hidden ? (
    <SrOnly>{text}</SrOnly>
  ) : (
    <div
      css={css`
        margin-top: ${scales.spacing[1]};
        font-size: ${scales.font[7]};
        font-family: ${fonts.verdana};

        ${media.mobileLandscape} {
          margin-top: 0;
          padding-left: ${scales.spacing[1]};
        }
      `}
    >
      {text}
    </div>
  )
}

export default function IconLink({
  iconName,
  title,
  to,
  replace,
  onClick,
  iconOnly = false,
}: any) {
  const router = useRouter()
  const isActive = router.asPath.endsWith(to)
  const color = isActive ? "#ccc" : "#999"

  return (
    <Link href={to} replace={replace} passHref>
      <a
        onClick={onClick}
        css={css`
          display: flex;
          flex-direction: column;
          align-items: center;
          color: ${color};
          fill: ${color};
          text-decoration: none;
          padding: ${scales.spacing[2]};
          transition: color 250ms;

          ${media.mobileLandscape} {
            padding: 0;
            flex-direction: row;
          }
        `}
      >
        <Icon path={iconName} size={scales.size[2]} />
        <LinkText text={title} hidden={iconOnly} />
      </a>
    </Link>
  )
}
