import { z } from 'zod';
import { createSchemas, registerSchema } from '../lib/helpers';

describe('transform', () => {
  it('does support transformed schemas', () => {
    expect(
      createSchemas([
        registerSchema(
          'Transformed',
          z.number().transform(num => num.toString())
        ),
      ])
    ).toEqual({
      parameters: {},
      schemas: {
        Transformed: {
          type: 'number',
        },
      },
    });
  });
});
