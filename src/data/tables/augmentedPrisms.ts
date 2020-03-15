import { range } from "lodash-es"

import { polygonPrefixes } from "../polygons"
import Table from "./Table"
import {
  Count,
  AlignOpts,
  alignOpts,
  prefix,
  wordJoin,
  countString,
} from "./tableHelpers"

type FaceType = 3 | 4 | 5 | 6
const faceTypes: FaceType[] = [3, 4, 5, 6]

interface Item {
  n: FaceType
  count: Count
  align?: AlignOpts
}

function getCounts(n: FaceType) {
  const limit = [3, 6].includes(n) ? 3 : 2
  return range(1, limit + 1) as Count[]
}

function* getItems() {
  for (const n of faceTypes) {
    for (const count of getCounts(n)) {
      if (n === 6 && count === 2) {
        for (const align of alignOpts) {
          yield { n, count, align }
        }
      } else {
        yield { n, count }
      }
    }
  }
}

function name({ n, count, align }: Item) {
  return prefix(
    align,
    wordJoin(countString(count, "augmented"), polygonPrefixes.get(n), "prism"),
  )
}

export default new Table([...getItems()], name)
