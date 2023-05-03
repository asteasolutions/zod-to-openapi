import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('union', () => {
  it('supports union types', () => {
    expectSchema([z.string().or(z.number()).openapi('Test')], {
      Test: {
        anyOf: [{ type: 'string' }, { type: 'number' }],
      },
    });

    expectSchema(
      [z.string().or(z.number()).or(z.array(z.string())).openapi('Test')],
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

  it('can automatically register union items', () => {
    const schema = z
      .union([z.string().openapi('StringId'), z.number().openapi('NumberId')])
      .openapi('Union');

    expectSchema([schema], {
      StringId: {
        type: 'string',
      },

      NumberId: {
        type: 'number',
      },

      Union: {
        anyOf: [
          { $ref: '#/components/schemas/StringId' },
          { $ref: '#/components/schemas/NumberId' },
        ],
      },
    });
  });

  it('supports nullable union types', () => {
    expectSchema([z.string().or(z.number()).nullable().openapi('Test')], {
      Test: {
        anyOf: [{ type: 'string' }, { type: 'number' }, { nullable: true }],
      },
    });
  });

  it('supports nullable union types in 3.1.0', () => {
    expectSchema(
      [z.string().or(z.number()).nullable().openapi('Test')],
      {
        Test: {
          anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
        },
      },
      '3.1.0'
    );
  });
});
