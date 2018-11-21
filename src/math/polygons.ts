const polygons = [3, 4, 5, 6, 8, 10];
export default polygons;

export type PolygonMap<T> = { [n: number]: T };

export const polygonNames: PolygonMap<string> = {
  3: 'triangle',
  4: 'square',
  5: 'pentagon',
  6: 'hexagon',
  8: 'octagon',
  10: 'decagon',
};

export const polygonPrefixes: PolygonMap<string> = {
  3: 'triangular',
  4: 'square',
  5: 'pentagonal',
  6: 'hexagonal',
  8: 'octagonal',
  10: 'decagonal',
};
