import { z } from 'zod';
import { expectSchema } from '../lib/helpers';
import { SchemaObject } from 'src/types';

// Based on the "Any Type" section of https://swagger.io/docs/specification/data-models/data-types/

describe('lazy', () => {
  describe('basic functionality', () => {
    it('supports not registered lazy schemas', () => {
      const schema = z
        .object({ key: z.lazy(() => z.string()) })
        .openapi('Test');

      expectSchema([schema], {
        Test: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
            },
          },
          required: ['key'],
        },
      });
    });

    it('supports registered non-recursive lazy schemas', () => {
      const lazySchema = z.lazy(() => z.string()).openapi('LazyString');

      expectSchema([lazySchema], {
        LazyString: {
          type: 'string',
        },
      });
    });

    it('supports registered recursive lazy schemas', () => {
      const baseCategorySchema = z.object({
        name: z.string(),
      });

      type Category = z.infer<typeof baseCategorySchema> & {
        subcategory: Category;
      };

      const categorySchema: z.ZodType<Category> = baseCategorySchema
        .extend({
          subcategory: z.lazy(() => categorySchema),
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
  });

  describe('complex nested structures', () => {
    it('supports arrays of lazy schemas', () => {
      const itemSchema = z
        .lazy(() =>
          z.object({
            id: z.string(),
            value: z.number(),
          })
        )
        .openapi('LazyItem');

      const arraySchema = z.array(itemSchema).openapi('ItemArray');

      expectSchema([itemSchema, arraySchema], {
        LazyItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            value: { type: 'number' },
          },
          required: ['id', 'value'],
        },
        ItemArray: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/LazyItem',
          },
        },
      });
    });

    it('supports lazy schemas in unions', () => {
      const stringSchema = z.lazy(() => z.string()).openapi('LazyString');
      const numberSchema = z.lazy(() => z.number()).openapi('LazyNumber');

      const unionSchema = z
        .union([stringSchema, numberSchema])
        .openapi('LazyUnion');

      expectSchema([stringSchema, numberSchema, unionSchema], {
        LazyString: { type: 'string' },
        LazyNumber: { type: 'number' },
        LazyUnion: {
          anyOf: [
            { $ref: '#/components/schemas/LazyString' },
            { $ref: '#/components/schemas/LazyNumber' },
          ],
        },
      });
    });

    it('supports lazy schemas in intersections', () => {
      const baseSchema = z
        .lazy(() =>
          z.object({
            id: z.string(),
          })
        )
        .openapi('LazyBase');

      const metaSchema = z
        .lazy(() =>
          z.object({
            metadata: z.record(z.string(), z.string()),
          })
        )
        .openapi('LazyMeta');

      const intersectionSchema = z
        .intersection(baseSchema, metaSchema)
        .openapi('LazyIntersection');

      expectSchema([baseSchema, metaSchema, intersectionSchema], {
        LazyBase: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        LazyMeta: {
          type: 'object',
          properties: {
            metadata: {
              type: 'object',
              additionalProperties: { type: 'string' },
            },
          },
          required: ['metadata'],
        },
        LazyIntersection: {
          allOf: [
            { $ref: '#/components/schemas/LazyBase' },
            { $ref: '#/components/schemas/LazyMeta' },
          ],
        },
      });
    });

    it('supports multiple levels of lazy nesting', () => {
      const leafSchema = z.lazy(() => z.string()).openapi('LazyLeaf');
      const branchSchema = z
        .lazy(() =>
          z.object({
            leaf: leafSchema,
            value: z.number(),
          })
        )
        .openapi('LazyBranch');
      const treeSchema = z
        .lazy(() =>
          z.object({
            branch: branchSchema,
            name: z.string(),
          })
        )
        .openapi('LazyTree');

      expectSchema([leafSchema, branchSchema, treeSchema], {
        LazyLeaf: { type: 'string' },
        LazyBranch: {
          type: 'object',
          properties: {
            leaf: { $ref: '#/components/schemas/LazyLeaf' },
            value: { type: 'number' },
          },
          required: ['leaf', 'value'],
        },
        LazyTree: {
          type: 'object',
          properties: {
            branch: { $ref: '#/components/schemas/LazyBranch' },
            name: { type: 'string' },
          },
          required: ['branch', 'name'],
        },
      });
    });
  });

  describe('metadata and modifiers', () => {
    it('supports lazy schemas with OpenAPI metadata', () => {
      const lazySchema = z
        .lazy(() => z.string())
        .openapi('LazyWithMeta', {
          description: 'A lazy string schema',
          example: 'lazy example',
          minLength: 5,
          maxLength: 100,
        });

      expectSchema([lazySchema], {
        LazyWithMeta: {
          type: 'string',
          description: 'A lazy string schema',
          example: 'lazy example',
          minLength: 5,
          maxLength: 100,
        },
      });
    });

    it('supports optional lazy schemas', () => {
      const optionalLazySchema = z
        .object({
          requiredField: z.string(),
          optionalLazy: z.lazy(() => z.number()).optional(),
        })
        .openapi('OptionalLazy');

      expectSchema([optionalLazySchema], {
        OptionalLazy: {
          type: 'object',
          properties: {
            requiredField: { type: 'string' },
            optionalLazy: { type: 'number' },
          },
          required: ['requiredField'],
        },
      });
    });

    it('supports nullable lazy schemas', () => {
      const nullableLazySchema = z
        .object({
          field: z.lazy(() => z.string()).nullable(),
        })
        .openapi('NullableLazy');

      expectSchema([nullableLazySchema], {
        NullableLazy: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              nullable: true,
            },
          },
          required: ['field'],
        },
      });
    });

    it('supports lazy schemas with defaults', () => {
      const defaultLazySchema = z
        .object({
          field: z.lazy(() => z.string()).default('default value'),
        })
        .openapi('DefaultLazy');

      expectSchema([defaultLazySchema], {
        DefaultLazy: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              default: 'default value',
            },
          },
        },
      });
    });

    it('supports lazy schemas with refinements', () => {
      const refinedLazySchema = z
        .lazy(() =>
          z.string().refine(val => val.length > 0, 'String must not be empty')
        )
        .openapi('RefinedLazy');

      expectSchema([refinedLazySchema], {
        RefinedLazy: {
          type: 'string',
          // Note: refinements don't typically show up in OpenAPI schemas
          // but the schema should still generate correctly
        },
      });
    });
  });

  describe('complex recursive scenarios', () => {
    it('supports mutual recursion between schemas', () => {
      const personSchema: z.ZodType<any> = z
        .lazy(() =>
          z.object({
            name: z.string(),
            company: companySchema.optional(),
          })
        )
        .openapi('Person');

      const companySchema: z.ZodType<any> = z
        .lazy(() =>
          z.object({
            name: z.string(),
            employees: z.array(personSchema),
          })
        )
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

    it('supports deeply nested recursive tree structures', () => {
      type TreeNode = {
        id: string;
        value: number;
        children: TreeNode[];
        parent?: TreeNode;
      };

      const treeNodeSchema: z.ZodType<TreeNode> = z
        .lazy(() =>
          z.object({
            id: z.string(),
            value: z.number(),
            children: z.array(treeNodeSchema),
            parent: treeNodeSchema.optional(),
          })
        )
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

    it('supports recursive schemas with discriminated unions', () => {
      const nodeSchema: z.ZodType<any> = z
        .lazy(() =>
          z.discriminatedUnion('type', [
            z
              .object({
                type: z.literal('leaf'),
                value: z.string(),
              })
              .openapi('Leaf'),
            z
              .object({
                type: z.literal('branch'),
                children: z.array(nodeSchema),
              })
              .openapi('Branch'),
          ])
        )
        .openapi('RecursiveNode');

      expectSchema([nodeSchema], {
        RecursiveNode: {
          discriminator: {
            propertyName: 'type',
            mapping: {
              leaf: '#/components/schemas/Leaf',
              branch: '#/components/schemas/Branch',
            },
          },
          oneOf: [
            { $ref: '#/components/schemas/Leaf' },
            { $ref: '#/components/schemas/Branch' },
          ],
        },
        Leaf: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['leaf'] },
            value: { type: 'string' },
          },
          required: ['type', 'value'],
        },
        Branch: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['branch'] },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/RecursiveNode' },
            },
          },
          required: ['type', 'children'],
        },
      });
    });
  });

  describe('lazy schemas with complex types', () => {
    it('supports lazy record schemas', () => {
      const lazyRecordSchema = z
        .lazy(() => z.record(z.string(), z.number()))
        .openapi('LazyRecord');

      expectSchema([lazyRecordSchema], {
        LazyRecord: {
          type: 'object',
          additionalProperties: { type: 'number' },
        },
      });
    });

    it('supports lazy tuple schemas', () => {
      const lazyTupleSchema = z
        .lazy(() => z.tuple([z.string(), z.number(), z.boolean()]))
        .openapi('LazyTuple');

      expectSchema([lazyTupleSchema], {
        LazyTuple: {
          type: 'array',
          items: {
            anyOf: [
              { type: 'string' },
              { type: 'number' },
              { type: 'boolean' },
            ],
          },
          minItems: 3,
          maxItems: 3,
        },
      });
    });

    it('supports lazy enum schemas', () => {
      const lazyEnumSchema = z
        .lazy(() => z.enum(['option1', 'option2', 'option3']))
        .openapi('LazyEnum');

      expectSchema([lazyEnumSchema], {
        LazyEnum: {
          type: 'string',
          enum: ['option1', 'option2', 'option3'],
        },
      });
    });

    it('supports lazy date schemas', () => {
      const lazyDateSchema = z.lazy(() => z.date()).openapi('LazyDate');

      expectSchema([lazyDateSchema], {
        LazyDate: {
          type: 'string',
          format: 'date-time',
        },
      });
    });
  });

  describe('edge cases and error scenarios', () => {
    it('handles lazy schema returning different types based on conditions', () => {
      let useString = true;
      const conditionalLazySchema = z
        .lazy(() => (useString ? z.string() : z.number()))
        .openapi('ConditionalLazy');

      // This test verifies that the schema is evaluated at generation time
      expectSchema([conditionalLazySchema], {
        ConditionalLazy: {
          type: 'string', // Should be string since useString is true when evaluated
        },
      });
    });

    it('supports lazy schema with preprocessing', () => {
      const preprocessedLazySchema = z
        .lazy(() => z.preprocess(val => String(val).trim(), z.string().min(1)))
        .openapi('PreprocessedLazy');

      expectSchema([preprocessedLazySchema], {
        PreprocessedLazy: {
          type: 'string',
          minLength: 1,
          nullable: true,
        },
      });
    });

    it('supports lazy schema with transforms', () => {
      const transformedLazySchema = z
        .lazy(() => z.string().transform(val => val.toUpperCase()))
        .openapi('TransformedLazy');

      expectSchema([transformedLazySchema], {
        TransformedLazy: {
          type: 'string',
        },
      });
    });

    it('supports lazy schemas in nested arrays and objects', () => {
      const nestedLazySchema = z
        .object({
          data: z.array(
            z.object({
              items: z.array(z.lazy(() => z.string().uuid())),
            })
          ),
        })
        .openapi('NestedLazy');

      expectSchema([nestedLazySchema], {
        NestedLazy: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: {
                      type: 'string',
                      format: 'uuid',
                    },
                  },
                },
                required: ['items'],
              },
            },
          },
          required: ['data'],
        },
      });
    });
  });

  describe('OpenAPI version compatibility', () => {
    it('supports lazy schemas with OpenAPI 3.1', () => {
      const lazySchema = z
        .lazy(() => z.string().nullable())
        .openapi('LazyNullable');

      expectSchema(
        [lazySchema],
        {
          LazyNullable: {
            type: ['string', 'null'],
          },
        },
        { version: '3.1.0' }
      );
    });

    it('supports lazy schemas with OpenAPI 3.0', () => {
      const lazySchema = z
        .lazy(() => z.string().nullable())
        .openapi('LazyNullable');

      expectSchema(
        [lazySchema],
        {
          LazyNullable: {
            type: 'string',
            nullable: true,
          },
        },
        { version: '3.0.0' }
      );
    });
  });

  describe('performance and stability', () => {
    it('handles deep recursive nesting without stack overflow', () => {
      const levels = 9;

      // Create a deeply nested structure
      let currentSchema: z.ZodType<any> = z.string();
      for (let i = 0; i <= levels; i++) {
        const nextSchema = currentSchema;
        currentSchema = z.lazy(() =>
          z.object({
            level: z.number().default(i),
            nested: nextSchema.optional(),
          })
        );
      }

      const deepSchema = currentSchema.openapi('DeepNesting');

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

    it('handles multiple independent lazy schemas efficiently', () => {
      const schemas = Array.from({ length: 50 }, (_, i) =>
        z
          .lazy(() =>
            z.object({
              id: z.string(),
              value: z.number().default(i),
            })
          )
          .openapi(`LazySchema${i}`)
      );

      const expectedSchemas = Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => [
          `LazySchema${i}`,
          {
            type: 'object' as const,
            properties: {
              id: { type: 'string' as const },
              value: { type: 'number' as const, default: i },
            },
            required: ['id'],
          },
        ])
      ) as Record<string, any>;

      // This should complete in reasonable time without memory issues
      expectSchema(schemas, expectedSchemas);
    });
  });
});
