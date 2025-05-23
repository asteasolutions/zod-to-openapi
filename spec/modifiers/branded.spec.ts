import { z } from 'zod/v4';
import { expectSchema } from '../lib/helpers';

describe('branded', () => {
  it('generates OpenAPI schema for branded type', () => {
    expectSchema([z.string().brand<'color'>().openapi('SimpleStringBranded')], {
      SimpleStringBranded: { type: 'string' },
    });
  });
});
