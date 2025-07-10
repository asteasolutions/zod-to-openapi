import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('object', () => {
  it('generates OpenAPI schema for nested objects', () => {
    expectSchema(
      [
        z
          .object({
            test: z.object({
              id: z.string().openapi({ description: 'The entity id' }),
            }),
          })
          .openapi('NestedObject'),
      ],
      {
        NestedObject: {
          type: 'object',
          required: ['test'],
          properties: {
            test: {
              type: 'object',
              required: ['id'],
              properties: {
                id: { type: 'string', description: 'The entity id' },
              },
            },
          },
        },
      }
    );
  });

  it('creates separate schemas and links them', () => {
    const SimpleStringSchema = z.string().openapi('SimpleString');

    const ObjectWithStringsSchema = z
      .object({
        str1: SimpleStringSchema.optional(),
        str2: SimpleStringSchema,
      })
      .openapi('ObjectWithStrings');

    expectSchema([SimpleStringSchema, ObjectWithStringsSchema], {
      SimpleString: { type: 'string' },
      ObjectWithStrings: {
        type: 'object',
        properties: {
          str1: { $ref: '#/components/schemas/SimpleString' },
          str2: { $ref: '#/components/schemas/SimpleString' },
        },
        required: ['str2'],
      },
    });
  });

  it('maps additionalProperties to false for strict objects', () => {
    expectSchema(
      [
        z
          .strictObject({
            test: z.string(),
          })
          .openapi('StrictObject'),
      ],
      {
        StrictObject: {
          type: 'object',
          required: ['test'],
          additionalProperties: false,
          properties: {
            test: {
              type: 'string',
            },
          },
        },
      }
    );
  });

  it('can automatically register object properties', () => {
    const schema = z
      .object({ key: z.string().openapi('Test') })
      .openapi('Object');

    expectSchema([schema], {
      Test: {
        type: 'string',
      },

      Object: {
        type: 'object',
        properties: {
          key: {
            $ref: '#/components/schemas/Test',
          },
        },
        required: ['key'],
      },
    });
  });

  it('can automatically register extended parent properties', () => {
    const schema = z.object({ id: z.number().openapi('NumberId') });

    const extended = schema
      .extend({
        name: z.string().openapi('Name'),
      })
      .openapi('ExtendedObject');

    expectSchema([extended], {
      Name: {
        type: 'string',
      },

      NumberId: {
        type: 'number',
      },

      ExtendedObject: {
        type: 'object',
        properties: {
          id: {
            $ref: '#/components/schemas/NumberId',
          },
          name: {
            $ref: '#/components/schemas/Name',
          },
        },
        required: ['id', 'name'],
      },
    });
  });

  it('can automatically register extended schemas', () => {
    const schema = z
      .object({ id: z.string().openapi('StringId') })
      .openapi('Object');

    const extended = schema
      .extend({
        id: z.number().openapi('NumberId'),
      })
      .openapi('ExtendedObject');

    expectSchema([extended], {
      StringId: {
        type: 'string',
      },

      NumberId: {
        type: 'number',
      },

      Object: {
        type: 'object',
        properties: {
          id: {
            $ref: '#/components/schemas/StringId',
          },
        },
        required: ['id'],
      },

      ExtendedObject: {
        allOf: [
          { $ref: '#/components/schemas/Object' },
          {
            type: 'object',
            properties: {
              id: { $ref: '#/components/schemas/NumberId' },
            },
          },
        ],
      },
    });
  });
});
