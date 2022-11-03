import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('record', () => {
  it.concurrent('supports records', () => {
    const base = z.object({ a: z.string() });

    const record = registerSchema('Record', z.record(base));

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

  it.concurrent('supports records with refs', () => {
    const base = registerSchema('Base', z.object({ a: z.string() }));

    const record = registerSchema('Record', z.record(base));

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
