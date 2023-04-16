import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypeDescribe,
} from '../lib/helpers';

registrationTypeDescribe('object', registrationType => {
  it('generates OpenAPI schema for nested objects', () => {
    expectSchema(
      [
        registerSchema(
          'NestedObject',
          z.object({
            test: z.object({
              id: z.string().openapi({ description: 'The entity id' }),
            }),
          }),
          registrationType
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

  it('creates separate schemas and links them', () => {
    const SimpleStringSchema = registerSchema(
      'SimpleString',
      z.string(),
      registrationType
    );

    const ObjectWithStringsSchema = registerSchema(
      'ObjectWithStrings',
      z.object({
        str1: SimpleStringSchema.optional(),
        str2: SimpleStringSchema,
      }),
      registrationType
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

  it('maps additionalProperties to false for strict objects', () => {
    expectSchema(
      [
        registerSchema(
          'StrictObject',
          z.strictObject({
            test: z.string(),
          }),
          registrationType
        ),
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
});
