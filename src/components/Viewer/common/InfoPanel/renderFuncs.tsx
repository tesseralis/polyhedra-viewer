import React from "react"
import { capitalize, map } from "lodash"
import { ChildrenProp } from "types"
import { polygonNames } from "math/polygons"
import { Polyhedron } from "math/polyhedra"
import { useStyle } from "styles"

export function Sub({ children }: ChildrenProp) {
  const css = useStyle({
    verticalAlign: "sub",
    fontSize: "smaller",
  })
  return <sub {...css()}>{children}</sub>
}

export function Sup({ children }: ChildrenProp<number>) {
  if (typeof children === "undefined") {
    throw new Error("undefined child")
  }
  if (children < 0 || children > 5) {
    throw new Error("Number not supported")
  }
  const value = (() => {
    switch (children) {
      case 1:
        return <>&#x00B9;</>
      case 2:
        return <>&#x00B2;</>
      case 3:
        return <>&#x00B3;</>
      case 4:
        return <>&#x2074;</>
      case 5:
        return <>&#x2075;</>
      default:
        return children
    }
  })()
  const css = useStyle({ fontSize: 20 })
  return <sup {...css()}>{value}</sup>
}

function groupedVertexConfig(config: string) {
  const array = config.split(".")
  let current = { type: "", count: 0 }
  const result: typeof current[] = []
  for (const type of array) {
    if (type === current.type) {
      current.count++
    } else {
      if (current.count) result.push(current)
      current = { type, count: 1 }
    }
  }
  if (current.count) result.push(current)

  return result
}

function getShortVertexConfig(config: string) {
  const grouped = groupedVertexConfig(config)
  const children = grouped.map((typeCount, i) => {
    const { type, count } = typeCount
    const val =
      count === 1 ? (
        type
      ) : (
        <>
          {type}
          <Sup>{count}</Sup>
        </>
      )
    if (i === 0) return val
    return <>.{val}</>
  })
  return <>{children}</>
}

export interface RenderProps {
  polyhedron: Polyhedron
}

export function displayVertexConfig({ polyhedron }: RenderProps) {
  const vConfig = polyhedron.vertexConfiguration()
  const configKeys = Object.keys(vConfig)
  // When there's only one type, just get it on its own
  if (configKeys.length === 1) return <>{configKeys[0]}</>
  return (
    <ul>
      {map(vConfig, (count, type) => (
        <li key={type}>
          {count}({getShortVertexConfig(type)})
        </li>
      ))}
    </ul>
  )
}

export function displayFaceTypes({ polyhedron }: RenderProps) {
  const faceCounts = polyhedron.numFacesBySides()
  // TODO verify order by type of face
  return (
    <ul>
      {map(faceCounts, (count, type) => (
        <li key={type}>
          {count} {polygonNames.get(type as any)}
          {count !== 1 ? "s" : ""}
        </li>
      ))}
    </ul>
  )
}

export function displaySymmetry({ polyhedron }: RenderProps) {
  const symmetry = polyhedron.symmetry()
  const symName = polyhedron.symmetryName()
  const { group = "", sub } = symmetry
  return (
    <>
      {capitalize(symName)}, {group}
      {sub ? <Sub>{sub}</Sub> : undefined}
    </>
  )
}

interface Properties {
  name: string
  check(p: Polyhedron): boolean
}

const properties: Properties[] = [
  { name: "deltahedron", check: p => p.isDeltahedron() },
  { name: "chiral", check: p => p.isChiral() },
  { name: "honeycomb", check: p => p.isHoneycomb() },
  { name: "quasiregular", check: p => p.isQuasiRegular() },
]

export function displayProperties({ polyhedron }: RenderProps) {
  const filteredProps = properties.filter(property =>
    property.check(polyhedron),
  )

  return <>{filteredProps.map(prop => prop.name).join(", ") || "--"}</>
}
