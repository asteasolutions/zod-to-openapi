import { z } from 'zod';
import { expectSchema, registerSchema } from '../lib/helpers';

describe('number', () => {
  it('generates OpenAPI schema for a simple number type', () => {
    expectSchema([registerSchema('SimpleNumber', z.number())], {
      SimpleNumber: { type: 'number' },
    });
  });

  it('generates OpenAPI schema for a simple integer type', () => {
    expectSchema([registerSchema('SimpleInteger', z.number().int())], {
      SimpleInteger: { type: 'integer' },
    });
  });

  it('supports number literals', () => {
    expectSchema([registerSchema('Literal', z.literal(42))], {
      Literal: { type: 'number', enum: [42] },
    });
  });
});
