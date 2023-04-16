import { z } from 'zod';
import {
  expectSchema,
  registerSchema,
  registrationTypeDescribe,
} from '../lib/helpers';

registrationTypeDescribe('branded', registrationType => {
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
