import { z, ZodString } from 'zod';
import { createSchemas, expectSchema } from './lib/helpers';

describe('Simple', () => {
  describe('ZodString', () => {
    it('generates OpenAPI schema for simple types', () => {
      expectSchema([z.string().openapi({ refId: 'SimpleString' })], {
        SimpleString: { type: 'string' },
      });
    });

    it.each`
      format     | zodString             | expected
      ${'uuid'}  | ${z.string().uuid()}  | ${'uuid'}
      ${'email'} | ${z.string().email()} | ${'email'}
      ${'url'}   | ${z.string().url()}   | ${'uri'}
    `(
      'maps a ZodString $format to $expected format',
      ({ zodString, expected }: { zodString: ZodString; expected: string }) => {
        expectSchema([zodString.openapi({ refId: 'ZodString' })], {
          ZodString: { type: 'string', format: expected },
        });
      }
    );

    it('maps a ZodString regex to a pattern', () => {
      expectSchema(
        [
          z
            .string()
            .regex(/^hello world/)
            .openapi({ refId: 'RegexString' }),
        ],
        {
          RegexString: { type: 'string', pattern: '^hello world' },
        }
      );
    });
  });

  describe('ZodNumber', () => {
    it('generates OpenAPI schema for a simple number type', () => {
      expectSchema([z.number().openapi({ refId: 'SimpleNumber' })], {
        SimpleNumber: { type: 'number' },
      });
    });

    it('generates OpenAPI schema for a simple integer type', () => {
      expectSchema([z.number().int().openapi({ refId: 'SimpleInteger' })], {
        SimpleInteger: { type: 'integer' },
      });
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

  it('supports native numeric enums', () => {
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
        enum: [1, 42, 3],
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

  it('supports discriminated unions', () => {
    const Text = z.object({ type: z.literal('text'), text: z.string() });
    const Image = z.object({ type: z.literal('image'), src: z.string() });

    expectSchema(
      [z.discriminatedUnion('type', [Text, Image]).openapi({ refId: 'Test' })],
      {
        Test: {
          anyOf: [
            {
              type: 'object',
              required: ['type', 'text'],
              properties: {
                type: { type: 'string', enum: ['text'] },
                text: { type: 'string' },
              },
            },
            {
              type: 'object',
              required: ['type', 'src'],
              properties: {
                type: { type: 'string', enum: ['image'] },
                src: { type: 'string' },
              },
            },
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

  it('supports nullable', () => {
    expectSchema([z.string().nullable().openapi({ refId: 'NullableString' })], {
      NullableString: { type: 'string', nullable: true },
    });
  });

  it('supports nullable for registered schemas', () => {
    const StringSchema = z.string().openapi({ refId: 'String' });

    const TestSchema = z
      .object({ key: StringSchema.nullable() })
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
              { nullable: true },
            ],
          },
        },
        required: ['key'],
      },
    });
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

  describe('defaults', () => {
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

    it('supports optional defaults', () => {
      expectSchema(
        [
          z
            .object({
              test: z.ostring().default('test'),
            })
            .openapi({ refId: 'ObjectWithDefault' }),
        ],
        {
          ObjectWithDefault: {
            type: 'object',
            properties: {
              test: {
                type: 'string',
              },
            },
          },
        }
      );
    });

    it('supports required defaults', () => {
      expectSchema(
        [
          z
            .object({
              test: z.string().default('test'),
            })
            .openapi({ refId: 'ObjectWithDefault' }),
        ],
        {
          ObjectWithDefault: {
            type: 'object',
            properties: {
              test: {
                type: 'string',
              },
            },
            required: ['test'],
          },
        }
      );
    });

    it('supports optional default schemas with refine', () => {
      expectSchema(
        [
          z
            .object({
              test: z
                .onumber()
                .default(42)
                .refine(num => num && num % 2 === 0),
            })
            .openapi({ refId: 'Object' }),
        ],
        {
          Object: {
            type: 'object',
            properties: {
              test: {
                type: 'number',
              },
            },
          },
        }
      );
    });

    it('supports required default schemas with refine', () => {
      expectSchema(
        [
          z
            .object({
              test: z
                .number()
                .default(42)
                .refine(num => num && num % 2 === 0),
            })
            .openapi({ refId: 'Object' }),
        ],
        {
          Object: {
            type: 'object',
            properties: {
              test: {
                type: 'number',
              },
            },
            required: ['test'],
          },
        }
      );
    });
  });

  describe('refined', () => {
    it('supports refined schemas', () => {
      expectSchema(
        [
          z
            .number()
            .refine(num => num % 2 === 0)
            .openapi({ refId: 'RefinedString' }),
        ],
        {
          RefinedString: {
            type: 'number',
          },
        }
      );
    });

    it('supports required refined schemas', () => {
      expectSchema(
        [
          z
            .object({
              test: z.number().refine(num => num && num % 2 === 0),
            })
            .openapi({ refId: 'ObjectWithRefinedString' }),
        ],
        {
          ObjectWithRefinedString: {
            type: 'object',
            properties: {
              test: {
                type: 'number',
              },
            },
            required: ['test'],
          },
        }
      );
    });

    it('supports optional refined schemas', () => {
      expectSchema(
        [
          z
            .object({
              test: z.onumber().refine(num => num && num % 2 === 0),
            })
            .openapi({ refId: 'ObjectWithRefinedString' }),
        ],
        {
          ObjectWithRefinedString: {
            type: 'object',
            properties: {
              test: {
                type: 'number',
              },
            },
          },
        }
      );
    });

    it('supports optional refined schemas with default', () => {
      expectSchema(
        [
          z
            .object({
              test: z
                .onumber()
                .refine(num => num && num % 2 === 0)
                .default(42),
            })
            .openapi({ refId: 'Object' }),
        ],
        {
          Object: {
            type: 'object',
            properties: {
              test: {
                type: 'number',
              },
            },
          },
        }
      );
    });

    it('supports required refined schemas with default', () => {
      expectSchema(
        [
          z
            .object({
              test: z
                .number()
                .refine(num => num && num % 2 === 0)
                .default(42),
            })
            .openapi({ refId: 'Object' }),
        ],
        {
          Object: {
            type: 'object',
            properties: {
              test: {
                type: 'number',
              },
            },
            required: ['test'],
          },
        }
      );
    });

    it('supports refined transforms when type is provided', () => {
      expectSchema(
        [
          z
            .object({
              test: z
                .string()
                .transform(value => value.trim())
                .refine(val => val.length >= 1, 'Value not set.')
                .openapi({
                  type: 'string',
                }),
            })
            .openapi({ refId: 'Object' }),
        ],
        {
          Object: {
            type: 'object',
            properties: {
              test: {
                type: 'string',
              },
            },
            required: ['test'],
          },
        }
      );
    });
  });

  describe('preprocessed', () => {
    it('supports preprocessed string -> boolean schema', () => {
      expectSchema(
        [
          z
            .preprocess(arg => {
              if (typeof arg === 'boolean') {
                return arg;
              }

              if (typeof arg === 'string') {
                if (arg === 'true') return true;
                if (arg === 'false') return false;
              }

              return undefined;
            }, z.boolean())
            .openapi({ refId: 'PreprocessedBoolean' }),
        ],
        {
          PreprocessedBoolean: {
            type: 'boolean',
          },
        }
      );
    });

    it('supports preprocessed string -> number schema', () => {
      expectSchema(
        [
          z
            .preprocess(arg => {
              if (typeof arg === 'number') {
                return arg;
              }

              if (typeof arg === 'string') {
                return parseInt(arg, 10);
              }

              return undefined;
            }, z.number())
            .openapi({ refId: 'PreprocessedNumber' }),
        ],
        {
          PreprocessedNumber: {
            type: 'number',
          },
        }
      );
    });
  });

  it('does not support transformed schemas', () => {
    expect(() =>
      createSchemas([
        z
          .number()
          .transform(num => num.toString())
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
});
