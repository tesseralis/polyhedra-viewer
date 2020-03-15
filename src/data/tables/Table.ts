import { uniq, some, isMatch, isFunction } from "lodash-es"
type NameFunc<Item> = (item: Item) => string

type Filter<Item> = Partial<Item> | ((item: Item) => boolean)

function applyFilter<Item extends {}>(item: Item, filter?: Filter<Item>) {
  if (!filter) {
    return item
  }
  if (isFunction(filter)) {
    return filter(item)
  }
  return isMatch(item, filter)
}

type ItemOptions<Item extends {}> = { [K in keyof Item]: Item[K][] }

export default class Table<Item extends {}> {
  items: Item[]
  nameFunc: NameFunc<Item>
  constructor(items: Item[], nameFunc: NameFunc<Item>) {
    this.items = items
    this.nameFunc = nameFunc
  }

  static create<Item>(
    options: ItemOptions<Item>,
    generator: (options: ItemOptions<Item>) => Item[],
    nameFunc: NameFunc<Item>,
  ) {
    return new Table(generator(options), nameFunc)
  }

  /**
   * Return `true` if the item name satisfies the given constraints.
   */
  contains(name: string, filter?: Filter<Item>) {
    return some(
      this.items,
      item => this.nameFunc(item) === name && applyFilter(item, filter),
    )
  }

  /**
   * Get all the items that satisfy the given constraints.
   */
  get(filter?: Filter<Item>) {
    const filtered = this.items.filter(item => applyFilter(item, filter))

    // TODO should we make this uniq here?
    return uniq(filtered.map(item => this.nameFunc(item)))
  }
}
