import { Polyhedron } from "math/polyhedra"
import { createHookedContext } from "components/common"
import PolyhedronForme from "math/formes/PolyhedronForme"
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
      // FIXME these won't have the right functions defined
      return {
        specs,
        geom: Polyhedron.get(specs.canonicalName()),
      }
    },
  },
  ({ name } = defaultProps) => {
    const specs = getSpecs2(name)
    return {
      specs,
      geom: Polyhedron.get(specs.canonicalName()),
    }
  },
)
