import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('transform', () => {
  it('does support transformed schemas', () => {
    expectSchema(
      [
        z
          .number()
          .transform(num => num.toString())
          .openapi('Transformed'),
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
