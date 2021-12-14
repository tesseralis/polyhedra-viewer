import GroupLayout from "./[polyhedron]/GroupLayout"
import { augmented, diminished, rhombicosidodecahedra } from "lib/tables"
import PolyhedronTable from "components/MuseumPage/PolyhedronTable"

export default function UniformPage() {
  return (
    <GroupLayout position={[-7, -7, 5]} zoom={22.5} aspectRatio={"8 / 7"}>
      {(router: any) => {
        return (
          <>
            <group position={[0, 0, 0]}>
              <PolyhedronTable
                navigate={router}
                table={augmented}
                colSpacing={5.5}
              />
            </group>
            <group position={[19, 0, 0]}>
              <PolyhedronTable navigate={router} table={diminished} />
            </group>
            <group position={[19, -6.25, 0]}>
              <PolyhedronTable
                navigate={router}
                table={rhombicosidodecahedra}
                colSpacing={6}
              />
            </group>
          </>
        )
      }}
    </GroupLayout>
  )
}
