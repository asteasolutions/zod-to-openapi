import { z } from 'zod';
import { createSchemas } from '../lib/helpers';

describe('transform', () => {
  it('does not support transformed schemas', () => {
    expect(() =>
      createSchemas([
        z
          .number()
          .transform(num => num.toString())
          .openapi({ refId: 'Transformed' }),
      ])
    ).toThrow(/^Unknown zod object type/);
  });
});
