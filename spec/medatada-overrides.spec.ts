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

  it('supports .openapi for registered schemas', () => {
    const StringSchema = z
      .string()
      .openapi({ refId: 'String', description: 'test' });

    const TestSchema = z
      .object({
        key: StringSchema.openapi({ example: 'test', deprecated: true }),
      })
      .openapi({ refId: 'Test' });

    expectSchema([StringSchema, TestSchema], {
      String: {
        description: 'test',
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
});
