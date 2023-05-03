import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('record', () => {
  it('supports records', () => {
    const base = z.object({ a: z.string() });

    const record = z.record(base).openapi('Record');

    expectSchema([base, record], {
      Record: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            a: { type: 'string' },
          },
          required: ['a'],
        },
      },
    });
  });

  it('supports records with refs', () => {
    const base = z.object({ a: z.string() }).openapi('Base');

    const record = z.record(base).openapi('Record');

    expectSchema([base, record], {
      Base: {
        type: 'object',
        properties: {
          a: { type: 'string' },
        },
        required: ['a'],
      },
      Record: {
        type: 'object',
        additionalProperties: {
          $ref: '#/components/schemas/Base',
        },
      },
    });
  });

  it('can automatically register record items', () => {
    const schema = z.record(z.number().openapi('NumberId')).openapi('Record');

    expectSchema([schema], {
      NumberId: {
        type: 'number',
      },

      Record: {
        type: 'object',
        additionalProperties: {
          $ref: '#/components/schemas/NumberId',
        },
      },
    });
  });
});
