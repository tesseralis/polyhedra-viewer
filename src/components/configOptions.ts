import { startCase, set } from "lodash-es"
import { polygons, polygonNames } from "specs"

// Colors from d3-scale-chromatic:
// https://github.com/d3/d3-scale-chromatic#schemeCategory10
const defaultColors = {
  3: "#ff7f00",
  4: "#e41a1c",
  5: "#377eb8",
  6: "#4daf4a",
  8: "#a65628",
  10: "#984ea3",
}

interface BaseConfigInput<T = any> {
  key: string
  type: string
  default: T
  options?: number[]
  display?: string
}

export interface ConfigInput<T = any> extends BaseConfigInput<T> {
  display: string
}

const colorOptionsList = polygons.map((n) => {
  return {
    key: `colors[${n}]`,
    display: `${startCase(polygonNames.get(n))} Color`,
    type: "color",
    default: defaultColors[n],
  }
})

export const configInputs: ConfigInput[] = [
  {
    key: "showEdges",
    type: "checkbox",
    default: true,
  },
  {
    key: "showFaces",
    type: "checkbox",
    default: true,
  },
  {
    key: "showInnerFaces",
    type: "checkbox",
    default: true,
  },
  {
    key: "enalbeFormeColors",
    type: "checkbox",
    default: false,
  },
  {
    key: "opacity",
    type: "range",
    default: 1.0,
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "enableAnimation",
    type: "checkbox",
    default: true,
  },
  {
    key: "animationSpeed",
    type: "select",
    options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2],
    default: 1,
  },
  ...colorOptionsList,
].map((input: BaseConfigInput) => ({
  ...input,
  display: input?.display ?? startCase(input.key),
}))

export const defaultConfig: Record<string, any> = configInputs.reduce(
  (obj, option) => set(obj, option.key, option.default),
  {},
)
