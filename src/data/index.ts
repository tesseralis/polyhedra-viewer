import { escape } from "utils"
export const getPolyhedraNames = (groupName: string): string[] =>
  require(`./names/${groupName}.json`)

const groups = ["platonic", "archimedean", "prisms", "antiprisms", "johnson"]
export const allSolidNames = groups.flatMap(getPolyhedraNames)

export function isValidSolid(solidName: string) {
  return allSolidNames.includes(solidName)
}

export function assertValidSolid(solidName: string) {
  if (!isValidSolid(solidName)) {
    throw new Error(`Invalid polyhedron name: ${solidName}`)
  }
  return solidName
}

export function getSolidData(solidName: string) {
  return require(`data/polyhedra/${escape(assertValidSolid(solidName))}.json`)
}
