import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('object', () => {
  it.concurrent('generates OpenAPI schema for nested objects', () => {
    expectSchema(
      [
        registerSchema(
          'NestedObject',
          z.object({
            test: z.object({
              id: z.string().openapi({ description: 'The entity id' }),
            }),
          })
        ),
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

  it.concurrent('creates separate schemas and links them', () => {
    const SimpleStringSchema = registerSchema('SimpleString', z.string());

    const ObjectWithStringsSchema = registerSchema(
      'ObjectWithStrings',
      z.object({
        str1: SimpleStringSchema.optional(),
        str2: SimpleStringSchema,
      })
    );

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
