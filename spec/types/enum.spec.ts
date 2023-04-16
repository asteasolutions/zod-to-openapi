import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypes,
} from '../lib/helpers';

registrationTypes.forEach(registrationType => {
  describe('enum', () => {
    it('supports enums', () => {
      const schema = registerSchema(
        'Enum',
        z.enum(['option1', 'option2']),
        registrationType
      ).openapi({ description: 'All possible options' });

      expectSchema([schema], {
        Enum: {
          type: 'string',
          description: 'All possible options',
          enum: ['option1', 'option2'],
        },
      });
    });
  });
});
