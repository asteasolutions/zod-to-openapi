import { z } from 'zod';
import { createSchemas, registerSchema } from '../lib/helpers';

describe('transform', () => {
  it('does not support transformed schemas', () => {
    expect(() =>
      createSchemas([
        registerSchema(
          'Transformed',
          z.number().transform(num => num.toString())
        ),
      ])
    ).toThrow(/^Unknown zod object type/);
  });
});
