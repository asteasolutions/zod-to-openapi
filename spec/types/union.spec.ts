import { z } from 'zod/v4';
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
      { version: '3.1.0' }
    );
  });

  it('supports inner nullable union types', () => {
    // adding to .nullable() for the recursive check
    const test = z
      .union([z.string(), z.number().nullable().nullable()])
      .openapi('Test');

    expectSchema([test], {
      Test: {
        anyOf: [{ type: 'string' }, { type: 'number' }, { nullable: true }],
      },
    });
  });

  it('supports inner nullable union types in 3.1.-', () => {
    // adding to .nullable() for the recursive check
    const test = z
      .union([z.string(), z.number().nullable().nullable()])
      .openapi('Test');

    expectSchema(
      [test],
      {
        Test: {
          anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
        },
      },
      { version: '3.1.0' }
    );
  });

  describe('unionPreferredType', () => {
    it('supports changing default union type to usage of oneOf', () => {
      const union1 = z.union([z.string(), z.number()]).openapi('Union1');
      const union2 = z.union([z.string(), z.boolean()]).openapi('Union2');

      expectSchema(
        [union1, union2],
        {
          Union1: {
            oneOf: [{ type: 'string' }, { type: 'number' }],
          },
          Union2: {
            oneOf: [{ type: 'string' }, { type: 'boolean' }],
          },
        },
        { unionPreferredType: 'oneOf' }
      );
    });

    it('supports overriding default oneOf for union to anyOf', () => {
      const union1 = z
        .union([z.string(), z.number()])
        .openapiAs('anyOf')
        .openapi('Union1');
      const union2 = z.union([z.string(), z.boolean()]).openapi('Union2');

      expectSchema(
        [union1, union2],
        {
          Union1: {
            anyOf: [{ type: 'string' }, { type: 'number' }],
          },
          Union2: {
            oneOf: [{ type: 'string' }, { type: 'boolean' }],
          },
        },
        { unionPreferredType: 'oneOf' }
      );
    });

    it('supports overriding default anyOf for union to oneOf', () => {
      const union1 = z
        .union([z.string(), z.number()])
        .openapiAs('oneOf')
        .openapi('Union1');
      const union2 = z.union([z.string(), z.boolean()]).openapi('Union2');

      expectSchema(
        [union1, union2],
        {
          Union1: {
            oneOf: [{ type: 'string' }, { type: 'number' }],
          },
          Union2: {
            anyOf: [{ type: 'string' }, { type: 'boolean' }],
          },
        },
        { unionPreferredType: 'anyOf' }
      );
    });
  });
});
