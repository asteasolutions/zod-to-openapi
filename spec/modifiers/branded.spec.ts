import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('branded', () => {
  it('generates OpenAPI schema for branded type', () => {
    expectSchema(
      [registerSchema('SimpleStringBranded', z.string().brand<'color'>())],
      {
        SimpleStringBranded: { type: 'string' },
      }
    );
  });
});
