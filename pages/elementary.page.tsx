import GroupLayout from "./[polyhedron]/GroupLayout"
import { snubAntiprisms, othersTwoRows } from "lib/tables"
import PolyhedronTable from "components/MuseumPage/PolyhedronTable"
import { elementary } from "components/HomePage/text"

export default function UniformPage() {
  return (
    <GroupLayout
      position={[-15, 6, 5]}
      zoom={50}
      aspectRatio="2 / 1"
      title="Elementary Johnson Solids"
      text={elementary}
    >
      {(router: any) => {
        return (
          <>
            <group position={[0, 0, 0]}>
              <PolyhedronTable
                navigate={router}
                table={snubAntiprisms}
                colSpacing={5}
              />
            </group>
            <group position={[0, -5, 0]}>
              <PolyhedronTable
                navigate={router}
                table={othersTwoRows}
                colSpacing={5}
              />
            </group>
          </>
        )
      }}
    </GroupLayout>
  )
}
