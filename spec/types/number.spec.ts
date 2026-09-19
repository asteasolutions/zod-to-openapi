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

  it('generates OpenAPI schema for z.int32()', () => {
    expectSchema([z.int32().openapi('Int32')], {
      Int32: { type: 'integer' },
    });
  });

  it('generates OpenAPI schema for z.uint32()', () => {
    expectSchema([z.uint32().openapi('Uint32')], {
      Uint32: { type: 'integer' },
    });
  });

  it('generates OpenAPI schema for z.float32() and z.float64()', () => {
    expectSchema(
      [z.float32().openapi('Float32'), z.float64().openapi('Float64')],
      {
        Float32: { type: 'number' },
        Float64: { type: 'number' },
      }
    );
  });

  it('supports nullable z.int32() with checks in open api 3.0.0', () => {
    expectSchema([z.int32().positive().nullable().openapi('Int32')], {
      Int32: {
        type: 'integer',
        nullable: true,
        minimum: 0,
        exclusiveMinimum: true,
      },
    });
  });

  it('supports nullable z.int32() with checks in open api 3.1.0', () => {
    expectSchema(
      [z.int32().positive().nullable().openapi('Int32')],
      {
        Int32: { type: ['integer', 'null'], exclusiveMinimum: 0 } as never,
      },
      { version: '3.1.0' }
    );
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
      { version: '3.1.0' }
    );
  });

  it('supports exclusive minimum in open api 3.1.0', () => {
    expectSchema(
      [z.number().int().gt(0).openapi('SimpleInteger')],
      {
        SimpleInteger: { type: 'integer', exclusiveMinimum: 0 } as never,
      },
      { version: '3.1.0' }
    );
  });

  it('supports maximum in open api 3.1.0', () => {
    expectSchema(
      [z.number().int().lte(0).openapi('SimpleInteger')],
      {
        SimpleInteger: { type: 'integer', maximum: 0 },
      },
      { version: '3.1.0' }
    );
  });

  it('supports exclusive maximum in open api 3.1.0', () => {
    expectSchema(
      [z.number().int().lt(0).openapi('SimpleInteger')],
      {
        SimpleInteger: { type: 'integer', exclusiveMaximum: 0 } as never,
      },
      { version: '3.1.0' }
    );
  });
});
