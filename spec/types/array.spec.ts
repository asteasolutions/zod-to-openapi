import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('array', () => {
  it('supports arrays of strings', () => {
    expectSchema([z.array(z.string()).openapi('Array')], {
      Array: {
        type: 'array',
        items: { type: 'string' },
      },
    });
  });

  it('supports minLength / maxLength on arrays', () => {
    expectSchema([z.array(z.string()).min(5).max(10).openapi('Array')], {
      Array: {
        type: 'array',
        items: { type: 'string' },
        minItems: 5,
        maxItems: 10,
      },
    });
  });

  it.each(['3.0.0', '3.1.0', '3.2.0'] as const)(
    'emits exact array length bounds in OpenAPI %s',
    version => {
      expectSchema(
        [
          z.array(z.string()).length(2).openapi('Pair'),
          z.array(z.string()).length(0).openapi('EmptyArray'),
          z.array(z.string()).min(3).length(2).openapi('ImpossibleArray'),
        ],
        {
          Pair: {
            type: 'array',
            items: { type: 'string' },
            minItems: 2,
            maxItems: 2,
          },
          ImpossibleArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 3,
            maxItems: 2,
          },
          EmptyArray: {
            type: 'array',
            items: { type: 'string' },
            minItems: 0,
            maxItems: 0,
          },
        },
        { version }
      );
    }
  );

  it('can automatically register array items', () => {
    const schema = z.array(z.string().openapi('StringId')).openapi('Array');

    expectSchema([schema], {
      StringId: {
        type: 'string',
      },

      Array: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/StringId',
        },
      },
    });
  });
});
