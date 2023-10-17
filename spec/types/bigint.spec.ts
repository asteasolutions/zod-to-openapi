import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('bigint', () => {
  it('generates OpenAPI schema for a simple bigint type', () => {
    expectSchema([z.bigint().openapi('SimpleBigInt')], {
      SimpleBigInt: { type: 'integer', format: 'int64' },
    });
  });

  it('supports minimum in open api 3.0.0', () => {
    expectSchema([z.bigint().gte(BigInt(0)).openapi('SimpleBigInteger')], {
      SimpleBigInteger: { type: 'integer', format: 'int64', minimum: 0 },
    });
  });

  it('supports exclusive minimum in open api 3.0.0', () => {
    expectSchema([z.bigint().gt(BigInt(0)).openapi('SimpleBigInteger')], {
      SimpleBigInteger: {
        type: 'integer',
        format: 'int64',
        minimum: 0,
        exclusiveMinimum: true,
      },
    });
  });

  it('supports maximum in open api 3.0.0', () => {
    expectSchema([z.bigint().lte(BigInt(0)).openapi('SimpleBigInteger')], {
      SimpleBigInteger: { type: 'integer', format: 'int64', maximum: 0 },
    });
  });

  it('supports exclusive maximum in open api 3.0.0', () => {
    expectSchema([z.bigint().lt(BigInt(0)).openapi('SimpleBigInteger')], {
      SimpleBigInteger: {
        type: 'integer',
        format: 'int64',
        maximum: 0,
        exclusiveMaximum: true,
      },
    });
  });

  it('supports minimum in open api 3.1.0', () => {
    expectSchema(
      [z.bigint().gte(BigInt(0)).openapi('SimpleBigInteger')],
      {
        SimpleBigInteger: { type: 'integer', format: 'int64', minimum: 0 },
      },
      '3.1.0'
    );
  });

  it('supports exclusive minimum in open api 3.1.0', () => {
    expectSchema(
      [z.bigint().gt(BigInt(0)).openapi('SimpleBigInteger')],
      {
        SimpleBigInteger: {
          type: 'integer',
          format: 'int64',
          exclusiveMinimum: 0,
        } as never,
      },
      '3.1.0'
    );
  });

  it('supports maximum in open api 3.1.0', () => {
    expectSchema(
      [z.bigint().lte(BigInt(0)).openapi('SimpleBigInteger')],
      {
        SimpleBigInteger: { type: 'integer', format: 'int64', maximum: 0 },
      },
      '3.1.0'
    );
  });

  it('supports exclusive maximum in open api 3.1.0', () => {
    expectSchema(
      [z.bigint().lt(BigInt(0)).openapi('SimpleBigInteger')],
      {
        SimpleBigInteger: {
          type: 'integer',
          format: 'int64',
          exclusiveMaximum: 0,
        } as never,
      },
      '3.1.0'
    );
  });
});
