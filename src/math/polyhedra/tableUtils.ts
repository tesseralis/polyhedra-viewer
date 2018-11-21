import _ from 'lodash';
import { sections } from './tables';
import { toConwayNotation } from './names';

// TODO do some thinking and make a smarter table data structure,
// and come up with a better API for this stuff.
//
// useful operations:
//
// * Rows along a section like "cupola" or "pyramid"
// * Multiple rows

function hasDeep(collection: any, value: string): boolean {
  if (collection instanceof Array) {
    return _.some(collection, item => hasDeep(item, value));
  } else if (collection instanceof Object) {
    return _.some(_.values(collection), item => hasDeep(item, value));
  } else {
    return collection === value;
  }
}

export function inRow(solid: string, sectionName: string, rowName: string) {
  const { rows, data } = sections[sectionName];
  const rowIndex = _.indexOf(rows, rowName);
  const row = data[rowIndex];
  // TODO deal with '!' stuff in tables
  return hasDeep(row, toConwayNotation(solid));
}

export function inColumn(solid: string, sectionName: string, colName: string) {
  const { columns, data } = sections[sectionName];
  const colIndex = _.indexOf(columns, colName);
  return _.some(data, row => hasDeep(row[colIndex], toConwayNotation(solid)));
}

export function inSection(solid: string, sectionName: string) {
  const { data } = sections[sectionName];
  return _.some(data, row => hasDeep(row, toConwayNotation(solid)));
}
