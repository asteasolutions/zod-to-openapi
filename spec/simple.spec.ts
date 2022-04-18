import { OpenAPIGenerator } from '../src/openapi-generator';
import { SchemasObject } from 'openapi3-ts';
import { z, ZodSchema } from 'zod';

import { extendZodWithOpenApi } from '../src/zod-extensions';

// TODO: setupTests.ts
extendZodWithOpenApi(z);

describe('Simple', () => {
  it('generates OpenAPI schema for simple types', () => {
    expectSchema([z.string().openapi({ name: 'SimpleString' })], {
      SimpleString: { type: 'string' },
    });
  });

  it('generates OpenAPI schema for optional after the metadata', () => {
    expectSchema([z.string().openapi({ name: 'SimpleString' }).optional()], {
      SimpleString: { type: 'string' },
    });
  });

  it('generates OpenAPI schema for optional before the metadata', () => {
    expectSchema([z.string().optional().openapi({ name: 'SimpleString' })], {
      SimpleString: { type: 'string' },
    });
  });

  it('generates schemas with metadata', () => {
    expectSchema(
      [z.string().openapi({ name: 'SimpleString', description: 'test' })],
      { SimpleString: { type: 'string', description: 'test' } }
    );
  });

  fit('generates OpenAPI schema for nested objects', () => {
    expectSchema(
      [
        z
          .object({
            test: z.object({
              id: z.string().openapi({ description: 'The entity id' }),
            }),
          })
          .openapi({ name: 'NestedObject' }),
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

  it('supports string literals', () => {
    expectSchema([z.literal('John Doe').openapi({ name: 'Literal' })], {
      Literal: { type: 'string', enum: ['John Doe'] },
    });
  });

  it('supports number literals', () => {
    expectSchema([z.literal(42).openapi({ name: 'Literal' })], {
      Literal: { type: 'number', enum: [42] },
    });
  });

  it.todo(
    'throws error for openapi data to be provided for unrecognized literal types'
  );

  it('supports enums', () => {
    const schema = z
      .enum(['option1', 'option2'])
      .openapi({ name: 'Enum', description: 'All possible options' });

    expectSchema([schema], {
      Enum: {
        type: 'string',
        description: 'All possible options',
        enum: ['option1', 'option2'],
      },
    });
  });

  it.todo(
    'throws error for openapi data to be provided for unrecognized enum types'
  );

  it('supports native enums', () => {
    enum NativeEnum {
      OPTION = 'Option',
      ANOTHER = 'Another',
      DEFAULT = 'Default',
    }

    const nativeEnumSchema = z.nativeEnum(NativeEnum).openapi({
      name: 'NativeEnum',
      description: 'A native enum in zod',
    });

    expectSchema([nativeEnumSchema], {
      NativeEnum: {
        type: 'string',
        description: 'A native enum in zod',
        enum: ['Option', 'Another', 'Default'],
      },
    });
  });

  it.skip('supports native numbers enums', () => {
    enum NativeEnum {
      OPTION = 1,
      ANOTHER = 42,
      DEFAULT = 3,
    }

    const nativeEnumSchema = z.nativeEnum(NativeEnum).openapi({
      name: 'NativeEnum',
      description: 'A native numbers enum in zod',
    });

    expectSchema([nativeEnumSchema], {
      NativeEnum: {
        type: 'number',
        description: 'A native numbers enum in zod',
        enum: [1, 2, 3],
      },
    });
  });

  it('creates separate schemas and links them', () => {
    const SimpleStringSchema = z.string().openapi({ name: 'SimpleString' });

    const ObjectWithStringsSchema = z
      .object({
        str1: SimpleStringSchema.optional(),
        str2: SimpleStringSchema,
      })
      .openapi({ name: 'ObjectWithStrings' });

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

  it('supports arrays of strings', () => {
    expectSchema([z.array(z.string()).openapi({ name: 'Array' })], {
      Array: {
        type: 'array',
        items: { type: 'string' },
      },
    });
  });

  it('supports minLength / maxLength on arrays', () => {
    expectSchema(
      [z.array(z.string()).min(5).max(10).openapi({ name: 'Array' })],
      {
        Array: {
          type: 'array',
          items: { type: 'string' },
          minItems: 5,
          maxItems: 10,
        },
      }
    );
  });

  it('supports union types', () => {
    expectSchema([z.string().or(z.number()).openapi({ name: 'Test' })], {
      Test: {
        anyOf: [{ type: 'string' }, { type: 'number' }],
      },
    });

    expectSchema(
      [
        z
          .string()
          .or(z.number())
          .or(z.array(z.string()))
          .openapi({ name: 'Test' }),
      ],
      {
        Test: {
          anyOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'array', items: { type: 'string' } },
          ],
        },
      }
    );
  });

  it('supports intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema([z.intersection(Person, Employee).openapi({ name: 'Test' })], {
      Test: {
        allOf: [
          {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name'],
          },
          {
            type: 'object',
            properties: { role: { type: 'string' } },
            required: ['role'],
          },
        ],
      },
    });
  });

  function expectSchema(
    zodSchemas: ZodSchema<any>[],
    openAPISchemas: SchemasObject
  ) {
    const definitions = zodSchemas.map((schema) => ({
      type: 'schema' as const,
      schema,
    }));

    const { components } = new OpenAPIGenerator(
      definitions
    ).generateComponents();

    expect(components?.['schemas']).toEqual(openAPISchemas);
  }
});
