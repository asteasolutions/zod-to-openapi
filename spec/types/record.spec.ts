import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('record', () => {
  it('supports records', () => {
    const base = z.object({ a: z.string() });

    const record = z.record(base).openapi({ refId: 'Record' });

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
    const base = z.object({ a: z.string() }).openapi({ refId: 'Base' });

    const record = z.record(base).openapi({ refId: 'Record' });

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
});
