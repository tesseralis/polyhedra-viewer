import type Structure from "./Structure"

export default class Queries<S extends Structure> {
  entries: S[]
  constructor(entries: Iterable<S>) {
    this.entries = [...entries]
  }

  /**
   * Get the entry with the given canonical name.
   */
  withName(name: string) {
    const entry = this.entries.find((entry) => entry.canonicalName() === name)
    if (!entry) {
      throw new Error(`Could not find entry with canonical name ${name}`)
    }
    return entry
  }

  where(filter: (data: S["data"]) => boolean) {
    return this.entries.filter((entry) => filter(entry.data))
  }
}
