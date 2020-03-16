import { uniq, some, isMatch, isFunction } from "lodash-es"
import { getCanonicalName } from "../names"

type NameFunc<Item> = (item: Item) => string
type Filter<Item> = Partial<Item> | ((item: Item) => boolean)
type NamedItem<Item> = Item & { name: string }

function applyFilter<Item extends {}>(item: Item, filter?: Filter<Item>) {
  if (!filter) {
    return item
  }
  if (isFunction(filter)) {
    return filter(item)
  }
  return isMatch(item, filter)
}

function* getNamedItems<Item>(items: Iterable<Item>, nameFunc: NameFunc<Item>) {
  for (const item of items) {
    yield {
      ...item,
      name: getCanonicalName(nameFunc(item)),
    }
  }
}

/**
 * A relational table of named polyhedra. Allows querying for containment
 * and selecting based on filters.
 */
export default class Table<Item extends {}> {
  items: NamedItem<Item>[]

  constructor(items: Iterable<Item>, nameFunc: NameFunc<Item>) {
    // TODO possibly do something more robust than just storing everything in a list
    this.items = [...getNamedItems(items, nameFunc)]
  }

  /**
   * Return `true` if the item name satisfies the given constraints.
   */
  contains(name: string, filter?: Filter<Item>) {
    return some(
      this.items,
      item => item.name === name && applyFilter(item, filter),
    )
  }

  /**
   * Get all the items that satisfy the given constraints.
   */
  get(filter?: Filter<Item>) {
    const filtered = this.items.filter(item => applyFilter(item, filter))

    // TODO we may need to not make this 'uniq'
    return uniq(filtered.map(item => item.name))
  }
}
