import { compact } from "lodash-es"

export type FieldOptions<Item extends {}> = {
  [Field in keyof Required<Item>]: Required<Item>[Field][]
}

// TODO put this and gyrate opts, and other stuff in a common location
export type AlignOpts = "meta" | "para"
export const alignOpts: AlignOpts[] = ["meta", "para"]

export function wordJoin(...array: (string | undefined)[]) {
  return compact(array).join(" ")
}

export function prefix(prefix: string = "", rest: string) {
  return `${prefix}${rest}`
}

// The types of prisms available
export type PrismType = "prism" | "antiprism"
export const prismTypes: PrismType[] = ["prism", "antiprism"]

// Represents how many polyhedra to augment
export type Count = 1 | 2 | 3
export type ZeroCount = 0 | Count

export const bools = [false, true]
export const zeroCounts: ZeroCount[] = [0, 1, 2, 3]

const countPrefixes: Record<Count, string> = {
  1: "",
  2: "bi",
  3: "tri",
}

export function countString(count: ZeroCount, base: string) {
  if (count === 0) return ""
  return countPrefixes[count] + base
}
