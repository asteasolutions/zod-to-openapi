import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('unknown', () => {
  it('supports unknown', () => {
    expectSchema(
      [
        registerSchema('Unknown', z.unknown()).openapi({
          description: 'Something unknown',
        }),
      ],
      {
        Unknown: { description: 'Something unknown' },
      }
    );
  });
});
