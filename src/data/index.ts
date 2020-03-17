export const getPolyhedra = (groupName: string): string[] =>
  require(`./groups/${groupName}.json`)

/* Johnson Solid Subgroups */
export const johnsonSolids = getPolyhedra("johnson")
export const allSolidNames: string[] = [
  ...getPolyhedra("platonic"),
  ...getPolyhedra("archimedean"),
  ...getPolyhedra("prisms"),
  ...getPolyhedra("antiprisms"),
  ...getPolyhedra("johnson"),
]

export const isValidSolid = (solidName: string) => {
  return allSolidNames.includes(solidName)
}

export const getSolidData = (solidName: string) => {
  return require(`data/polyhedra/${solidName.replace(/ /g, "-")}.json`)
}
