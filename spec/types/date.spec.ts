import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypes,
} from '../lib/helpers';

registrationTypes.forEach(registrationType => {
  describe('date', () => {
    it('supports ZodDate and sets the type to `string`', () => {
      const schema = registerSchema('Date', z.date(), registrationType);
      expectSchema([schema], {
        Date: {
          type: 'string',
        },
      });
    });

    it('uses `string` as the example type when the schema infers to `Date`', () => {
      const example = new Date().toISOString();
      const schema = registerSchema('Date', z.date(), registrationType).openapi(
        { example }
      );
      expectSchema([schema], {
        Date: {
          type: 'string',
          example,
        },
      });
    });
  });
});
