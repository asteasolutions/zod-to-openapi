import { objectEquals } from '../src/lib/lodash';

describe('Lodash', () => {
  describe('objectEquals', () => {
    it('can compare plain values', () => {
      expect(objectEquals(3, 4)).toEqual(false);
      expect(objectEquals(3, 3)).toEqual(true);

      expect(objectEquals('3', '4')).toEqual(false);
      expect(objectEquals('3', '3')).toEqual(true);
    });

    it('can compare objects', () => {
      expect(objectEquals({ a: 3 }, { b: 3 })).toEqual(false);
      expect(objectEquals({ a: 3 }, { a: '3' })).toEqual(false);

      expect(objectEquals({ a: 3 }, { a: 3, b: false })).toEqual(false);

      expect(objectEquals({ a: 3 }, { a: 3 })).toEqual(true);
    });

    it('can compare nested objects', () => {
      expect(
        objectEquals(
          { test: { a: ['asd', 3, true] } },
          { test: { a: ['asd', 3, true, { b: null }] } }
        )
      ).toEqual(false);

      expect(
        objectEquals(
          { test: { a: ['asd', 3, true, { b: null }] } },
          { test: { a: ['asd', 3, true, { b: null }] } }
        )
      ).toEqual(true);
    });
  });
});
