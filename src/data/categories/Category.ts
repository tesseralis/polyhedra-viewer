import { filter } from "lodash"
type NameFunc<T> = (item: T) => string

export default class Category<T extends {}> {
  items: T[]
  nameFunc: NameFunc<T>
  constructor(items: T[], nameFunc: NameFunc<T>) {
    this.items = items
    this.nameFunc = nameFunc
  }

  contains(name: string, constraints: Partial<T>) {
    const item = this.items.find(item => this.nameFunc(item) === name)
    // TODO check for constraints
    return !!item
  }

  getAll(constraints: Partial<T>) {
    // FIXME this ain't gonna typecheck correctly
    return filter(this.items, constraints)
  }
}
