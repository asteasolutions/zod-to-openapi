import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('transform', () => {
  it('does support transformed schemas', () => {
    expectSchema(
      [
        registerSchema(
          'Transformed',
          z.number().transform(num => num.toString())
        ),
      ],
      {
        Transformed: {
          type: 'number',
        },
      },
      '3.1.0'
    );
  });
});
