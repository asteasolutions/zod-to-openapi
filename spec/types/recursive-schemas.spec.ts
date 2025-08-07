import { z } from 'zod';
import { expectSchema } from '../lib/helpers';
import { SchemaObject } from 'src/types';

// Tests for Zod's new recursive schema approach using getters
// Based on https://zod.dev/api?id=recursive-objects

describe('recursive schemas (new getter approach)', () => {
  describe('basic recursive functionality', () => {
    it('supports basic recursive lazy schemas with getters', () => {
      const categorySchema = z
        .object({
          name: z.string(),
          get subcategory() {
            return categorySchema;
          },
        })
        .openapi('Category');

      expectSchema([categorySchema], {
        Category: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            subcategory: {
              $ref: '#/components/schemas/Category',
            },
          },
          required: ['name', 'subcategory'],
        },
      });
    });

    it('supports optional recursive properties with getters', () => {
      const nodeSchema = z
        .object({
          id: z.string(),
          value: z.number(),
          get child() {
            return nodeSchema.optional();
          },
        })
        .openapi('Node');

      expectSchema([nodeSchema], {
        Node: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            value: { type: 'number' },
            child: { $ref: '#/components/schemas/Node' },
          },
          required: ['id', 'value'],
        },
      });
    });
  });

  describe('complex recursive scenarios with getters', () => {
    it('supports mutual recursion between schemas using getters', () => {
      const personSchema = z
        .object({
          name: z.string(),
          get company() {
            return companySchema.optional();
          },
        })
        .openapi('Person');

      const companySchema = z
        .object({
          name: z.string(),
          get employees() {
            return z.array(personSchema);
          },
        })
        .openapi('Company');

      expectSchema([personSchema, companySchema], {
        Person: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            company: { $ref: '#/components/schemas/Company' },
          },
          required: ['name'],
        },
        Company: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            employees: {
              type: 'array',
              items: { $ref: '#/components/schemas/Person' },
            },
          },
          required: ['name', 'employees'],
        },
      });
    });

    it('supports deeply nested recursive tree structures with getters', () => {
      const treeNodeSchema = z
        .object({
          id: z.string(),
          value: z.number(),
          get children() {
            return z.array(treeNodeSchema);
          },
          get parent() {
            return treeNodeSchema.optional();
          },
        })
        .openapi('TreeNode');

      expectSchema([treeNodeSchema], {
        TreeNode: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            value: { type: 'number' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/TreeNode' },
            },
            parent: { $ref: '#/components/schemas/TreeNode' },
          },
          required: ['id', 'value', 'children'],
        },
      });
    });

    it('supports recursive schemas with unions using getters', () => {
      const recursiveNodeSchema = z
        .object({
          id: z.string(),
          type: z.enum(['simple', 'complex']),
          get children() {
            return z.array(recursiveNodeSchema).optional();
          },
        })
        .openapi('RecursiveNode');

      const stringSchema = z.string().openapi('SimpleString');

      const unionSchema = z
        .union([recursiveNodeSchema, stringSchema])
        .openapi('RecursiveUnion');

      // TODO: We have the same problem here - if we have already registered
      // a schema we get to register it once again and this leads to a
      // Maximum call stack error.
      expectSchema([recursiveNodeSchema, stringSchema, unionSchema], {
        RecursiveNode: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['simple', 'complex'] },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/RecursiveNode' },
            },
          },
          required: ['id', 'type'],
        },
        SimpleString: { type: 'string' },
        RecursiveUnion: {
          anyOf: [
            { $ref: '#/components/schemas/RecursiveNode' },
            { $ref: '#/components/schemas/SimpleString' },
          ],
        },
      });
    });
  });

  describe('recursive schemas with complex types and getters', () => {
    it('supports recursive schemas in arrays with getters', () => {
      const itemSchema = z
        .object({
          id: z.string(),
          value: z.number(),
          get children() {
            return z.array(itemSchema);
          },
        })
        .openapi('RecursiveItem');

      const arraySchema = z.array(itemSchema).openapi('ItemArray');

      expectSchema([itemSchema, arraySchema], {
        RecursiveItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            value: { type: 'number' },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/RecursiveItem' },
            },
          },
          required: ['id', 'value', 'children'],
        },
        ItemArray: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/RecursiveItem',
          },
        },
      });
    });

    it('supports recursive schemas in unions with getters', () => {
      const recursiveSchema = z
        .object({
          id: z.string(),
          get nested() {
            return recursiveSchema.optional();
          },
        })
        .openapi('RecursiveType');

      const stringSchema = z.string().openapi('SimpleString');

      const unionSchema = z
        .union([recursiveSchema, stringSchema])
        .openapi('RecursiveUnion');

      expectSchema([recursiveSchema, stringSchema, unionSchema], {
        RecursiveType: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nested: { $ref: '#/components/schemas/RecursiveType' },
          },
          required: ['id'],
        },
        SimpleString: { type: 'string' },
        RecursiveUnion: {
          anyOf: [
            { $ref: '#/components/schemas/RecursiveType' },
            { $ref: '#/components/schemas/SimpleString' },
          ],
        },
      });
    });

    it('supports recursive schemas in intersections with getters', () => {
      const recursiveBaseSchema = z
        .object({
          id: z.string(),
          get child() {
            return recursiveBaseSchema.optional();
          },
        })
        .openapi('RecursiveBase');

      const metaSchema = z.object({
        metadata: z.record(z.string(), z.string()),
      });

      const intersectionSchema = z
        .intersection(recursiveBaseSchema, metaSchema)
        .openapi('RecursiveIntersection');

      expectSchema([recursiveBaseSchema, intersectionSchema], {
        RecursiveBase: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            child: { $ref: '#/components/schemas/RecursiveBase' },
          },
          required: ['id'],
        },
        RecursiveIntersection: {
          allOf: [
            { $ref: '#/components/schemas/RecursiveBase' },
            {
              type: 'object',
              properties: {
                metadata: {
                  type: 'object',
                  additionalProperties: { type: 'string' },
                },
              },
              required: ['metadata'],
            },
          ],
        },
      });
    });
  });

  describe('metadata and modifiers with recursive getters', () => {
    it('supports recursive schemas with OpenAPI metadata using getters', () => {
      const recursiveSchema = z
        .object({
          name: z.string(),
          get child() {
            return recursiveSchema.optional().openapi({
              deprecated: true,
            });
          },
        })
        .openapi('RecursiveWithMeta', {
          description: 'A recursive schema with metadata',
          example: { name: 'root', child: { name: 'child' } },
        });

      expectSchema([recursiveSchema], {
        RecursiveWithMeta: {
          type: 'object',
          description: 'A recursive schema with metadata',
          example: { name: 'root', child: { name: 'child' } },
          properties: {
            name: { type: 'string' },
            child: {
              allOf: [
                { $ref: '#/components/schemas/RecursiveWithMeta' },
                { deprecated: true },
              ],
            },
          },
          required: ['name'],
        },
      });
    });

    it('supports nullable recursive schemas with getters', () => {
      const recursiveSchema = z
        .object({
          value: z.string(),
          get next() {
            return recursiveSchema
              .nullable()
              .openapi({ description: 'This can be null' });
          },
        })
        .openapi('NullableRecursive', { deprecated: true });

      expectSchema([recursiveSchema], {
        NullableRecursive: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            next: {
              allOf: [
                {
                  oneOf: [
                    { $ref: '#/components/schemas/NullableRecursive' },
                    { nullable: true },
                  ],
                },
                { description: 'This can be null' },
              ],
            },
          },
          deprecated: true,

          required: ['value', 'next'],
        },
      });
    });

    it('supports recursive schemas with manual type passed as metadata', () => {
      const recursiveSchema = z
        .object({
          value: z.string(),
          get next() {
            return recursiveSchema.openapi({
              type: 'object',
            });
          },
        })
        .openapi('RecursiveWithMetadata', { example: 3 });

      expectSchema([recursiveSchema], {
        RecursiveWithMetadata: {
          type: 'object',
          properties: {
            value: { type: 'string' },
            next: {
              allOf: [
                { $ref: '#/components/schemas/RecursiveWithMetadata' },
                { type: 'object' },
              ],
            },
          },
          example: 3,

          required: ['value', 'next'],
        },
      });
    });

    it('supports recursive schemas with defaults using getters', () => {
      const recursiveSchema = z
        .object({
          name: z.string(),
          count: z.number().default(0),
          get children() {
            return z.array(recursiveSchema).default([]);
          },
        })
        .openapi('RecursiveWithDefaults');

      expectSchema([recursiveSchema], {
        RecursiveWithDefaults: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            count: { type: 'number', default: 0 },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/RecursiveWithDefaults' },
              default: [],
            },
          },
          required: ['name'],
        },
      });
    });
  });

  describe('performance and stability with recursive getters', () => {
    it('handles deep recursive nesting without stack overflow using getters', () => {
      const levels = 9;

      // Create a deeply nested structure using getters
      function createRecursiveSchema(level: number): z.ZodType<any> {
        return z.object({
          level: z.number().default(level),
          ...(level === 0
            ? { nested: z.string().optional() }
            : {
                get nested() {
                  return createRecursiveSchema(level - 1).optional();
                },
              }),
        });
      }

      const deepSchema = createRecursiveSchema(levels).openapi('DeepNesting');

      function getExpectedData(level: number): SchemaObject {
        if (level < 0) return { type: 'string' };

        return {
          type: 'object',
          properties: {
            level: { type: 'number', default: level },
            nested: getExpectedData(level - 1),
          },
        };
      }

      // This should not throw and should generate a valid schema
      expectSchema([deepSchema], {
        DeepNesting: getExpectedData(levels),
      });
    });

    it('handles multiple independent recursive schemas efficiently using getters', () => {
      const schemas = Array.from({ length: 10 }, (_, i) => {
        const recursiveSchema = z
          .object({
            id: z.string(),
            value: z.number().default(i),
            get children() {
              return z.array(recursiveSchema);
            },
          })
          .openapi(`RecursiveSchema${i}`);

        return recursiveSchema;
      });

      const expectedSchemas = Object.fromEntries(
        Array.from({ length: 10 }, (_, i) => [
          `RecursiveSchema${i}`,
          {
            type: 'object' as const,
            properties: {
              id: { type: 'string' as const },
              value: { type: 'number' as const, default: i },
              children: {
                type: 'array' as const,
                items: { $ref: `#/components/schemas/RecursiveSchema${i}` },
              },
            },
            required: ['id', 'children'],
          },
        ])
      ) as Record<string, any>;

      // This should complete in reasonable time without memory issues
      expectSchema(schemas, expectedSchemas);
    });
  });

  describe('OpenAPI version compatibility with recursive getters', () => {
    it('supports recursive schemas with OpenAPI 3.1 using getters', () => {
      const recursiveSchema = z
        .object({
          value: z.string(),
          get child() {
            return recursiveSchema.nullable().optional();
          },
        })
        .openapi('RecursiveNullable');

      expectSchema(
        [recursiveSchema],
        {
          RecursiveNullable: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              child: {
                oneOf: [
                  { $ref: '#/components/schemas/RecursiveNullable' },
                  { type: 'null' },
                ],
              },
            },
            required: ['value'],
          },
        },
        { version: '3.1.0' }
      );
    });

    it('supports recursive schemas with OpenAPI 3.0 using getters', () => {
      const recursiveSchema = z
        .object({
          value: z.string(),
          get child() {
            return recursiveSchema.nullable().optional();
          },
        })
        .openapi('RecursiveNullable');

      expectSchema(
        [recursiveSchema],
        {
          RecursiveNullable: {
            type: 'object',
            properties: {
              value: { type: 'string' },
              child: {
                oneOf: [
                  { $ref: '#/components/schemas/RecursiveNullable' },
                  { nullable: true },
                ],
              },
            },
            required: ['value'],
          },
        },
        { version: '3.0.0' }
      );
    });
  });

  describe('edge cases with recursive getters', () => {
    it('handles simple recursive schema using getters', () => {
      const recursiveSchema = z
        .object({
          name: z.string(),
          get child() {
            return recursiveSchema.optional();
          },
        })
        .openapi('SimpleRecursive');

      expectSchema([recursiveSchema], {
        SimpleRecursive: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            child: { $ref: '#/components/schemas/SimpleRecursive' },
          },
          required: ['name'],
        },
      });
    });

    it('supports recursive schemas in nested arrays and objects using getters', () => {
      const recursiveSchema = z
        .object({
          id: z.string(),
          get nested() {
            return z.object({
              get items() {
                return z.array(recursiveSchema);
              },
            });
          },
        })
        .openapi('NestedRecursive');

      expectSchema([recursiveSchema], {
        NestedRecursive: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            nested: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/NestedRecursive' },
                },
              },
              required: ['items'],
            },
          },
          required: ['id', 'nested'],
        },
      });
    });
  });
});
