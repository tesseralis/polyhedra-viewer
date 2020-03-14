import { isMatch, filter } from "lodash"
type NameFunc<T> = (item: T) => string

export default class Category<T extends {}> {
  items: T[]
  nameFunc: NameFunc<T>
  constructor(items: T[], nameFunc: NameFunc<T>) {
    this.items = items
    this.nameFunc = nameFunc
  }

  /**
   * Return `true` if the item name satisfies the given constraints.
   */
  contains(name: string, constraints?: Partial<T>) {
    const item = this.items.find(item => this.nameFunc(item) === name)
    if (!item) {
      return false
    }
    if (!constraints) {
      return true
    }
    return isMatch(item, constraints)
  }

  /**
   * Get all the items that satisfy the given constraints.
   */
  getAll(constraints: Partial<T>) {
    // FIXME this ain't gonna typecheck correctly
    return filter(this.items, constraints)
  }
}
