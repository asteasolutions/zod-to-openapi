import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypeDescribe,
} from '../lib/helpers';

registrationTypeDescribe('array', registrationType => {
  it('supports arrays of strings', () => {
    expectSchema(
      [registerSchema('Array', z.array(z.string()), registrationType)],
      {
        Array: {
          type: 'array',
          items: { type: 'string' },
        },
      }
    );
  });

  it('supports minLength / maxLength on arrays', () => {
    expectSchema(
      [
        registerSchema(
          'Array',
          z.array(z.string()).min(5).max(10),
          registrationType
        ),
      ],
      {
        Array: {
          type: 'array',
          items: { type: 'string' },
          minItems: 5,
          maxItems: 10,
        },
      }
    );
  });
});
