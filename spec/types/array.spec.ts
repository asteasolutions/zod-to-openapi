import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('array', () => {
  it('supports arrays of strings', () => {
    expectSchema([z.array(z.string()).openapi({ refId: 'Array' })], {
      Array: {
        type: 'array',
        items: { type: 'string' },
      },
    });
  });

  it('supports minLength / maxLength on arrays', () => {
    expectSchema(
      [z.array(z.string()).min(5).max(10).openapi({ refId: 'Array' })],
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
