import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypeDescribe,
} from '../lib/helpers';

registrationTypeDescribe('union', registrationType => {
  it('supports union types', () => {
    expectSchema(
      [registerSchema('Test', z.string().or(z.number()), registrationType)],
      {
        Test: {
          anyOf: [{ type: 'string' }, { type: 'number' }],
        },
      }
    );

    expectSchema(
      [
        registerSchema(
          'Test',
          z.string().or(z.number()).or(z.array(z.string())),
          registrationType
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

  it('supports nullable union types', () => {
    expectSchema(
      [
        registerSchema(
          'Test',
          z.string().or(z.number()).nullable(),
          registrationType
        ),
      ],
      {
        Test: {
          anyOf: [{ type: 'string' }, { type: 'number' }, { nullable: true }],
        },
      }
    );
  });

  it('supports nullable union types in 3.1.0', () => {
    expectSchema(
      [
        registerSchema(
          'Test',
          z.string().or(z.number()).nullable(),
          registrationType
        ),
      ],
      {
        Test: {
          anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
        },
      },
      '3.1.0'
    );
  });
});
