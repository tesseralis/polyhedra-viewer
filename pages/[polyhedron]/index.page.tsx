export default function Page() {
  return null
}

export const getServerSideProps = async ({ params }: any) => {
  return {
    redirect: { destination: `${params.polyhedron}/operations` },
  }
}
