import { Polyhedron } from "math/polyhedra"
import { createHookedContext } from "components/common"
import { PolyhedronForme } from "math/operations"
import getSpecs from "data/specs/getSpecs"

const defaultProps = { name: "tetrahedron" }
export default createHookedContext<PolyhedronForme, "setPolyhedron">(
  {
    setPolyhedron: (forme) => () => forme,
  },
  ({ name } = defaultProps) => ({
    // FIXME have this work with alternate names too
    specs: getSpecs(name),
    geom: Polyhedron.get(name),
  }),
)
