import GroupLayout from "./[polyhedron]/GroupLayout"
import { augmented, diminished, rhombicosidodecahedra } from "lib/tables"
import PolyhedronTable from "components/MuseumPage/PolyhedronTable"

export default function UniformPage() {
  return (
    <GroupLayout position={[-3, 0, 5]} zoom={25}>
      {(router: any) => {
        return (
          <>
            <group position={[0, 0, 0]}>
              <PolyhedronTable navigate={router} table={augmented} />
            </group>
            <group position={[22.5, 0, 0]}>
              <PolyhedronTable navigate={router} table={diminished} />
            </group>
            <group position={[22.5, -6.25, 0]}>
              <PolyhedronTable
                navigate={router}
                table={rhombicosidodecahedra}
              />
            </group>
          </>
        )
      }}
    </GroupLayout>
  )
}
