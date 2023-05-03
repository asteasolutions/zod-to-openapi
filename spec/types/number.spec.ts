import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('number', () => {
  it('generates OpenAPI schema for a simple number type', () => {
    expectSchema([z.number().openapi('SimpleNumber')], {
      SimpleNumber: { type: 'number' },
    });
  });

  it('generates OpenAPI schema for a simple integer type', () => {
    expectSchema([z.number().int().openapi('SimpleInteger')], {
      SimpleInteger: { type: 'integer' },
    });
  });

  it('supports number literals', () => {
    expectSchema([z.literal(42).openapi('Literal')], {
      Literal: { type: 'number', enum: [42] },
    });
  });

  it('supports minimum in open api 3.0.0', () => {
    expectSchema([z.number().int().gte(0).openapi('SimpleInteger')], {
      SimpleInteger: { type: 'integer', minimum: 0 },
    });
  });

  it('supports exclusive minimum in open api 3.0.0', () => {
    expectSchema([z.number().int().gt(0).openapi('SimpleInteger')], {
      SimpleInteger: {
        type: 'integer',
        minimum: 0,
        exclusiveMinimum: true,
      },
    });
  });

  it('supports maximum in open api 3.0.0', () => {
    expectSchema([z.number().int().lte(0).openapi('SimpleInteger')], {
      SimpleInteger: { type: 'integer', maximum: 0 },
    });
  });

  it('supports exclusive maximum in open api 3.0.0', () => {
    expectSchema([z.number().int().lt(0).openapi('SimpleInteger')], {
      SimpleInteger: {
        type: 'integer',
        maximum: 0,
        exclusiveMaximum: true,
      },
    });
  });

  it('supports minimum in open api 3.1.0', () => {
    expectSchema(
      [z.number().int().gte(0).openapi('SimpleInteger')],
      {
        SimpleInteger: { type: 'integer', minimum: 0 },
      },
      '3.1.0'
    );
  });

  it('supports exclusive minimum in open api 3.1.0', () => {
    expectSchema(
      [z.number().int().gt(0).openapi('SimpleInteger')],
      {
        SimpleInteger: { type: 'integer', exclusiveMinimum: 0 } as never,
      },
      '3.1.0'
    );
  });

  it('supports maximum in open api 3.1.0', () => {
    expectSchema(
      [z.number().int().lte(0).openapi('SimpleInteger')],
      {
        SimpleInteger: { type: 'integer', maximum: 0 },
      },
      '3.1.0'
    );
  });

  it('supports exclusive maximum in open api 3.1.0', () => {
    expectSchema(
      [z.number().int().lt(0).openapi('SimpleInteger')],
      {
        SimpleInteger: { type: 'integer', exclusiveMaximum: 0 } as never,
      },
      '3.1.0'
    );
  });
});
