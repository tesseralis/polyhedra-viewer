import GroupLayout from "./[polyhedron]/GroupLayout"
import { classical, prisms } from "lib/tables"
import PolyhedronTable from "components/MuseumPage/PolyhedronTable"
import { uniform } from "components/HomePage/text"

export default function UniformPage() {
  return (
    <GroupLayout
      position={[-12, 2, 10]}
      zoom={35}
      aspectRatio={`8 / 5`}
      title="Uniform Polyhedra"
      text={uniform}
    >
      {(router: any) => {
        return (
          <>
            <group position={[0, 0, 0]}>
              <PolyhedronTable navigate={router} table={classical} />
            </group>
            <group position={[23, 0, 0]}>
              <PolyhedronTable
                navigate={router}
                table={prisms}
                colSpacing={4}
              />
            </group>
          </>
        )
      }}
    </GroupLayout>
  )
}
