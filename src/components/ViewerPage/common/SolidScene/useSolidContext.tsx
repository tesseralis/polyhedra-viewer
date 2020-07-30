import { useMemo } from "react"
import tinycolor from "tinycolor2"
import Config from "components/ConfigCtx"
import { PolyhedronCtx, OperationCtx, TransitionCtx } from "../../context"
import { Polyhedron } from "math/polyhedra"
import ClassicalForme from "math/formes/ClassicalForme"

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb()
  return [r / 255, g / 255, b / 255]
}

function createFamilyColor(face: string, vertex: string) {
  return {
    primary: { face, vertex },
    secondary: {
      face: tinycolor(face).darken().spin(15),
      vertex: tinycolor(vertex).darken().spin(15),
    },
  }
}

const classicalColorScheme = {
  3: createFamilyColor("yellow", "magenta"),
  4: createFamilyColor("red", "lime"),
  5: createFamilyColor("blue", "orange"),
}

const orthoFace = "dimgray"
const gyroFace = "lightgray"

function getClassicalColors(forme: ClassicalForme) {
  return forme.geom.faces.map((face) => {
    const facet = forme.getFacet(face)
    if (!facet) {
      return forme.specs.isSnub() ? gyroFace : orthoFace
    }
    const faceSides = face.numSides > 5 ? "secondary" : "primary"
    return classicalColorScheme[forme.specs.data.family][faceSides][facet]
  })
}

const enableFormeColors = false

// Hook that takes data from Polyhedron and Animation states and decides which to use.
export default function useSolidContext() {
  const { colors } = Config.useState()
  const polyhedron = PolyhedronCtx.useState()

  const {
    solidData,
    isTransitioning,
    faceColors = [],
  } = TransitionCtx.useState()
  const { operation, options = {} } = OperationCtx.useState()

  const formeColors = useMemo(() => {
    if (!enableFormeColors) return
    if (polyhedron instanceof ClassicalForme) {
      return getClassicalColors(polyhedron)
    }
  }, [polyhedron])

  // Colors when animation is being applied
  const transitionColors = useMemo(
    () =>
      isTransitioning &&
      solidData!.faces.map((face, i) => faceColors[i] || colors[face.length]),
    [solidData, faceColors, colors, isTransitioning],
  )
  const geom: Polyhedron = polyhedron.geom

  // Colors when in operation mode and hit options are being selected
  const operationColors = useMemo(() => {
    if (!operation) return
    const selectState = operation.faceSelectionStates(polyhedron, options)
    return geom.faces.map((face, i) => {
      switch (selectState[i]) {
        case "selected":
          return tinycolor.mix(colors[face.numSides], "lime")
        case "selectable":
          return tinycolor.mix(colors[face.numSides], "yellow", 25)
        default:
          return colors[face.numSides]
      }
    })
  }, [polyhedron, geom, operation, options, colors])

  const normalizedColors = useMemo(() => {
    const rawColors =
      transitionColors ||
      operationColors ||
      formeColors ||
      geom.faces.map((f) => colors[f.numSides])
    return rawColors.map(toRgb)
  }, [formeColors, transitionColors, operationColors, geom, colors])

  return {
    colors: normalizedColors,
    solidData: isTransitioning ? solidData! : polyhedron.geom.solidData,
  }
}
