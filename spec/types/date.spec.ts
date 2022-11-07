import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('date', () => {
  it('supports ZodDate and sets the type to `string`', () => {
    const schema = registerSchema('Date', z.date());
    expectSchema([schema], {
      Date: {
        type: 'string',
      },
    });
  });

  it('uses `string` as the example type when the schema infers to `Date`', () => {
    const example = new Date().toISOString();
    const schema = registerSchema('Date', z.date()).openapi({ example });
    expectSchema([schema], {
      Date: {
        type: 'string',
        example,
      },
    });
  });
});
