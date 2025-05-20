import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('pipe', () => {
  it('can generate schema for pipes', () => {
    expectSchema(
      [
        z
          .date()
          .or(
            z
              .string()
              .min(1)
              .pipe(z.transform(val => z.coerce.date().parse(val)))
          )
          .openapi('PipedDate'),
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
        z
          .number()
          .or(z.string())
          .pipe(z.transform(val => z.coerce.number().parse(val)))
          .openapi('PipedNumber'),
      ],
      {
        PipedNumber: { anyOf: [{ type: 'number' }, { type: 'string' }] },
      }
    );
  });
});
