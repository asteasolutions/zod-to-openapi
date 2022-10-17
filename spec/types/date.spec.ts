import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('date', () => {
  it('supports ZodDate and sets the type to `string`', () => {
    const schema = z.date().openapi({ refId: 'Date' });
    expectSchema([schema], {
      Date: {
        type: 'string',
      },
    });
  });

  it('uses `string` as the example type when the schema infers to `Date`', () => {
    const example = new Date().toISOString();
    const schema = z.date().openapi({ refId: 'Date', example });
    expectSchema([schema], {
      Date: {
        type: 'string',
        example: example,
      },
    });
  });
});
