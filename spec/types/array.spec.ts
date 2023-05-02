import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('array', () => {
  it('supports arrays of strings', () => {
    expectSchema([registerSchema('Array', z.array(z.string()))], {
      Array: {
        type: 'array',
        items: { type: 'string' },
      },
    });
  });

  it('supports minLength / maxLength on arrays', () => {
    expectSchema(
      [registerSchema('Array', z.array(z.string()).min(5).max(10))],
      {
        Array: {
          type: 'array',
          items: { type: 'string' },
          minItems: 5,
          maxItems: 10,
        },
      }
    );
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
