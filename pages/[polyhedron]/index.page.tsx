import GroupLayout from "./GroupLayout"
import { tableSections } from "lib/tables"
import PolyhedronTable from "components/MuseumPage/PolyhedronTable"

export default function Page({ group }: any) {
  const table = tableSections.find((table) => table.id === group)!
  return (
    <GroupLayout>
      {(router: any) => {
        return table.tables?.map((table, j) => {
          return (
            <group key={table.caption} position={[j * subsecSpacing, 0, 0]}>
              <PolyhedronTable navigate={router} table={table} />
            </group>
          )
        })
      }}
    </GroupLayout>
  )
}

export const getServerSideProps = async ({ params }: any) => {
  if (groups.includes(params.polyhedron)) {
    return {
      props: {
        group: params.polyhedron,
      },
    }
  }
  return {
    redirect: { destination: `${params.polyhedron}/operations` },
  }
}

const groups = ["uniform", "capstones", "composite", "elementary"]

// TODO deduplicate with the controls in the other scene
const sectionSpacing = 50
const subsecSpacing = 20
