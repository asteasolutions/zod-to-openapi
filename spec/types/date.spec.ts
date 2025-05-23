import { z } from 'zod/v4';
import { expectSchema } from '../lib/helpers';

describe('date', () => {
  it('supports ZodDate and sets the type to `string`', () => {
    const schema = z.date().openapi('Date');

    expectSchema([schema], {
      Date: {
        type: 'string',
      },
    });
  });

  it('uses `string` as the example type when the schema infers to `Date`', () => {
    const example = new Date().toISOString();
    const schema = z.date().openapi('Date', { example });

    expectSchema([schema], {
      Date: {
        type: 'string',
        example,
      },
    });
  });
});
