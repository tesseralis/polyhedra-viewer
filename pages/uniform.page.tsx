import GroupLayout from "./[polyhedron]/GroupLayout"
import { classical, prisms } from "lib/tables"
import PolyhedronTable from "components/MuseumPage/PolyhedronTable"

export default function UniformPage() {
  return (
    <GroupLayout position={[-10, 0, 5]} zoom={25} aspectRatio={`8 / 5`}>
      {(router: any) => {
        return (
          <>
            <group position={[0, 0, 0]}>
              <PolyhedronTable navigate={router} table={classical} />
            </group>
            <group position={[23, 0, 0]}>
              <PolyhedronTable navigate={router} table={prisms} />
            </group>
          </>
        )
      }}
    </GroupLayout>
  )
}
