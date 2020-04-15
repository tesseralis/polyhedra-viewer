import { Polyhedron } from "math/polyhedra"
import { createHookedContext } from "components/common"

const defaultProps = { name: "tetrahedron" }
export default createHookedContext<Polyhedron, "setPolyhedron">(
  {
    setPolyhedron: (polyhedron) => () => polyhedron,
  },
  (props = defaultProps) => Polyhedron.get(props.name),
)
