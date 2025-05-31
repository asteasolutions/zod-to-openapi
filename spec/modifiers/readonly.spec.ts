import { z } from 'zod/v4';
import { expectSchema } from '../lib/helpers';

describe('readonly', () => {
  it('supports readonly', () => {
    expectSchema([z.string().readonly().openapi('ReadonlyString')], {
      ReadonlyString: {
        type: 'string',
      },
    });
  });
});
