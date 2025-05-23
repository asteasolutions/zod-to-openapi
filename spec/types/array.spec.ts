import { z } from 'zod/v4';
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
