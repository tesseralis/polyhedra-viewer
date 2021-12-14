import GroupLayout from "./[polyhedron]/GroupLayout"
import { capstones } from "lib/tables"
import PolyhedronTable from "components/MuseumPage/PolyhedronTable"

export default function UniformPage() {
  return (
    <GroupLayout position={[-1, 0, 5]} zoom={23}>
      {(router: any) => {
        return (
          <group position={[0, 0, 0]}>
            <PolyhedronTable navigate={router} table={capstones} />
          </group>
        )
      }}
    </GroupLayout>
  )
}
