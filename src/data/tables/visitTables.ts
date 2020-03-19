import { isFunction } from "lodash"
import * as tables from "."

type Tables = typeof tables

type TableVisitor<Result> = {
  [T in keyof Tables]?: (item: ReturnType<Tables[T]["get"]>) => Result
} & { default: () => Result }

const tableList: (keyof Tables)[] = [
  "classicals",
  "prisms",
  "capstones",
  "augmentedPrisms",
  "augmentedClassicals",
  "diminishedIcosahedra",
  "rhombicosidodecahedra",
  "snubAntiprisms",
]

export default function visitTables<Result>(
  name: string,
  visitor: TableVisitor<Result>,
) {
  for (const tableName of tableList) {
    // FIXME try to type this better?
    if (isFunction(visitor[tableName]) && !!tables[tableName].hasName(name)) {
      return visitor[tableName]!(tables[tableName].get(name) as any)
    }
  }
  return visitor.default()
}
