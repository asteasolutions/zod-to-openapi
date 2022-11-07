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
});
