import { z } from 'zod/v4';
import { expectSchema } from '../lib/helpers';

describe('catchall', () => {
  it('generates an additionalProperties schema for objects with catchall', () => {
    const schema = z.object({}).catchall(z.string()).openapi('CatchallObject');

    expectSchema([schema], {
      CatchallObject: {
        type: 'object',
        properties: {},
        additionalProperties: {
          type: 'string',
        },
      },
    });
  });

  it('generates a referenced additionalProperties schema', () => {
    const schema = z
      .object({})
      .catchall(z.string().openapi('SomeString'))
      .openapi('CatchallObject');

    expectSchema([schema], {
      SomeString: {
        type: 'string',
      },
      CatchallObject: {
        type: 'object',
        properties: {},
        additionalProperties: {
          $ref: '#/components/schemas/SomeString',
        },
      },
    });
  });

  it('can override previous catchalls', () => {
    const BaseSchema = z
      .object({ id: z.string() })
      .catchall(z.string())
      .openapi('Base');
    const ExtendedSchema = BaseSchema.extend({ bonus: z.number() })
      .catchall(z.union([z.boolean(), z.number(), z.string()]))
      .openapi('Extended');

    expectSchema([BaseSchema, ExtendedSchema], {
      Base: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' },
        },
        additionalProperties: {
          type: 'string',
        },
      },
      Extended: {
        allOf: [
          { $ref: '#/components/schemas/Base' },
          {
            type: 'object',
            required: ['bonus'],
            properties: {
              bonus: { type: 'number' },
            },
            additionalProperties: {
              anyOf: [
                { type: 'boolean' },
                { type: 'number' },
                { type: 'string' },
              ],
            },
          },
        ],
      },
    });
  });
});
