import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypeDescribe,
} from '../lib/helpers';

registrationTypeDescribe('unknown', registrationType => {
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
