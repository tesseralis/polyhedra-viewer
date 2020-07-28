import { Polyhedron } from "math/polyhedra"
import { createHookedContext } from "components/common"
import PolyhedronForme from "math/formes/PolyhedronForme"
import createForme from "math/formes/createForme"
import { getSpecs2 } from "data/specs/getSpecs"

const defaultProps = { name: "tetrahedron" }
export default createHookedContext<
  PolyhedronForme<any>,
  "setPolyhedron" | "setPolyhedronToName"
>(
  {
    setPolyhedron: (forme) => () => forme,
    setPolyhedronToName: (name) => () => {
      const specs = getSpecs2(name)
      return createForme(specs, Polyhedron.get(specs.canonicalName()))
    },
  },
  ({ name } = defaultProps) => {
    const specs = getSpecs2(name)
    return createForme(specs, Polyhedron.get(specs.canonicalName()))
  },
)
