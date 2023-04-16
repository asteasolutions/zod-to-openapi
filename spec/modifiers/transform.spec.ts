import { z } from 'zod';
import {
  createSchemas,
  registerSchema,
  registrationTypeDescribe,
} from '../lib/helpers';

registrationTypeDescribe('transform', registrationType => {
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
