import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypes,
} from '../lib/helpers';


registrationTypes.forEach(registrationType => {

})

registrationTypes.forEach(registrationType => {
  describe('branded', () => {
    it('generates OpenAPI schema for branded type', () => {
      expectSchema(
        [
          registerSchema(
            'SimpleStringBranded',
            z.string().brand<'color'>(),
            registrationType
          ),
        ],
        {
          SimpleStringBranded: { type: 'string' },
        }
      );
    });
  });
});
