import GroupLayout from "./[polyhedron]/GroupLayout"
import { snubAntiprisms, others } from "lib/tables"
import PolyhedronTable from "components/MuseumPage/PolyhedronTable"

export default function UniformPage() {
  return (
    <GroupLayout position={[-3, 0, 5]} zoom={25}>
      {(router: any) => {
        return (
          <>
            <group position={[0, 0, 0]}>
              <PolyhedronTable navigate={router} table={snubAntiprisms} />
            </group>
            <group position={[0, -5, 0]}>
              <PolyhedronTable navigate={router} table={others} />
            </group>
          </>
        )
      }}
    </GroupLayout>
  )
}
