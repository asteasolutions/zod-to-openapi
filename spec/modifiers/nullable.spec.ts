import { z } from 'zod/v4';
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
              allOf: [
                { $ref: '#/components/schemas/String' },
                { type: ['string', 'null'] },
              ],
            },
          },
          required: ['key'],
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
              allOf: [
                {
                  $ref: '#/components/schemas/Empty',
                },
                {
                  type: ['object', 'null'],
                  deprecated: true,
                },
              ],
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
});
