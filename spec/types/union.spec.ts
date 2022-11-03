import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('union', () => {
  it.concurrent('supports union types', () => {
    expectSchema([registerSchema('Test', z.string().or(z.number()))], {
      Test: {
        anyOf: [{ type: 'string' }, { type: 'number' }],
      },
    });

    expectSchema(
      [
        registerSchema(
          'Test',
          z.string().or(z.number()).or(z.array(z.string()))
        ),
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

  it.concurrent('supports nullable union types', () => {
    expectSchema(
      [registerSchema('Test', z.string().or(z.number()).nullable())],
      {
        Test: {
          anyOf: [{ type: 'string' }, { type: 'number' }, { nullable: true }],
        },
      }
    );
  });

  it.concurrent('supports nullable union types in 3.1.0', () => {
    expectSchema(
      [registerSchema('Test', z.string().or(z.number()).nullable())],
      {
        Test: {
          anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
        },
      },
      '3.1.0'
    );
  });
});
