import { GetServerSideProps } from "next"
import ViewerPage from "components/ViewerPage"

export default function Page({ polyhedron, panel }: any) {
  return <ViewerPage name={polyhedron} panel={panel} />
}

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  return {
    props: {
      polyhedron: params?.polyhedron,
      panel: params?.panel,
    },
  }
}
