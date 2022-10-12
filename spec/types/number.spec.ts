import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('number', () => {
  it('generates OpenAPI schema for a simple number type', () => {
    expectSchema([z.number().openapi({ refId: 'SimpleNumber' })], {
      SimpleNumber: { type: 'number' },
    });
  });

  it('generates OpenAPI schema for a simple integer type', () => {
    expectSchema([z.number().int().openapi({ refId: 'SimpleInteger' })], {
      SimpleInteger: { type: 'integer' },
    });
  });

  it('supports number literals', () => {
    expectSchema([z.literal(42).openapi({ refId: 'Literal' })], {
      Literal: { type: 'number', enum: [42] },
    });
  });
});
