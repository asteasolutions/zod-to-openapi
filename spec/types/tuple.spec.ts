import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypes,
} from '../lib/helpers';

registrationTypes.forEach(registrationType => {
  describe('tuple', () => {
    it('supports tuples', () => {
      expectSchema(
        [
          registerSchema(
            'Test',
            z.tuple([z.string(), z.number(), z.boolean()]),
            registrationType
          ),
        ],
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
        }
      );
    });

    it('supports tuples of the same single type', () => {
      expectSchema(
        [
          registerSchema(
            'Test',
            z.tuple([z.string(), z.string()]),
            registrationType
          ),
        ],
        {
          Test: {
            type: 'array',
            items: {
              type: 'string',
            },
            minItems: 2,
            maxItems: 2,
          },
        }
      );
    });

    it('supports tuples of duplicate types', () => {
      expectSchema(
        [
          registerSchema(
            'Test',
            z.tuple([z.string(), z.number(), z.string()]),
            registrationType
          ),
        ],
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

    it('supports tuples of referenced schemas', () => {
      const stringSchema = registerSchema(
        'String',
        z.string(),
        registrationType
      );

      const testSchema = registerSchema(
        'Test',
        z.tuple([stringSchema, z.number(), z.string()]),
        registrationType
      );

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

    describe('nullable', () => {
      it('supports tuples with nullable in 3.0.0', () => {
        expectSchema(
          [
            registerSchema(
              'Test',
              z.tuple([z.string().nullable(), z.string()]),
              registrationType
            ),
          ],
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
          '3.0.0'
        );
      });

      it('supports tuples with nullable in 3.1.0', () => {
        expectSchema(
          [
            registerSchema(
              'Test',
              z.tuple([z.string().nullable(), z.number().nullable()]),
              registrationType
            ),
          ],
          {
            Test: {
              type: 'array',
              items: {
                anyOf: [
                  { type: ['string', 'null'] },
                  { type: ['number', 'null'] },
                ],
              },
              minItems: 2,
              maxItems: 2,
            },
          },
          '3.1.0'
        );
      });

      it('supports nullable tuples in 3.0.0', () => {
        expectSchema(
          [
            registerSchema(
              'Test',
              z.tuple([z.string(), z.number()]).nullable(),
              registrationType
            ),
          ],
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
          '3.0.0'
        );
      });

      it('supports nullable tuples in 3.1.0', () => {
        expectSchema(
          [
            registerSchema(
              'Test',
              z.tuple([z.string(), z.number()]).nullable(),
              registrationType
            ),
          ],
          {
            Test: {
              type: ['array', 'null'],
              items: {
                anyOf: [{ type: 'string' }, { type: 'number' }],
              },
              minItems: 2,
              maxItems: 2,
            },
          },
          '3.1.0'
        );
      });
    });
  });
});
