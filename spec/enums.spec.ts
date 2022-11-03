import { enumInfo } from '../src/lib/enum-info';

describe('Enums', () => {
  describe('enumInfo', () => {
    it.concurrent('can extract enum values from string enum', () => {
      enum Test {
        A = 'test-1',
        B = 'test-2',
      }

      const { values, type } = enumInfo(Test);

      expect(values).toEqual(['test-1', 'test-2']);
      expect(type).toEqual('string');
    });

    it.concurrent('can extract enum values from numeric enum', () => {
      enum Test {
        A = 31,
        B = 42,
      }

      const { values, type } = enumInfo(Test);

      expect(values).toEqual([31, 42]);
      expect(type).toEqual('numeric');
    });

    it.concurrent('can extract enum values from auto-incremented enum', () => {
      enum Test {
        A,
        B,
      }

      const { values, type } = enumInfo(Test);

      expect(values).toEqual([0, 1]);
      expect(type).toEqual('numeric');
    });

    it.concurrent('can extract enum values from mixed enums', () => {
      enum Test {
        A = 42,
        B = 'test',
      }

      const { values, type } = enumInfo(Test);

      expect(values).toEqual([42, 'test']);
      expect(type).toEqual('mixed');
    });
  });
});
