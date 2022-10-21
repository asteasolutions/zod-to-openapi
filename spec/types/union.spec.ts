import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('union', () => {
  it('supports union types', () => {
    expectSchema([z.string().or(z.number()).openapi({ refId: 'Test' })], {
      Test: {
        anyOf: [{ type: 'string' }, { type: 'number' }],
      },
    });

    expectSchema(
      [
        z
          .string()
          .or(z.number())
          .or(z.array(z.string()))
          .openapi({ refId: 'Test' }),
      ],
      {
        Test: {
          anyOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
      }
    );
  });

  it('supports nullable union types', () => {
    expectSchema(
      [z.string().or(z.number()).nullable().openapi({ refId: 'Test' })],
      {
        Test: {
          anyOf: [{ type: 'string' }, { type: 'number' }, { nullable: true }],
        },
      }
    );
  });
});
