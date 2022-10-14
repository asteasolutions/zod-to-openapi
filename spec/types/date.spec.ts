import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('date', () => {
  it('supports dates and sets the type to "string"', () => {
    const example = new Date('2022-10-14T09:39:30Z');
    const schema = z.date().openapi({ refId: 'Date', example });

    expectSchema([schema], {
      Date: {
        type: 'string',
        example,
      },
    });
  });
});
