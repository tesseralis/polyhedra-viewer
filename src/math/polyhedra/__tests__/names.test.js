import _ from 'lodash';
import { allSolidNames } from 'data';
import * as names from '../names';

describe('polyhedra names', () => {
  describe('alternate names', () => {
    it('does not coincide with any canonical names', () => {
      _.values(names.alternateNames).forEach(altNames => {
        altNames.forEach(altName => {
          expect(allSolidNames).not.toContain(altName);
        });
      });
    });
  });
});
