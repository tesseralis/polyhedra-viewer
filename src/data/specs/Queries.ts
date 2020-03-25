import { some } from "lodash-es"
import type Specs from "./PolyhedronSpecs"

// TODO create a mapping and use it when filtering for names
export default class Queries<S extends Specs> {
  entries: S[]
  nameMapping: Map<string, S[]>
  constructor(entries: Iterable<S>) {
    this.entries = [...entries]
    this.nameMapping = new Map()
    for (const entry of this.entries) {
      const name = entry.canonicalName()
      if (!this.nameMapping.has(name)) {
        this.nameMapping.set(name, [])
      }
      this.nameMapping.set(name, [...this.nameMapping.get(name)!, entry])
    }
  }

  hasName(name: string) {
    return this.nameMapping.has(name)
  }

  /**
   * Get the entry with the given canonical name.
   */
  withName(name: string) {
    if (!this.nameMapping.has(name)) {
      throw new Error(`Could not find entry with canonical name ${name}`)
    }
    return this.nameMapping.get(name)![0]
  }

  where(filter: (data: S["data"]) => boolean) {
    return this.entries.filter((entry) => filter(entry.data))
  }

  hasNameWhere(name: string, filter: (data: S["data"]) => boolean) {
    return some(
      this.nameMapping.get(name)!,
      (entry) => entry.canonicalName() === name && filter(entry.data),
    )
  }
}
