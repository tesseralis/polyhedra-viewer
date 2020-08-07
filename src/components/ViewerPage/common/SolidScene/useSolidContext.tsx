import { Color } from "three"
import { useMemo, useCallback } from "react"
import Config from "components/ConfigCtx"
import { PolyhedronCtx, OperationCtx, TransitionCtx } from "../../context"
import { Polyhedron } from "math/polyhedra"
import getFormeColors from "./getFormeColors"

function toColor(color: any): Color {
  if (color instanceof Color) return color
  if (color.color) {
    return { ...color, color: new Color(color.color) }
  }
  return new Color(color)
}

function lighten(color: Color, amount: number) {
  return toColor(color)
    .clone()
    .offsetHSL(0, 0, amount / 100)
}

// Hook that takes data from Polyhedron and Animation states and decides which to use.
export default function useSolidContext() {
  const { enableFormeColors, colors } = Config.useState()
  const polyhedron = PolyhedronCtx.useState()

  const {
    solidData,
    isTransitioning,
    faceColors = [],
  } = TransitionCtx.useState()
  const { operation, options = {} } = OperationCtx.useState()

  const getSelectionColor = useCallback(
    (face, color) => {
      if (!operation) return color
      switch (operation.selectionState(face, polyhedron, options)) {
        case "selected":
          return lighten(color, 25)
        case "selectable":
          return lighten(color, 10)
        default:
          return color
      }
    },
    [operation, options, polyhedron],
  )

  const formeColors = useMemo(() => {
    if (!enableFormeColors) return
    return polyhedron.geom.faces.map(
      (f) => getFormeColors(polyhedron, f),
      // getSelectionColor(f, getFormeColors(polyhedron, f)),
    )
  }, [polyhedron, enableFormeColors])

  // Colors when animation is being applied
  const transitionColors = useMemo(() => {
    return isTransitioning && faceColors
  }, [faceColors, isTransitioning])
  const geom: Polyhedron = polyhedron.geom

  // Colors when in operation mode and hit options are being selected
  const operationColors = useMemo(() => {
    return geom.faces.map((face) =>
      getSelectionColor(face, colors[face.numSides]),
    )
  }, [colors, geom.faces, getSelectionColor])

  const normalizedColors: Color[] = useMemo(() => {
    const rawColors =
      transitionColors ||
      formeColors ||
      operationColors ||
      geom.faces.map((f) => colors[f.numSides])
    return rawColors
  }, [formeColors, transitionColors, operationColors, geom, colors])

  return {
    colors: normalizedColors,
    solidData: isTransitioning ? solidData! : polyhedron.geom.solidData,
  }
}
