import { z } from 'zod/v4';
import { expectSchema } from '../lib/helpers';

describe('bigint', () => {
  it('generates OpenAPI schema for a simple bigint type', () => {
    expectSchema([z.bigint().openapi('SimpleBigInt')], {
      SimpleBigInt: { type: 'string', pattern: `^\d+$` },
    });
  });
});
