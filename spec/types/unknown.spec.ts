import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

it.concurrent('supports unknown', () => {
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
