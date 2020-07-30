import { createHookedContext } from "components/common"
import PolyhedronForme from "math/formes/PolyhedronForme"
import createForme from "math/formes/createForme"
import { getSpecs2 } from "data/specs/getSpecs"
import { getGeometry } from "math/operations/operationUtils"

const defaultProps = { name: "tetrahedron" }
export default createHookedContext<
  PolyhedronForme,
  "setPolyhedron" | "setPolyhedronToName"
>(
  {
    setPolyhedron: (forme) => () => forme,
    setPolyhedronToName: (name) => () => {
      const specs = getSpecs2(name)
      return createForme(specs, getGeometry(specs))
    },
  },
  ({ name } = defaultProps) => {
    const specs = getSpecs2(name)
    return createForme(specs, getGeometry(specs))
  },
)
