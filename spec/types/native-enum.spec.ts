import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('native enum', () => {
  it('supports native enums', () => {
    enum NativeEnum {
      OPTION = 'Option',
      ANOTHER = 'Another',
      DEFAULT = 'Default',
    }

    const nativeEnumSchema = z.nativeEnum(NativeEnum).openapi({
      refId: 'NativeEnum',
      description: 'A native enum in zod',
    });

    expectSchema([nativeEnumSchema], {
      NativeEnum: {
        type: 'string',
        description: 'A native enum in zod',
        enum: ['Option', 'Another', 'Default'],
      },
    });
  });

  it.skip('supports native numbers enums', () => {
    enum NativeEnum {
      OPTION = 1,
      ANOTHER = 42,
      DEFAULT = 3,
    }

    const nativeEnumSchema = z.nativeEnum(NativeEnum).openapi({
      refId: 'NativeEnum',
      description: 'A native numbers enum in zod',
    });

    expectSchema([nativeEnumSchema], {
      NativeEnum: {
        type: 'number',
        description: 'A native numbers enum in zod',
        enum: [1, 2, 3],
      },
    });
  });
});
