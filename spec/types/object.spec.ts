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
          .openapi({ refId: 'NestedObject' }),
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
    const SimpleStringSchema = z.string().openapi({ refId: 'SimpleString' });

    const ObjectWithStringsSchema = z
      .object({
        str1: SimpleStringSchema.optional(),
        str2: SimpleStringSchema,
      })
      .openapi({ refId: 'ObjectWithStrings' });

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
});
