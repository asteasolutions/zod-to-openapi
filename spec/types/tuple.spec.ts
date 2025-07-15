import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('tuple', () => {
  it('supports tuples in 3.0.0', () => {
    expectSchema(
      [z.tuple([z.string(), z.number(), z.boolean()]).openapi('Test')],
      {
        Test: {
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
      },
      { version: '3.0.0' }
    );
  });

  it('supports tuples in 3.1.0', () => {
    expectSchema(
      [z.tuple([z.string(), z.number(), z.boolean()]).openapi('Test')],
      {
        Test: {
          type: 'array',
          prefixItems: [
            { type: 'string' },
            { type: 'number' },
            { type: 'boolean' },
          ],
        },
      },
      { version: '3.1.0' }
    );
  });

  it('supports tuples of the same single type', () => {
    expectSchema([z.tuple([z.string(), z.string()]).openapi('Test')], {
      Test: {
        type: 'array',
        items: {
          type: 'string',
        },
        minItems: 2,
        maxItems: 2,
      },
    });
  });

  it('supports tuples of duplicate types in 3.0.0', () => {
    expectSchema(
      [z.tuple([z.string(), z.number(), z.string()]).openapi('Test')],
      {
        Test: {
          type: 'array',
          items: {
            anyOf: [{ type: 'string' }, { type: 'number' }],
          },
          minItems: 3,
          maxItems: 3,
        },
      }
    );
  });

  it('supports tuples of duplicate types in 3.1.0', () => {
    expectSchema(
      [z.tuple([z.string(), z.number(), z.string()]).openapi('Test')],
      {
        Test: {
          type: 'array',
          prefixItems: [
            { type: 'string' },
            { type: 'number' },
            { type: 'string' },
          ],
        },
      },
      { version: '3.1.0' }
    );
  });

  it('supports tuples of referenced schemas', () => {
    const stringSchema = z.string().openapi('String');

    const testSchema = z
      .tuple([stringSchema, z.number(), z.string()])
      .openapi('Test');

    expectSchema([stringSchema, testSchema], {
      String: {
        type: 'string',
      },
      Test: {
        type: 'array',
        items: {
          anyOf: [
            { $ref: '#/components/schemas/String' },
            { type: 'number' },
            { type: 'string' },
          ],
        },
        minItems: 3,
        maxItems: 3,
      },
    });
  });

  it('can automatically register tuple items', () => {
    const schema = z
      .tuple([z.string().openapi('StringId'), z.number().openapi('NumberId')])
      .openapi('Tuple');

    expectSchema([schema], {
      StringId: {
        type: 'string',
      },

      NumberId: {
        type: 'number',
      },

      Tuple: {
        type: 'array',

        items: {
          anyOf: [
            { $ref: '#/components/schemas/StringId' },
            { $ref: '#/components/schemas/NumberId' },
          ],
        },
        maxItems: 2,
        minItems: 2,
      },
    });
  });

  describe('nullable', () => {
    it('supports tuples with nullable in 3.0.0', () => {
      expectSchema(
        [z.tuple([z.string().nullable(), z.string()]).openapi('Test')],
        {
          Test: {
            type: 'array',
            items: {
              anyOf: [{ type: 'string', nullable: true }, { type: 'string' }],
            },
            minItems: 2,
            maxItems: 2,
          },
        },
        { version: '3.0.0' }
      );
    });

    it('supports tuples with nullable in 3.1.0', () => {
      expectSchema(
        [
          z
            .tuple([z.string().nullable(), z.number().nullable()])
            .openapi('Test'),
        ],
        {
          Test: {
            type: 'array',
            prefixItems: [
              { type: ['string', 'null'] },
              { type: ['number', 'null'] },
            ],
          },
        },
        { version: '3.1.0' }
      );
    });

    it('supports nullable tuples in 3.0.0', () => {
      expectSchema(
        [z.tuple([z.string(), z.number()]).nullable().openapi('Test')],
        {
          Test: {
            type: 'array',
            items: {
              anyOf: [{ type: 'string' }, { type: 'number' }],
            },
            minItems: 2,
            maxItems: 2,
            nullable: true,
          },
        },
        { version: '3.0.0' }
      );
    });

    it('supports nullable tuples in 3.1.0', () => {
      expectSchema(
        [z.tuple([z.string(), z.number()]).nullable().openapi('Test')],
        {
          Test: {
            type: ['array', 'null'],
            prefixItems: [{ type: 'string' }, { type: 'number' }],
          },
        },
        { version: '3.1.0' }
      );
    });
  });
});
