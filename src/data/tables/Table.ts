import { uniq, some, isMatch, isFunction } from "lodash-es"
import { getCanonicalName } from "../names"
import { FieldOptions } from "./tableHelpers"

type NameFunc<Item> = (item: Item) => string
type Filter<Item> = Partial<Item> | ((item: Item) => boolean)
type NamedItem<Item> = Item & { name: string }

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
  items: NamedItem<Item>[]
  options: FieldOptions<Item>

  constructor({ items, getName, options }: ConstructorArgs<Item>) {
    // TODO possibly do something more robust than just storing everything in a list
    this.items = [...getNamedItems(items, getName)]
    this.options = options
  }

  /**
   * Get all the items that satisfy the given constraints.
   */
  get(filter?: Filter<Item>) {
    return this.items.filter(item => applyFilter(item, filter))
  }

  /**
   * Get the names of all items that satisfy the given filter.
   */
  getNames(filter?: Filter<Item>) {
    return uniq(this.get(filter).map(item => item.name))
  }

  /**
   * Return `true` if the item name satisfies the given constraints.
   */
  contains(name: string, filter?: Filter<Item>) {
    return some(this.getNames(filter), n => n === name)
  }
}
