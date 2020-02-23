import React from "react"
import Icon from "@mdi/react"
import { mdiFacebookBox, mdiTumblrBox, mdiTwitter, mdiReddit } from "@mdi/js"

import { useStyle, fonts, scales } from "styles"
import { ExternalLink, SrOnly } from "components/common"

const url = "http://polyhedra.tessera.li"
const title = "Polyhedra Viewer"
const author = "tesseralis"
const caption = "Jinkies! Check out this cool polyhedral geometry app!"

const links = [
  {
    url: `https://www.facebook.com/sharer.php?u=${url}`,
    icon: mdiFacebookBox,
    name: "Facebook",
  },
  {
    url: `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${url}&title=${title}&caption=${caption}`,
    icon: mdiTumblrBox,
    name: "Tumblr",
  },
  {
    url: `https://twitter.com/intent/tweet?url=${url}&text=${caption}&via=${author}`,
    icon: mdiTwitter,
    name: "Twitter",
  },
  {
    url: `https://reddit.com/submit?url=${url}&title=${title}`,
    icon: mdiReddit,
    name: "Reddit",
  },
]

function ShareText() {
  const css = useStyle({
    fontFamily: fonts.andaleMono,
    fontWeight: "bold",
  })
  return <span {...css()}>Share:</span>
}

function ShareLink({ url, icon, name }: typeof links[0]) {
  const css = useStyle({ fill: "DimGrey" })
  return (
    <ExternalLink
      {...css()}
      href={url}
      key={icon}
      onClick={() =>
        // https://stackoverflow.com/questions/34507160/how-can-i-handle-an-event-to-open-a-window-in-react-js
        window.open(url, "share", "toolbar=0,status=0,width=548,height=325")
      }
    >
      <Icon size={scales.size[2]} path={icon} />
      <SrOnly>{`Share on ${name}`}</SrOnly>
    </ExternalLink>
  )
}

export default function ShareLinks() {
  const css = useStyle({
    display: "grid",
    gridAutoFlow: "column",
    gridGap: scales.spacing[3],
    alignItems: "center",
  })
  return (
    <div {...css()}>
      <ShareText />
      {links.map(link => (
        <ShareLink key={link.name} {...link} />
      ))}
    </div>
  )
}
