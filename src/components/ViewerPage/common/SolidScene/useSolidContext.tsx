import { useMemo } from "react"
import tinycolor from "tinycolor2"
import Config from "components/ConfigCtx"
import { PolyhedronCtx, OperationCtx, TransitionCtx } from "../../context"
import { Polyhedron } from "math/polyhedra"
import ClassicalForme from "math/formes/ClassicalForme"
import CapstoneForme from "math/formes/CapstoneForme"

function toRgb(hex: string) {
  const { r, g, b } = tinycolor(hex).toRgb()
  return [r / 255, g / 255, b / 255]
}

function createFamilyColor(face: string, vertex: string) {
  return {
    primary: { face, vertex },
    secondary: {
      face: tinycolor(face).darken(20),
      vertex: tinycolor(vertex).darken(20),
    },
    edge: {
      ortho: tinycolor.mix(face, vertex, 50).desaturate(10),
      gyro: tinycolor.mix(face, vertex, 50).lighten(20),
    },
  }
}

const classicalColorScheme = {
  // yellow + purple
  3: createFamilyColor("#ffea00", "#db39ce"),
  // red + green
  4: createFamilyColor("#e00909", "#22e34c"),
  // blue + orange
  5: createFamilyColor("#2c65de", "#ff9100"),
}

const orthoFace = "dimgray"
const gyroFace = "lightgray"

function getClassicalColors(forme: ClassicalForme) {
  const scheme = classicalColorScheme[forme.specs.data.family]
  return forme.geom.faces.map((face) => {
    const facet = forme.getFacet(face)
    // thing for the edge face
    if (!facet) {
      return scheme.edge[forme.specs.isSnub() ? "gyro" : "ortho"]
    }
    const faceSides = face.numSides > 5 ? "secondary" : "primary"
    return scheme[faceSides][facet]
  })
}

function getCapstoneColors(forme: CapstoneForme) {
  return forme.geom.faces.map((face) => {
    if (forme.isBaseTop(face)) {
      const faceSides = face.numSides > 5 ? "secondary" : "primary"
      return (classicalColorScheme as any)[forme.specs.data.base][faceSides]
        .face
    } else if (forme.inBase(face)) {
      if (face.numSides === 3) {
        return (classicalColorScheme as any)[forme.specs.data.base].primary
          .vertex
      } else if (face.numSides === 4) {
        // FIXME need to distinguish this from the edge faces
        return orthoFace
      } else {
        // TODO want this to be a separate color from the top face
        return classicalColorScheme[5].primary.face
      }
    } else {
      return forme.specs.isElongated() ? orthoFace : gyroFace
    }
  })
}

const enableFormeColors = true

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
    } else if (polyhedron instanceof CapstoneForme) {
      return getCapstoneColors(polyhedron)
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
