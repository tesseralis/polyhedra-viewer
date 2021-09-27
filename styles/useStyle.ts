import { useMemo } from "react"
// import { StyleSheet, css, CSSProperties } from "aphrodite/no-important"
import { css, CSSObject } from "@emotion/css"

/**
 * Hook that allows you to define dynamic (or static) css for use in a component.
 *
 * @param styles The CSS properties to compile
 * @param deps list of dependencies (like in useMemo). *Unlike* useMemo and useEffect,
 * this defaults to [], meaning your styles won't be recalculated at each render
 * (since this is the most common case)
 * @returns a function to compile the style that takes in an optional `prop` parameter
 * (default `className`).
 * 
 * Examples:
 *
 * ```
 // Normal usage
 function Component1() {
   const css = useStyle({ margin: '1rem' })
   return <div {...css()}>My Component</div>
 }
 
 // Pass in props
 function Component2({ type }) {
   const css = useStyle({
     color: type === 'primary' ? 'blue' : 'white'
   }, [type])
   return <button {...css()}>Click Me</button>
 }
 
 // Choose prop name
 function CustomLink() {
   const css = useStyle({ color: 'gray' })
   const activeCss = useStyle({ color: 'black' })
 
   // React Router `Link` component
   return <Link {...css()} {...activeCss('activeClassName')}>Click Me</Link>
 }
 ```
 */
export default function useStyle(styles: CSSObject, deps: unknown[] = []) {
  return useMemo(() => {
    return (prop = "className") => ({
      [prop]: css(styles),
    })
    // eslint-disable-next-line
  }, [styles, ...deps])
}
