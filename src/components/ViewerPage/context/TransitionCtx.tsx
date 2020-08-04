import { noop } from "lodash-es"

import { Vector3 } from "three"
import React, { useRef, useEffect, useContext, useCallback } from "react"
import { ChildrenProp } from "types"

import { createHookedContext } from "components/common"
import Config from "components/ConfigCtx"
import PolyhedronCtx from "./PolyhedronCtx"
import transition from "transition"
import { Polyhedron, SolidData } from "math/polyhedra"
import { AnimationData } from "math/operations"

// Get the colors for each face given our current configuration
function getFaceColors(mapping: number[], colors: any) {
  return mapping.map((f) => colors[f])
}

const defaultState = {
  solidData: undefined,
  faceColors: undefined,
  isTransitioning: false,
}
interface State {
  solidData?: SolidData
  faceColors?: any[]
  isTransitioning: boolean
}
const InterpModel = createHookedContext<State, "set" | "reset">(
  {
    reset: () => () => defaultState,
    set: (solidData, faceColors) => () => ({
      solidData,
      faceColors,
      isTransitioning: !!solidData,
    }),
  },
  defaultState,
)

const TransitionContext = React.createContext(noop)

function InnerProvider({ children }: ChildrenProp) {
  const transitionId = useRef<ReturnType<typeof transition> | null>(null)
  const { setPolyhedron } = PolyhedronCtx.useActions()
  const config = Config.useState()
  const { colors, animationSpeed, enableAnimation } = config
  const anim = InterpModel.useActions()

  // Cancel the animation if the component we're a part of gets rerendered.
  useEffect(() => {
    return () => {
      if (transitionId.current) {
        transitionId.current.cancel()
      }
    }
  }, [transitionId])
  const transitionFn = useCallback(
    (result: Polyhedron, animationData: AnimationData) => {
      if (!enableAnimation || !animationData) {
        setPolyhedron(result)
        anim.reset()
        return
      }

      const { start, endVertices, startColors, endColors } = animationData
      anim.set(start.solidData, getFaceColors(startColors, colors))

      transitionId.current = transition(
        {
          duration: 1000 / animationSpeed,
          ease: "easeQuadInOut",
          startValue: {
            // FIXME don't use d3 interpolation any more!
            vertices: start.rawSolidData().vertices,
            faceColors: getFaceColors(startColors, colors),
          },
          endValue: {
            vertices: endVertices.map((v) => v.toArray()),
            faceColors: getFaceColors(endColors, colors),
          },
          onFinish: () => {
            setPolyhedron(result)
            anim.reset()
          },
        },
        ({ vertices, faceColors }) => {
          anim.set(
            {
              ...start.solidData,
              vertices: vertices.map((v) => new Vector3(...v)),
            },
            faceColors,
          )
        },
      )
    },
    [anim, animationSpeed, colors, enableAnimation, setPolyhedron],
  )

  return (
    <TransitionContext.Provider value={transitionFn}>
      {children}
    </TransitionContext.Provider>
  )
}

function Provider({ children }: ChildrenProp) {
  return (
    <InterpModel.Provider>
      <InnerProvider>{children}</InnerProvider>
    </InterpModel.Provider>
  )
}

function useTransition() {
  return useContext(TransitionContext)
}

export default {
  Provider,
  useState: InterpModel.useState,
  useTransition,
}
