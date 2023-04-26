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

  it('supports minimum in open api 3.0.0', () => {
    expectSchema([registerSchema('SimpleInteger', z.number().int().gte(0))], {
      SimpleInteger: { type: 'integer', minimum: 0 },
    });
  });

  it('supports exclusive minimum in open api 3.0.0', () => {
    expectSchema([registerSchema('SimpleInteger', z.number().int().gt(0))], {
      SimpleInteger: { type: 'integer', minimum: 0, exclusiveMinimum: true },
    });
  });

  it('supports maximum in open api 3.0.0', () => {
    expectSchema([registerSchema('SimpleInteger', z.number().int().lte(0))], {
      SimpleInteger: { type: 'integer', maximum: 0 },
    });
  });

  it('supports exclusive maximum in open api 3.0.0', () => {
    expectSchema([registerSchema('SimpleInteger', z.number().int().lt(0))], {
      SimpleInteger: { type: 'integer', maximum: 0, exclusiveMaximum: true },
    });
  });

  it('supports minimum in open api 3.1.0', () => {
    expectSchema(
      [registerSchema('SimpleInteger', z.number().int().gte(0))],
      {
        SimpleInteger: { type: 'integer', minimum: 0 },
      },
      '3.1.0'
    );
  });

  it('supports exclusive minimum in open api 3.1.0', () => {
    expectSchema(
      [registerSchema('SimpleInteger', z.number().int().gt(0))],
      {
        SimpleInteger: { type: 'integer', exclusiveMinimum: 0 } as any,
      },
      '3.1.0'
    );
  });

  it('supports maximum in open api 3.1.0', () => {
    expectSchema(
      [registerSchema('SimpleInteger', z.number().int().lte(0))],
      {
        SimpleInteger: { type: 'integer', maximum: 0 },
      },
      '3.1.0'
    );
  });

  it('supports exclusive maximum in open api 3.1.0', () => {
    expectSchema(
      [registerSchema('SimpleInteger', z.number().int().lt(0))],
      {
        SimpleInteger: { type: 'integer', exclusiveMaximum: 0 } as any,
      },
      '3.1.0'
    );
  });
});
