import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('pipe', () => {
  z.string()
    .transform(val => val.length)
    .pipe(z.number().min(5));

  it('can generate schema for pipes', () => {
    expectSchema(
      [
        registerSchema(
          'PipedDate',
          z.date().or(z.string().min(1).pipe(z.coerce.date()))
        ),
      ],
      {
        PipedDate: {
          anyOf: [{ type: 'string' }, { type: 'string', minLength: 1 }],
        },
      },
      '3.1.0'
    );
  });

  it('can generate schema for pipes with internal type transformation', () => {
    expectSchema(
      [
        registerSchema(
          'PipedNumber',
          z.number().or(z.string()).pipe(z.coerce.number())
        ),
      ],
      {
        PipedNumber: { anyOf: [{ type: 'number' }, { type: 'string' }] },
      }
    );
  });
});
