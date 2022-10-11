import { extractEnumValues } from '../src/lib/enums';

describe('Enums', () => {
  describe('extractEnumValues', () => {
    it('can extract enum values from string enum', () => {
      enum Test {
        A = 'test-1',
        B = 'test-2',
      }

      const { values, isNumeric } = extractEnumValues(Test);

      expect(values).toEqual(['test-1', 'test-2']);
      expect(isNumeric).toEqual(false);
    });

    it('can extract enum values from numeric enum', () => {
      enum Test {
        A = 31,
        B = 42,
      }

      const { values, isNumeric } = extractEnumValues(Test);

      expect(values).toEqual([31, 42]);
      expect(isNumeric).toEqual(true);
    });

    it('can extract enum values from auto-incremented enum', () => {
      enum Test {
        A,
        B,
      }

      const { values, isNumeric } = extractEnumValues(Test);

      expect(values).toEqual([0, 1]);
      expect(isNumeric).toEqual(true);
    });

    it('can extract enum values from mixed enums', () => {
      enum Test {
        A = 42,
        B = 'test',
      }

      const { values, isNumeric } = extractEnumValues(Test);

      expect(values).toEqual(['42', 'test']);
      expect(isNumeric).toEqual(false);
    });
  });
});
