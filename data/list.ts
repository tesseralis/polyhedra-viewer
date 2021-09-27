import { getPolyhedraNames } from "./common"

const uniformData = [
  { name: "platonic", display: "Platonic Solids" },
  { name: "archimedean", display: "Archimedean Solids" },
  { name: "prisms", display: "Prisms" },
  { name: "antiprisms", display: "Antiprisms" },
]

const johnsonSubgroups = [
  { name: "pyramids", index: 0 },
  { name: "cupolæ and rotunda", index: 2 },
  { name: "elongated pyramids", index: 6 },
  { name: "gyroelongated pyramids", index: 9 },
  { name: "bipyramids", index: 11 },
  { name: "elongated cupolæ / rotundæ", index: 17 },
  { name: "gyroelongated cupolæ / rotundæ", index: 21 },
  { name: "bicupolæ / rotundæ", index: 25 },
  { name: "elongated bicupolæ / rotundæ", index: 34 },
  {
    name: "gyroelongated bicupolæ / rotundæ",
    index: 43,
  },
  { name: "augmented prisms", index: 48 },
  { name: "augmented dodecahedra", index: 57 },
  { name: "diminished icosahedra", index: 61 },
  {
    name: "augmented Archimedean solids",
    index: 64,
  },
  { name: "gyrate rhombicosidodecahedra", index: 71 },
  { name: "diminished rhombicosidodecahedra", index: 75 },
  { name: "snub antiprisms", index: 83 },
  { name: "others", index: 85 },
]

export interface PolyhedronSubgroup {
  name: string
  polyhedra: string[]
}

export interface PolyhedronGroup {
  name: string
  groups: PolyhedronSubgroup[]
}

function getUniformPolyhedra(): PolyhedronSubgroup[] {
  return uniformData.map(({ name, display }) => ({
    name: display,
    polyhedra: getPolyhedraNames(name),
  }))
}

function getEndIndex(i: number) {
  return i === johnsonSubgroups.length - 1 ? 92 : johnsonSubgroups[i + 1].index
}

function getJohnsonPolyhedra(): PolyhedronSubgroup[] {
  return johnsonSubgroups.map(({ name, index }, i) => ({
    name,
    polyhedra: getPolyhedraNames("johnson").slice(index, getEndIndex(i)),
  }))
}

export const groups: PolyhedronGroup[] = [
  { name: "Uniform Polyhedra", groups: getUniformPolyhedra() },
  { name: "Johnson Solids", groups: getJohnsonPolyhedra() },
]
