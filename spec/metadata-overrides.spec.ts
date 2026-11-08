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
        anyOf: [{ type: 'string' }, { $ref: '#/components/schemas/Empty' }],
        description: 'Union with empty object',
      },
    });
  });

  it('keeps checks chained onto registered schemas', () => {
    const TagsSchema = z.array(z.string()).openapi('Tags');
    const NameSchema = z.string().openapi('Name');
    const AgeSchema = z.number().openapi('Age');

    const TestSchema = z
      .object({
        tags: TagsSchema.max(5),
        name: NameSchema.min(2),
        age: AgeSchema.max(120),
      })
      .openapi('Test');

    expectSchema([TagsSchema, NameSchema, AgeSchema, TestSchema], {
      Tags: {
        type: 'array',
        items: { type: 'string' },
      },
      Name: {
        type: 'string',
      },
      Age: {
        type: 'number',
      },
      Test: {
        type: 'object',
        properties: {
          tags: {
            allOf: [{ $ref: '#/components/schemas/Tags' }, { maxItems: 5 }],
          },
          name: {
            allOf: [{ $ref: '#/components/schemas/Name' }, { minLength: 2 }],
          },
          age: {
            allOf: [{ $ref: '#/components/schemas/Age' }, { maximum: 120 }],
          },
        },
        required: ['tags', 'name', 'age'],
      },
    });
  });

  it('keeps checks chained onto registered recursive schemas', () => {
    const CategorySchema: z.ZodType<any> = z
      .lazy(() =>
        z.object({
          name: z.string(),
          children: z.array(CategorySchema),
        })
      )
      .openapi('Category');

    const TestSchema = z
      .object({
        categories: z.array(CategorySchema).openapi('Categories'),
        topCategories: z.array(CategorySchema).openapi('Categories').max(3),
      })
      .openapi('Test');

    expectSchema([CategorySchema, TestSchema], {
      Category: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          children: {
            type: 'array',
            items: { $ref: '#/components/schemas/Category' },
          },
        },
        required: ['name', 'children'],
      },
      Categories: {
        type: 'array',
        items: { $ref: '#/components/schemas/Category' },
      },
      Test: {
        type: 'object',
        properties: {
          categories: { $ref: '#/components/schemas/Categories' },
          topCategories: {
            allOf: [
              { $ref: '#/components/schemas/Categories' },
              { maxItems: 3 },
            ],
          },
        },
        required: ['categories', 'topCategories'],
      },
    });
  });
});
