import { allSolidNames } from "data"

export const alternateNamesMapping: Record<string, string[]> = {
  tetrahedron: ["triangular pyramid", "digonal antiprism", "disphenoid"],
  cube: ["square prism"],
  octahedron: ["tetratetrahedron", "triangular antiprism", "square bipyramid"],
  icosahedron: [
    "snub tetrahedron",
    "snub tetratetrahedron",
    "gyroelongated pentagonal bipyramid",
    "snub triangular antiprism",
  ],
  cuboctahedron: ["rhombitetratetrahedron", "triangular gyrobicupola"],
  "truncated octahedron": ["truncated tetratetrahedron"],
  rhombicuboctahedron: ["elongated square orthobicupola"],
  "snub cube": ["snub cuboctahedron"],
  icosidodecahedron: ["pentagonal gyrobirotunda"],
  "snub dodecahedron": ["snub icosidodecahedron"],

  // fastigium
  "triangular prism": ["fastigium", "digonal cupola"],
  gyrobifastigium: ["digonal gyrobicupola"],

  // related to augmented/diminished/gyrate solids
  "pentagonal antiprism": ["parabidiminished icosahedron"],
  "gyroelongated pentagonal pyramid": ["diminished icosahedron"],
  "square pyramid": ["diminished octahedron"],

  "triangular bipyramid": ["augmented tetrahedron"],
  "elongated square pyramid": ["augmented cube", "augmented square prism"],
  "elongated square bipyramid": [
    "biaugmented cube",
    "biaugmented square prism",
  ],

  "elongated square gyrobicupola": [
    "pseudorhombicuboctahedron",
    "gyrate rhombicuboctahedron",
  ],
  "elongated square cupola": ["diminished rhombicuboctahedron"],
  "octagonal prism": ["bidiminished rhombicuboctahedron"],
}
function* getCanonicalMapping() {
  for (const [canonical, alts] of Object.entries(alternateNamesMapping)) {
    for (const alt of alts) {
      yield [alt, canonical]
    }
  }
}

const canonicalMapping = Object.fromEntries(getCanonicalMapping())
const alternateNames = Object.keys(canonicalMapping)

export function getCanonicalName(name: string) {
  if (allSolidNames.includes(name)) {
    return name
  }
  const canonical = canonicalMapping[name]
  if (!canonical) throw new Error(`Cannot find canonical name for ${name}`)
  return canonical
}

export function getAlternateNames(name: string) {
  return alternateNamesMapping[name] ?? []
}

export function isAlternateName(name: string) {
  return alternateNames.includes(name)
}
