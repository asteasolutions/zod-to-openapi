import { z } from 'zod';
import {
  createSchemas,
  registerSchema,
  registrationTypes,
} from '../lib/helpers';

registrationTypes.forEach(registrationType => {
  describe('transform', () => {
    it('does not support transformed schemas', () => {
      expect(() =>
        createSchemas([
          registerSchema(
            'Transformed',
            z.number().transform(num => num.toString()),
            registrationType
          ),
        ])
      ).toThrow(/^Unknown zod object type/);
    });
  });
});
