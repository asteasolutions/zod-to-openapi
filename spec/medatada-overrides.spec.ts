import { z } from 'zod';
import { expectSchema } from './lib/helpers';

describe('metadata overrides', () => {
  it.todo(
    'throws error for openapi data to be provided for unrecognized literal types'
  );

  it.todo(
    'throws error for openapi data to be provided for unrecognized enum types'
  );

  it('does not infer the type if one is provided using .openapi', () => {
    expectSchema(
      [z.string().openapi({ type: 'number', refId: 'StringAsNumber' })],
      {
        StringAsNumber: { type: 'number' },
      }
    );
  });

  it('can remove .openapi properties', () => {
    expectSchema(
      [
        z
          .string()
          .openapi({ refId: 'Test', description: 'test', deprecated: true })
          .openapi({ description: undefined, deprecated: undefined }),
      ],
      {
        Test: { type: 'string' },
      }
    );
  });

  it('generates schemas with metadata', () => {
    expectSchema(
      [z.string().openapi({ refId: 'SimpleString', description: 'test' })],
      { SimpleString: { type: 'string', description: 'test' } }
    );
  });

  it('supports .openapi for registered schemas', () => {
    const StringSchema = z.string().openapi({ refId: 'String' });

    const TestSchema = z
      .object({
        key: StringSchema.openapi({ example: 'test', deprecated: true }),
      })
      .openapi({ refId: 'Test' });

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
    const StringSchema = z.string().openapi({
      refId: 'String',
      description: 'old field',
      title: 'same title',
      examples: ['same array'],
      discriminator: { propertyName: 'sameProperty' },
    });

    const TestSchema = z
      .object({
        key: StringSchema.openapi({
          title: 'same title',
          examples: ['same array'],
          example: 'new field',
          discriminator: { propertyName: 'sameProperty' },
        }),
      })
      .openapi({ refId: 'Test' });

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
    const StringSchema = z.string().openapi({
      refId: 'String',
      example: 'existing field',
    });

    const TestSchema = z
      .object({
        key: StringSchema.nullable().openapi({ type: 'boolean' }),
      })
      .openapi({ refId: 'Test' });

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
});
