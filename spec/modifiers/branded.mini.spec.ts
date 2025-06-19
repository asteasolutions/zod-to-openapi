import { z } from 'zod/v4-mini';
import { expectSchema, registerSchemas } from '../lib/helpers';

describe('zod mini - branded', () => {
  it('generates OpenAPI schema for branded type', () => {
    const schema = z.string().brand<'color'>();

    registerSchemas({ SimpleStringBranded: schema });

    expectSchema([schema], {
      SimpleStringBranded: { type: 'string' },
    });
  });
});
