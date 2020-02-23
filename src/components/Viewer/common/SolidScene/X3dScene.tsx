import React, { useRef, useEffect } from "react"
import x3dom from "x3domWrapper"
import "x3dom/x3dom.css"

import { ChildrenProp } from "types"
import { useStyle } from "styles"

// Disable double-clicking to change rotation point
if (x3dom.Viewarea) {
  x3dom.Viewarea.prototype.onDoubleClick = () => {}
}

interface Props extends ChildrenProp {
  label: string
}

export default function X3dScene({ label, children }: Props) {
  const x3d = useRef<any>(null)

  useEffect(() => {
    // Reload X3DOM asynchronously so that it tracks the re-created instance
    setTimeout(() => {
      x3dom.reload()
      // X3DOM generates this canvas which isn't controlled by react,
      // so we have to manually fix things
      if (x3d.current) {
        const canvas = x3d.current.querySelector("canvas")
        canvas.setAttribute("tabIndex", -1)
        canvas.setAttribute("aria-label", label)
      }
    })
  }, [label])

  const css = useStyle({
    border: "none",
    height: "100%",
    width: "100%",
  })

  return (
    <x3d is="x3d" {...css("class")} ref={x3d}>
      <scene is="x3d">
        <viewpoint is="x3d" position="0,0,5" />
        {children}
      </scene>
    </x3d>
  )
}
