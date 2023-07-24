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
    const schema = z.string().openapi('StringAsNumber', { type: 'number' });
    expectSchema([schema], {
      StringAsNumber: { type: 'number' },
    });
  });

  it('can remove .openapi properties', () => {
    const schema = z
      .string()
      .openapi('Test', { description: 'test', deprecated: true })
      .openapi({ description: undefined, deprecated: undefined });

    expectSchema([schema], {
      Test: { type: 'string' },
    });
  });

  it('generates schemas with metadata', () => {
    expectSchema(
      [z.string().openapi('SimpleString', { description: 'test' })],
      { SimpleString: { type: 'string', description: 'test' } }
    );
  });

  it('supports .openapi for registered schemas', () => {
    const StringSchema = z.string().openapi('String');

    const TestSchema = z
      .object({
        key: StringSchema.openapi({ example: 'test', deprecated: true }),
      })
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
              { example: 'test', deprecated: true },
            ],
          },
        },
        required: ['key'],
      },
    });
  });

  it('only adds overrides for new metadata properties', () => {
    const StringSchema = z.string().openapi('String', {
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
      .openapi('Test');

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
    const StringSchema = z.string().openapi('String', {
      example: 'existing field',
    });

    const TestSchema = z
      .object({
        key: StringSchema.nullable().openapi({ type: 'boolean' }),
      })
      .openapi('Test');

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
  // the best support for it
  it('supports referencing zod effects', () => {
    const EmptySchema = z
      .object({})
      .transform(obj => obj as { [key: string]: never })
      .openapi('Empty', {
        type: 'object',
      });

    const TestSchema = z.object({ key: EmptySchema }).openapi('Test');

    expectSchema([EmptySchema, TestSchema], {
      Empty: {
        type: 'object',
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

  it('supports referencing zod effects in unions', () => {
    const EmptySchema = z
      .object({})
      .transform(obj => obj as { [key: string]: never })
      .openapi('Empty', {
        type: 'object',
      });

    const UnionTestSchema = z
      .union([z.string(), EmptySchema])
      .openapi('UnionTest', {
        description: 'Union with empty object',
      });

    expectSchema([EmptySchema, UnionTestSchema], {
      Empty: {
        type: 'object',
      },
      UnionTest: {
        oneOf: [{ type: 'string' }, { $ref: '#/components/schemas/Empty' }],
        description: 'Union with empty object',
      },
    });
  });
});
