import { OpenAPIGenerator } from "../src/openapi-generator";
import { SchemasObject } from "openapi3-ts";
import { z, ZodSchema } from "zod";

import '../src/zod-extensions';

describe('Simple', () => {
  it('generates OpenAPI schema for simple types', () => {
    expectSchema(
      [z.string().openapi({ name: 'SimpleString' })],
      { SimpleString: { type: 'string' } }
    );
  });

  it('generates OpenAPI schema for optional after the metadata', () => {
    expectSchema(
      [z.string().openapi({ name: 'SimpleString' }).optional()],
      { SimpleString: { type: 'string' } }
    );
  });

  it('generates OpenAPI schema for optional before the metadata', () => {
    expectSchema(
      [z.string().optional().openapi({ name: 'SimpleString' })],
      { SimpleString: { type: 'string' } }
    );
  });

  it('generates schemas with metadata', () => {
    expectSchema(
      [z.string().openapi({ name: 'SimpleString', description: 'test' })],
      { SimpleString: { type: 'string', description: 'test' } }
    );
  });

  it('creates separate schemas and links them', () => {
    const SimpleStringSchema = z
      .string()
      .openapi({ name: 'SimpleString' });

    const ObjectWithStringsSchema = z
      .object({
        str1: SimpleStringSchema.optional(),
        str2: SimpleStringSchema
      })
      .openapi({ name: 'ObjectWithStrings' });

    expectSchema(
      [
        SimpleStringSchema,
        ObjectWithStringsSchema
      ],
      {
        SimpleString: { type: 'string' },
        ObjectWithStrings: {
          type: 'object',
          properties: {
            str1: { $ref: '#/components/schemas/SimpleString' },
            str2: { $ref: '#/components/schemas/SimpleString' }
          },
          required: ['str2']
        }
      }
    );
  });

  it('supports arrays of strings', () => {
    expectSchema([
      z.array(z.string()).openapi({ name: 'Array' })
    ], {
      Array: {
        type: 'array',
        items: { type: 'string' }
      }
    })
  });

  it('supports union types', () => {
    expectSchema([
      z.string().or(z.number()).openapi({ name: 'Test' })
    ], {
      Test: {
        anyOf: [
          { type: 'string' },
          { type: 'number' }
        ]
      }
    });

    expectSchema([
      z.string().or(z.number()).or(z.array(z.string())).openapi({ name: 'Test' })
    ], {
      Test: {
        anyOf: [
          { type: 'string' },
          { type: 'number' },
          { type: 'array', items: { type: 'string' } }
        ]
      }
    });
  });

  it('supports intersection types', () => {
    const Person = z.object({
      name: z.string(),
    });

    const Employee = z.object({
      role: z.string(),
    });

    expectSchema([
      z.intersection(Person, Employee).openapi({ name: 'Test' })
    ], {
      Test: {
        allOf: [
          {
            type: 'object',
            properties: { name: { type: 'string' } },
            required: ['name']
          },
          {
            type: 'object',
            properties: { role: { type: 'string' } },
            required: ['role']
          }
        ]
      }
    });
  });

  function expectSchema(
    zodSchemas: ZodSchema<any>[],
    openAPISchemas: SchemasObject
  ) {
    const generatedSchemas = new OpenAPIGenerator(zodSchemas).generate();

    expect(generatedSchemas).toEqual(openAPISchemas);
  }
});
