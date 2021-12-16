import { useStyle } from "styles"
import { ChildrenProp } from "lib/types"

export default function SrOnly({ children }: ChildrenProp) {
  const css = useStyle({
    height: 1,
    width: 1,
    position: "absolute",
    overflow: "hidden",
    clip: "rect(1px, 1px, 1px, 1px)",
  })
  return <span {...css()}>{children}</span>
}
