import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('nullable', () => {
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

  it('should not apply nullable if the schema is already nullable', () => {
    const StringSchema = z.string().nullable().openapi({ refId: 'String' });

    const TestSchema = z
      .object({ key: StringSchema.nullable() })
      .openapi({ refId: 'Test' });

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
});
