import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('date', () => {
  it('supports dates by setting the type to "string" and serializing examples', () => {
    const example = new Date();
    const schema = z.date().openapi({ refId: 'Date', example });

    expectSchema([schema], {
      Date: {
        type: 'string',
        example: example.toISOString(),
      },
    });
  });
});
