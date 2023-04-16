import { z } from 'zod';
import { expectSchema, registerSchema, registrationTypes } from './lib/helpers';

registrationTypes.forEach(registrationType => {
  describe('metadata overrides', () => {
    it.todo(
      'throws error for openapi data to be provided for unrecognized literal types'
    );

    it.todo(
      'throws error for openapi data to be provided for unrecognized enum types'
    );

    it('does not infer the type if one is provided using .openapi', () => {
      const schema = registerSchema(
        'StringAsNumber',
        z.string(),
        registrationType
      ).openapi({
        type: 'number',
      });
      expectSchema([schema], {
        StringAsNumber: { type: 'number' },
      });
    });

    it('can remove .openapi properties', () => {
      const schema = registerSchema('Test', z.string(), registrationType)
        .openapi({ description: 'test', deprecated: true })
        .openapi({ description: undefined, deprecated: undefined });

      expectSchema([schema], {
        Test: { type: 'string' },
      });
    });

    it('generates schemas with metadata', () => {
      expectSchema(
        [
          registerSchema('SimpleString', z.string(), registrationType).openapi({
            description: 'test',
          }),
        ],
        { SimpleString: { type: 'string', description: 'test' } }
      );
    });

    it('supports .openapi for registered schemas', () => {
      const StringSchema = registerSchema(
        'String',
        z.string(),
        registrationType
      );

      const TestSchema = registerSchema(
        'Test',
        z.object({
          key: StringSchema.openapi({ example: 'test', deprecated: true }),
        }),
        registrationType
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
      const StringSchema = registerSchema(
        'String',
        z.string(),
        registrationType
      ).openapi({
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
        }),
        registrationType
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
        }),
        registrationType
      );

      const TestSchema = registerSchema(
        'Test',
        z.object({
          key: StringSchema.nullable().openapi({ type: 'boolean' }),
        }),
        registrationType
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
    // the best support for it
    it('supports referencing zod effects', () => {
      const EmptySchema = registerSchema(
        'Empty',
        z
          .object({})
          .transform(obj => obj as { [key: string]: never })
          .openapi({
            type: 'object',
          }),
        registrationType
      );

      const TestSchema = registerSchema(
        'Test',
        z.object({ key: EmptySchema }),
        registrationType
      );

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
      const EmptySchema = registerSchema(
        'Empty',
        z
          .object({})
          .transform(obj => obj as { [key: string]: never })
          .openapi({
            type: 'object',
          }),
        registrationType
      );

      const UnionTestSchema = registerSchema(
        'UnionTest',
        z.union([z.string(), EmptySchema]).openapi({
          description: 'Union with empty object',
        }),
        registrationType
      );

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
  });
});
