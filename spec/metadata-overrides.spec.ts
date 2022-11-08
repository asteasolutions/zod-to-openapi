import { z } from 'zod';
import { expectSchema, registerSchema } from './lib/helpers';

describe('metadata overrides', () => {
  it.todo(
    'throws error for openapi data to be provided for unrecognized literal types'
  );

  it.todo(
    'throws error for openapi data to be provided for unrecognized enum types'
  );

  it('does not infer the type if one is provided using .openapi', () => {
    const schema = registerSchema('StringAsNumber', z.string()).openapi({
      type: 'number',
    });
    expectSchema([schema], {
      StringAsNumber: { type: 'number' },
    });
  });

  it('can remove .openapi properties', () => {
    const schema = registerSchema('Test', z.string())
      .openapi({ description: 'test', deprecated: true })
      .openapi({ description: undefined, deprecated: undefined });

    expectSchema([schema], {
      Test: { type: 'string' },
    });
  });

  it('generates schemas with metadata', () => {
    expectSchema(
      [
        registerSchema('SimpleString', z.string()).openapi({
          description: 'test',
        }),
      ],
      { SimpleString: { type: 'string', description: 'test' } }
    );
  });

  it('supports .openapi for registered schemas', () => {
    const StringSchema = registerSchema('String', z.string());

    const TestSchema = registerSchema(
      'Test',
      z.object({
        key: StringSchema.openapi({ example: 'test', deprecated: true }),
      })
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
              { example: 'test', deprecated: true },
            ],
          },
        },
        required: ['key'],
      },
    });
  });

  it('only adds overrides for new metadata properties', () => {
    const StringSchema = registerSchema('String', z.string()).openapi({
      description: 'old field',
      title: 'same title',
      examples: ['same array'],
      discriminator: { propertyName: 'sameProperty' },
    });

    const TestSchema = registerSchema(
      'Test',
      z.object({
        key: StringSchema.openapi({
          title: 'same title',
          examples: ['same array'],
          example: 'new field',
          discriminator: { propertyName: 'sameProperty' },
        }),
      })
    );

    expectSchema([StringSchema, TestSchema], {
      String: {
        description: 'old field',
        title: 'same title',
        examples: ['same array'],
        discriminator: { propertyName: 'sameProperty' },
        type: 'string',
      },
      Test: {
        type: 'object',
        properties: {
          key: {
            allOf: [
              { $ref: '#/components/schemas/String' },
              { example: 'new field' },
            ],
          },
        },
        required: ['key'],
      },
    });
  });

  it('does not add schema calculated overrides if type is provided in .openapi', () => {
    const StringSchema = registerSchema(
      'String',
      z.string().openapi({
        example: 'existing field',
      })
    );

    const TestSchema = registerSchema(
      'Test',
      z.object({
        key: StringSchema.nullable().openapi({ type: 'boolean' }),
      })
    );

    expectSchema([StringSchema, TestSchema], {
      String: {
        example: 'existing field',
        type: 'string',
      },
      Test: {
        type: 'object',
        properties: {
          key: {
            allOf: [
              { $ref: '#/components/schemas/String' },
              { type: 'boolean' },
            ],
          },
        },
        required: ['key'],
      },
    });
  });

  // This was broken with the metadata overrides code so this feels like
  // the best sport for it
  it('supports referencing zod effects', () => {
    const EmptySchema = registerSchema(
      'Empty',
      z
        .object({})
        .transform(obj => obj as { [key: string]: never })
        .openapi({
          type: 'object',
          additionalProperties: false,
          description: 'An empty object',
        })
    );

    const TestSchema = registerSchema('Test', z.object({ key: EmptySchema }));

    expectSchema([EmptySchema, TestSchema], {
      Empty: {
        type: 'object',
        additionalProperties: false,
        description: 'An empty object',
      },
      Test: {
        type: 'object',
        required: ['key'],
        properties: {
          key: {
            $ref: '#/components/schemas/Empty',
          },
        },
      },
    });
  });

  it('TODO', () => {
    const EmptySchema = registerSchema(
      'Empty',
      z
        .object({})
        .transform(obj => obj as { [key: string]: never })
        .openapi({
          type: 'object',
          additionalProperties: false,
          description: 'An empty object',
        })
    );

    const TestSchema = registerSchema(
      'Test',
      z.object({ key: EmptySchema.nullable().openapi({ deprecated: true }) })
    );

    expectSchema(
      [EmptySchema, TestSchema],
      {
        Empty: {
          type: 'object',
          additionalProperties: false,
          description: 'An empty object',
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
      '3.1.0'
    );

    it('TODO 2', () => {
      const EmptySchema = registerSchema(
        'Empty',
        z
          .object({})
          .transform(obj => obj as { [key: string]: never })
          .openapi({
            type: 'object',
            additionalProperties: false,
            description: 'An empty object',
          })
      );

      const TestSchema = registerSchema(
        'Test',
        z.object({ key: EmptySchema.nullable().openapi({ deprecated: true }) })
      );

      expectSchema([EmptySchema, TestSchema], {
        Empty: {
          type: 'object',
          additionalProperties: false,
          description: 'An empty object',
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
  });
});
