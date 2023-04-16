import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypes,
} from '../lib/helpers';

registrationTypes.forEach(registrationType => {
  it('supports unknown', () => {
    expectSchema(
      [
        registerSchema('Unknown', z.unknown(), registrationType).openapi({
          description: 'Something unknown',
        }),
      ],
      {
        Unknown: { description: 'Something unknown' },
      }
    );
  });
});
