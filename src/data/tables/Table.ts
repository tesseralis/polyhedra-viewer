import { uniq, some, isMatch, isFunction } from "lodash-es"
import { getSingle } from "utils"
import { getCanonicalName } from "../alternates"
import { FieldOptions } from "./tableHelpers"

type NameFunc<Item> = (item: Item) => string
type Filter<Item> = Partial<Item> | ((item: Item) => boolean)
type Named<Item> = Item & { name: string }

interface ConstructorArgs<Item> {
  items: Iterable<Item>
  getName: NameFunc<Item>
  options: FieldOptions<Item>
}

function applyFilter<Item extends {}>(item: Item, filter?: Filter<Item>) {
  if (!filter) {
    return true
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
  items: Named<Item>[]
  options: FieldOptions<Item>

  constructor({ items, getName, options }: ConstructorArgs<Item>) {
    // TODO possibly do something more robust than just storing everything in a list
    this.items = [...getNamedItems(items, getName)]
    this.options = options
  }

  /**
   * Get all the items that satisfy the given constraints.
   */
  getAll(filter?: Filter<Item>) {
    return this.items.filter(item => applyFilter(item, filter))
  }

  /**
   * Get the names of all items that satisfy the given filter.
   */
  getAllNames(filter?: Filter<Item>) {
    return uniq(this.getAll(filter).map(item => item.name))
  }

  /**
   * Get the item with the given name that satisfies the given filters.
   * @throws Error if no such item exists or multiple items exist.
   */
  get(name: string, filter?: Filter<Item>) {
    return getSingle(this.getAll(filter).filter(item => item.name === name))
  }

  /**
   * Get the name of the item that satisfies the given filters.
   * @throws Error if multiple items exist or no such item exists.
   */
  getName(filter?: Filter<Item>) {
    return getSingle(this.getAll(filter)).name
  }

  /**
   * Return `true` if the table has the item that satisfies the given filter.
   */
  has(filter?: Filter<Item>) {
    return some(this.items, item => applyFilter(item, filter))
  }

  /**
   * Return `true` if the item name satisfies the given constraints.
   */
  hasName(name: string, filter?: Filter<Item>) {
    return some(
      this.items,
      item => applyFilter(item, filter) && item.name === name,
    )
  }
}
