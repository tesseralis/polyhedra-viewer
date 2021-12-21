import { CSSObject } from "@emotion/css"
type Value = string | number

/* Spacing utilities */

export function marginVert(m: Value): CSSObject {
  return {
    marginTop: m,
    marginBottom: m,
  }
}

export function marginHoriz(m: Value): CSSObject {
  return {
    marginLeft: m,
    marginRight: m,
  }
}

export function margin(vert: Value, horiz: Value = vert): CSSObject {
  return {
    ...marginVert(vert),
    ...marginHoriz(horiz),
  }
}

export function paddingVert(p: Value): CSSObject {
  return {
    paddingTop: p,
    paddingBottom: p,
  }
}

export function paddingHoriz(p: Value): CSSObject {
  return {
    paddingLeft: p,
    paddingRight: p,
  }
}

export function padding(vert: Value, horiz: Value = vert): CSSObject {
  return {
    ...paddingHoriz(horiz),
    ...paddingVert(vert),
  }
}

/* Layout utlities */

export function square(size: Value): CSSObject {
  return {
    width: size,
    height: size,
  }
}

/* Display utilities */

export function flexRow(
  alignItems?: CSSObject["alignItems"],
  justifyContent?: CSSObject["justifyContent"],
): CSSObject {
  return {
    display: "flex",
    flexDirection: "row",
    alignItems,
    justifyContent,
  }
}

export function flexColumn(
  alignItems?: CSSObject["alignItems"],
  justifyContent?: CSSObject["justifyContent"],
): CSSObject {
  return {
    display: "flex",
    flexDirection: "column",
    alignItems,
    justifyContent,
  }
}

/* Position utilities */

export const fullScreen = {
  position: "absolute",
  height: "100%",
  width: "100%",
}

export function absolute(
  vert: "top" | "bottom",
  horiz: "left" | "right",
): CSSObject {
  return {
    position: "absolute",
    [vert]: 0,
    [horiz]: 0,
  }
}

export const absoluteFull: CSSObject = {
  position: "absolute",
  inset: 0,
}

/* Mobile */

export function scroll(direction?: "x" | "y") {
  const prop = `overflow${(direction ?? "").toUpperCase()}`
  return {
    [prop]: "scroll",
    // use momentum scrolling on mobile browsers
    "-webkit-overflow-scrolling": "touch",
  }
}

/* Miscellaneous */

/**
 * Populate the `color` and `fill` properties (useful for icons).
 * @param color the color to fill in
 */
export function colorFill(color: string): CSSObject {
  return {
    color,
    fill: color,
  }
}

/* Themeing */
// TODO  move to new file

export const hover = {
  ":hover:not(:disabled)": {
    backgroundColor: "#333",
    cursor: "pointer",
  },
}

export const link = {
  ...colorFill("MediumBlue"),
  textDecoration: "none",
  ":hover": {
    textDecoration: "underline",
  },
}
