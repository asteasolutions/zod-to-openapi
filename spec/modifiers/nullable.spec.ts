import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('nullable', () => {
  it('supports nullable', () => {
    expectSchema([z.string().openapi('NullableString').nullable()], {
      NullableString: { type: 'string', nullable: true },
    });
  });

  it('supports nullable for registered schemas', () => {
    const StringSchema = z.string().openapi('String');

    const TestSchema = z
      .object({ key: StringSchema.nullable() })
      .openapi('Test');

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

  it('should not apply nullable if the schema is already nullable', () => {
    const StringSchema = z.string().openapi('String').nullable();

    const TestSchema = z
      .object({ key: StringSchema.nullable() })
      .openapi('Test');

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
  });

  it('supports nullable in open api 3.1.0', () => {
    expectSchema(
      [z.string().nullable().openapi('NullableString')],
      {
        NullableString: { type: ['string', 'null'] },
      },
      { version: '3.1.0' }
    );
  });

  it('supports nullable for registered schemas in open api 3.1.0', () => {
    const StringSchema = z.string().openapi('String');

    const TestSchema = z
      .object({ key: StringSchema.nullable() })
      .openapi('Test');

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
              anyOf: [
                { $ref: '#/components/schemas/String' },
                { type: 'null' },
              ],
            },
          },
          required: ['key'],
        },
      },
      { version: '3.1.0' }
    );
  });

  it('supports nullable registered object schemas as refs in open api 3.1.0', () => {
    const ObjectSchema = z
      .object({
        id: z.string().uuid(),
        name: z.enum(['A', 'B', 'C']),
      })
      .openapi('Object');

    const DetailSchema = z
      .object({
        nullableObject: ObjectSchema.nullable(),
        unionObject: z.union([ObjectSchema, z.null()]),
      })
      .openapi('Detail');

    expectSchema(
      [ObjectSchema, DetailSchema],
      {
        Object: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', enum: ['A', 'B', 'C'] },
          },
          required: ['id', 'name'],
        },
        Detail: {
          type: 'object',
          properties: {
            nullableObject: {
              anyOf: [
                { $ref: '#/components/schemas/Object' },
                { type: 'null' },
              ],
            },
            unionObject: {
              anyOf: [
                { $ref: '#/components/schemas/Object' },
                { type: 'null' },
              ],
            },
          },
          required: ['nullableObject', 'unionObject'],
        },
      },
      { version: '3.1.0' }
    );
  });

  it('should not apply nullable if the schema is already nullable in open api 3.1.0', () => {
    const StringSchema = z.string().nullable().openapi('String');

    const TestSchema = z
      .object({ key: StringSchema.nullable() })
      .openapi('Test');

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
      { version: '3.1.0' }
    );
  });

  it('supports referencing nullable zod effects', () => {
    const EmptySchema = z
      .object({})
      .transform(obj => obj as { [key: string]: never })
      .openapi('Empty', {
        type: 'object',
      });

    const TestSchema = z
      .object({ key: EmptySchema.nullable().openapi({ deprecated: true }) })
      .openapi('Test');

    expectSchema([EmptySchema, TestSchema], {
      Empty: {
        type: 'object',
      },
      Test: {
        type: 'object',
        required: ['key'],
        properties: {
          key: {
            allOf: [
              {
                $ref: '#/components/schemas/Empty',
              },
              {
                nullable: true,
                deprecated: true,
              },
            ],
          },
        },
      },
    });
  });

  it('supports referencing nullable zod effects with Openapi v3.1.0', () => {
    const EmptySchema = z
      .object({})
      .transform(obj => obj as { [key: string]: never })
      .openapi('Empty', {
        type: 'object',
      });

    const TestSchema = z
      .object({
        key: EmptySchema.nullable().openapi({
          deprecated: true,
        }),
      })
      .openapi('Test');

    expectSchema(
      [EmptySchema, TestSchema],
      {
        Empty: {
          type: 'object',
        },
        Test: {
          type: 'object',
          required: ['key'],
          properties: {
            key: {
              anyOf: [
                {
                  $ref: '#/components/schemas/Empty',
                },
                {
                  type: 'null',
                },
              ],
              deprecated: true,
            },
          },
        },
      },
      { version: '3.1.0' }
    );
  });

  it('overrides zod nullable when there is specified type in openapi', () => {
    const EmptySchema = z
      .object({})
      .nullable()
      .transform(obj => obj as { [key: string]: never })
      .openapi('Empty', {
        type: 'object',
      });

    expectSchema([EmptySchema], {
      Empty: {
        type: 'object',
      },
    });
  });

  it('supports null example in openapi 3.0.0', () => {
    const TestSchema = z
      .nullable(z.string())
      .openapi('Test', { example: null });

    expectSchema([TestSchema], {
      Test: {
        type: 'string',
        nullable: true,
        example: null,
      },
    });
  });

  it('supports null example', () => {
    const TestSchema = z
      .nullable(z.string())
      .openapi('Test', { example: null });

    expectSchema(
      [TestSchema],
      {
        Test: {
          type: ['string', 'null'],
          example: null,
        },
      },
      { version: '3.1.0' }
    );
  });
});
