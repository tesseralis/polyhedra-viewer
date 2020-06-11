import { useEffect } from "react"
import { useLocation } from "react-router-dom"
import ReactGA from "react-ga"

// TODO figure out how to make this just a regular hook
export default function PageTracker() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    ReactGA.pageview(pathname + search)
  }, [pathname, search])
  return null
}
