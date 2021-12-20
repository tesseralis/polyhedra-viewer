import Link from "next/link"
import { useStyle } from "styles"

const sections = ["uniform", "capstones", "composite", "elementary"]

export default function Page() {
  const style = useStyle({
    position: "absolute",
    inset: 0,
    backgroundColor: "#111",
  })
  return (
    <div {...style()}>
      <ul>
        {sections.map((section) => {
          return (
            <li key={section}>
              <Link href={`/${section}`}>
                <a>{section}</a>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
