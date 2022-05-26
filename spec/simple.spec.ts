import { OpenAPIGenerator } from '../src/openapi-generator';
import { SchemasObject } from 'openapi3-ts';
import { z, ZodSchema } from 'zod';

import { extendZodWithOpenApi } from '../src/zod-extensions';

// TODO: setupTests.ts
extendZodWithOpenApi(z);

describe('Simple', () => {
  it('generates OpenAPI schema for simple types', () => {
    expectSchema([z.string().openapi({ refId: 'SimpleString' })], {
      SimpleString: { type: 'string' },
    });
  });

  it('generates OpenAPI schema for optional after the metadata', () => {
    expectSchema([z.string().openapi({ refId: 'SimpleString' }).optional()], {
      SimpleString: { type: 'string' },
    });
  });

  it('generates OpenAPI schema for optional before the metadata', () => {
    expectSchema([z.string().optional().openapi({ refId: 'SimpleString' })], {
      SimpleString: { type: 'string' },
    });
  });

  it('generates schemas with metadata', () => {
    expectSchema(
      [z.string().openapi({ refId: 'SimpleString', description: 'test' })],
      { SimpleString: { type: 'string', description: 'test' } }
    );
  });

  it('generates OpenAPI schema for nested objects', () => {
    expectSchema(
      [
        z
          .object({
            test: z.object({
              id: z.string().openapi({ description: 'The entity id' }),
            }),
          })
          .openapi({ refId: 'NestedObject' }),
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
    expectSchema([z.literal('John Doe').openapi({ refId: 'Literal' })], {
      Literal: { type: 'string', enum: ['John Doe'] },
    });
  });

  it('supports number literals', () => {
    expectSchema([z.literal(42).openapi({ refId: 'Literal' })], {
      Literal: { type: 'number', enum: [42] },
    });
  });

  it.todo(
    'throws error for openapi data to be provided for unrecognized literal types'
  );

  it('supports enums', () => {
    const schema = z
      .enum(['option1', 'option2'])
      .openapi({ refId: 'Enum', description: 'All possible options' });

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
      refId: 'NativeEnum',
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
      refId: 'NativeEnum',
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
    const SimpleStringSchema = z.string().openapi({ refId: 'SimpleString' });

    const ObjectWithStringsSchema = z
      .object({
        str1: SimpleStringSchema.optional(),
        str2: SimpleStringSchema,
      })
      .openapi({ refId: 'ObjectWithStrings' });

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
    expectSchema([z.array(z.string()).openapi({ refId: 'Array' })], {
      Array: {
        type: 'array',
        items: { type: 'string' },
      },
    });
  });

  it('supports minLength / maxLength on arrays', () => {
    expectSchema(
      [z.array(z.string()).min(5).max(10).openapi({ refId: 'Array' })],
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
    expectSchema([z.string().or(z.number()).openapi({ refId: 'Test' })], {
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
          .openapi({ refId: 'Test' }),
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

  it('supports records', () => {
    const base = z.object({ a: z.string() });

    const record = z.record(base).openapi({ refId: 'Record' });

    expectSchema([base, record], {
      Record: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            a: { type: 'string' },
          },
          required: ['a'],
        },
      },
    });
  });

  it('supports records with refs', () => {
    const base = z.object({ a: z.string() }).openapi({ refId: 'Base' });

    const record = z.record(base).openapi({ refId: 'Record' });

    expectSchema([base, record], {
      Base: {
        type: 'object',
        properties: {
          a: { type: 'string' },
        },
        required: ['a'],
      },
      Record: {
        type: 'object',
        additionalProperties: {
          $ref: '#/components/schemas/Base',
        },
      },
    });
  });

  it('supports unknown', () => {
    expectSchema(
      [
        z
          .unknown()
          .openapi({ refId: 'Unknown', description: 'Something unknown' }),
      ],
      {
        Unknown: { description: 'Something unknown' },
      }
    );
  });

  it('supports defaults', () => {
    expectSchema(
      [z.string().default('test').openapi({ refId: 'StringWithDefault' })],
      {
        StringWithDefault: {
          type: 'string',
        },
      }
    );
  });

  it('supports refined schemas', () => {
    expectSchema(
      [
        z
          .number()
          .refine((num) => num % 2 === 0)
          .openapi({ refId: 'RefinedString' }),
      ],
      {
        RefinedString: {
          type: 'number',
        },
      }
    );
  });

  it('does not support transformed schemas', () => {
    expect(() =>
      createSchemas([
        z
          .number()
          .transform((num) => num.toString())
          .openapi({ refId: 'Transformed' }),
      ])
    ).toThrow(/^Unknown zod object type/);
  });

  it('supports intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema(
      [z.intersection(Person, Employee).openapi({ refId: 'Test' })],
      {
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
      }
    );
  });

  function createSchemas(zodSchemas: ZodSchema<any>[]) {
    const definitions = zodSchemas.map((schema) => ({
      type: 'schema' as const,
      schema,
    }));

    const { components } = new OpenAPIGenerator(
      definitions
    ).generateComponents();

    return components;
  }

  function expectSchema(
    zodSchemas: ZodSchema<any>[],
    openAPISchemas: SchemasObject
  ) {
    const components = createSchemas(zodSchemas);

    expect(components?.['schemas']).toEqual(openAPISchemas);
  }
});
