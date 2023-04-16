import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypes,
} from '../lib/helpers';

registrationTypes.forEach(registrationType => {
  describe('nullable', () => {
    it('supports nullable', () => {
      expectSchema(
        [
          registerSchema(
            'NullableString',
            z.string(),
            registrationType
          ).nullable(),
        ],
        {
          NullableString: { type: 'string', nullable: true },
        }
      );
    });

    it('supports nullable for registered schemas', () => {
      const StringSchema = registerSchema(
        'String',
        z.string(),
        registrationType
      );

      const TestSchema = registerSchema(
        'Test',
        z.object({ key: StringSchema.nullable() }),
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
                { nullable: true },
              ],
            },
          },
          required: ['key'],
        },
      });
    });

    it('should not apply nullable if the schema is already nullable', () => {
      const StringSchema = registerSchema(
        'String',
        z.string(),
        registrationType
      ).nullable();

      const TestSchema = registerSchema(
        'Test',
        z.object({ key: StringSchema.nullable() }),
        registrationType
      );

      expectSchema([StringSchema, TestSchema], {
        String: {
          type: 'string',
          nullable: true,
        },
        Test: {
          type: 'object',
          properties: {
            key: { $ref: '#/components/schemas/String' },
          },
          required: ['key'],
        },
      });
    });

    it('supports nullable in open api 3.1.0', () => {
      expectSchema(
        [
          registerSchema(
            'NullableString',
            z.string().nullable(),
            registrationType
          ),
        ],
        {
          NullableString: { type: ['string', 'null'] },
        },
        '3.1.0'
      );
    });

    it('supports nullable for registered schemas in open api 3.1.0', () => {
      const StringSchema = registerSchema(
        'String',
        z.string(),
        registrationType
      );

      const TestSchema = registerSchema(
        'Test',
        z.object({ key: StringSchema.nullable() }),
        registrationType
      );

      expectSchema(
        [StringSchema, TestSchema],
        {
          String: {
            type: 'string',
          },
          Test: {
            type: 'object',
            properties: {
              key: {
                allOf: [
                  { $ref: '#/components/schemas/String' },
                  { type: ['string', 'null'] },
                ],
              },
            },
            required: ['key'],
          },
        },
        '3.1.0'
      );
    });

    it('should not apply nullable if the schema is already nullable in open api 3.1.0', () => {
      const StringSchema = registerSchema(
        'String',
        z.string().nullable(),
        registrationType
      );

      const TestSchema = registerSchema(
        'Test',
        z.object({ key: StringSchema.nullable() }),
        registrationType
      );

      expectSchema(
        [StringSchema, TestSchema],
        {
          String: {
            type: ['string', 'null'],
          },
          Test: {
            type: 'object',
            properties: {
              key: { $ref: '#/components/schemas/String' },
            },
            required: ['key'],
          },
        },
        '3.1.0'
      );
    });

    it('supports referencing nullable zod effects', () => {
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
        z.object({ key: EmptySchema.nullable().openapi({ deprecated: true }) }),
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
              allOf: [
                {
                  $ref: '#/components/schemas/Empty',
                },
                {
                  nullable: true,
                  deprecated: true,
                },
              ],
            },
          },
        },
      });
    });

    it('supports referencing nullable zod effects with Openapi v3.1.0', () => {
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
        z.object({
          key: EmptySchema.nullable().openapi({
            deprecated: true,
          }),
        }),
        registrationType
      );

      expectSchema(
        [EmptySchema, TestSchema],
        {
          Empty: {
            type: 'object',
          },
          Test: {
            type: 'object',
            required: ['key'],
            properties: {
              key: {
                allOf: [
                  {
                    $ref: '#/components/schemas/Empty',
                  },
                  {
                    type: ['object', 'null'],
                    deprecated: true,
                  },
                ],
              },
            },
          },
        },
        '3.1.0'
      );
    });

    it('overrides zod nullable when there is specified type in openapi', () => {
      const EmptySchema = registerSchema(
        'Empty',
        z
          .object({})
          .nullable()
          .transform(obj => obj as { [key: string]: never })
          .openapi({
            type: 'object',
          }),
        registrationType
      );

      expectSchema([EmptySchema], {
        Empty: {
          type: 'object',
        },
      });
    });
  });
});
