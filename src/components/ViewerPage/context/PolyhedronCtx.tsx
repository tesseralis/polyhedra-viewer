import { createHookedContext } from "components/common"
import { getSpecs } from "specs"
import { PolyhedronForme, createForme } from "math/formes"
import { getGeometry } from "math/operations/operationUtils"

const defaultProps = { name: "tetrahedron" }
export default createHookedContext<
  PolyhedronForme,
  "setPolyhedron" | "setPolyhedronToName"
>(
  {
    setPolyhedron: (forme) => () => forme,
    setPolyhedronToName: (name) => (current) => {
      const specs = getSpecs(name)
      if (current.specs.canonicalName() === specs.canonicalName()) {
        return createForme(specs, current.geom)
      }
      return createForme(specs, getGeometry(specs))
    },
  },
  ({ name } = defaultProps) => {
    const specs = getSpecs(name)
    return createForme(specs, getGeometry(specs))
  },
)
