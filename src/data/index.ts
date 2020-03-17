export const getPolyhedraNames = (groupName: string): string[] =>
  require(`./names/${groupName}.json`)

const groups = ["platonic", "archimedean", "prisms", "antiprisms", "johnson"]
export const allSolidNames = groups.flatMap(getPolyhedraNames)

export const isValidSolid = (solidName: string) => {
  return allSolidNames.includes(solidName)
}

export const getSolidData = (solidName: string) => {
  return require(`data/polyhedra/${solidName.replace(/ /g, "-")}.json`)
}
