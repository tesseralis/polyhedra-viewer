import Link from "next/link"
import { useStyle } from "styles"

const sections = ["uniform", "capstones", "composite", "elementary"]

export default function Page() {
  const style = useStyle({
    position: "absolute",
    backgroundColor: "#111",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
