import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('nullable', () => {
  it.concurrent('supports nullable', () => {
    expectSchema([registerSchema('NullableString', z.string()).nullable()], {
      NullableString: { type: 'string', nullable: true },
    });
  });

  it.concurrent('supports nullable for registered schemas', () => {
    const StringSchema = registerSchema('String', z.string());

    const TestSchema = registerSchema(
      'Test',
      z.object({ key: StringSchema.nullable() })
    );

    expectSchema([StringSchema, TestSchema], {
      String: {
        type: 'string',
      },
      Test: {
        type: 'object',
        properties: {
          key: {
            allOf: [
              { $ref: '#/components/schemas/String' },
              { nullable: true },
            ],
          },
        },
        required: ['key'],
      },
    });
  });

  it.concurrent(
    'should not apply nullable if the schema is already nullable',
    () => {
      const StringSchema = registerSchema('String', z.string()).nullable();

      const TestSchema = registerSchema(
        'Test',
        z.object({ key: StringSchema.nullable() })
      );

      expectSchema([StringSchema, TestSchema], {
        String: {
          type: 'string',
          nullable: true,
        },
        Test: {
          type: 'object',
          properties: {
            key: { $ref: '#/components/schemas/String' },
          },
          required: ['key'],
        },
      });
    }
  );

  it.concurrent('supports nullable in open api 3.1.0', () => {
    expectSchema(
      [registerSchema('NullableString', z.string().nullable())],
      {
        NullableString: { type: ['string', 'null'] },
      },
      '3.1.0'
    );
  });

  it.concurrent(
    'supports nullable for registered schemas in open api 3.1.0',
    () => {
      const StringSchema = registerSchema('String', z.string());

      const TestSchema = registerSchema(
        'Test',
        z.object({ key: StringSchema.nullable() })
      );

      expectSchema(
        [StringSchema, TestSchema],
        {
          String: {
            type: 'string',
          },
          Test: {
            type: 'object',
            properties: {
              key: {
                allOf: [
                  { $ref: '#/components/schemas/String' },
                  { type: ['string', 'null'] },
                ],
              },
            },
            required: ['key'],
          },
        },
        '3.1.0'
      );
    }
  );

  it.concurrent(
    'should not apply nullable if the schema is already nullable in open api 3.1.0',
    () => {
      const StringSchema = registerSchema('String', z.string().nullable());

      const TestSchema = registerSchema(
        'Test',
        z.object({ key: StringSchema.nullable() })
      );

      expectSchema(
        [StringSchema, TestSchema],
        {
          String: {
            type: ['string', 'null'],
          },
          Test: {
            type: 'object',
            properties: {
              key: { $ref: '#/components/schemas/String' },
            },
            required: ['key'],
          },
        },
        '3.1.0'
      );
    }
  );
});
