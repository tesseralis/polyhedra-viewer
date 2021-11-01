import GroupPage from "./GroupPage"

export default function Page({ group }: any) {
  return <GroupPage group={group} />
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
