import { z } from 'zod/v4-mini';
import { expectSchema, registerSchemas } from '../lib/helpers';

describe('zod mini - catchall', () => {
  it('generates an additionalProperties schema for objects with catchall', () => {
    const schema = z.catchall(z.object({}), z.string());

    registerSchemas({ CatchallObject: schema });

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
    const fallback = z.string();
    const schema = z.catchall(z.object({}), fallback);

    registerSchemas({ CatchallObject: schema, SomeString: fallback });

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

  it('can override previous catchalls BUT looses Base reference', () => {
    const BaseSchema = z.catchall(z.object({ id: z.string() }), z.string());
    const ExtendedSchema = z.catchall(
      z.extend(BaseSchema, { bonus: z.number() }),
      z.union([z.boolean(), z.number(), z.string()])
    );

    registerSchemas({
      Base: BaseSchema,
      Extended: ExtendedSchema,
    });

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
        type: 'object',
        required: ['id', 'bonus'],
        properties: {
          id: { type: 'string' },
          bonus: { type: 'number' },
        },
        additionalProperties: {
          anyOf: [{ type: 'boolean' }, { type: 'number' }, { type: 'string' }],
        },
      },
    });
  });
});
