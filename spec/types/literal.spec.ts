import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('literal', () => {
  it('generates OpenAPI schema for a string literal', () => {
    expectSchema([z.literal('john').openapi('Literal')], {
      Literal: { type: 'string', enum: ['john'] },
    });
  });

  it('generates OpenAPI schema for a number literal', () => {
    expectSchema([z.literal(42).openapi('Literal')], {
      Literal: { type: 'number', enum: [42] },
    });
  });

  it('generates OpenAPI schema for a boolean literal', () => {
    expectSchema([z.literal(true).openapi('Literal')], {
      Literal: { type: 'boolean', enum: [true] },
    });
  });

  it('supports literals with multiple string values', () => {
    expectSchema([z.literal(['john', 'jane']).openapi('Literal')], {
      Literal: { type: 'string', enum: ['john', 'jane'] },
    });
  });

  it('supports literals with multiple number values', () => {
    expectSchema([z.literal([0, 1]).openapi('Literal')], {
      Literal: { type: 'number', enum: [0, 1] },
    });
  });

  it('supports literals with multiple boolean values', () => {
    expectSchema([z.literal([true, false]).openapi('Literal')], {
      Literal: { type: 'boolean', enum: [true, false] },
    });
  });

  it('supports nullable literals with multiple values', () => {
    expectSchema([z.literal([0, 1]).nullable().openapi('Literal')], {
      Literal: { type: 'number', nullable: true, enum: [0, 1] },
    });
  });

  it('omits the type for literals with values of different types', () => {
    expectSchema([z.literal([0, 'john']).openapi('Literal')], {
      Literal: { enum: [0, 'john'] },
    });
  });

  it('supports null as one of multiple values', () => {
    expectSchema([z.literal([0, null]).openapi('Literal')], {
      Literal: { type: 'number', nullable: true, enum: [0, null] },
    });
  });

  it('supports a null literal in 3.0.0', () => {
    expectSchema(
      [z.literal(null).openapi('Literal')],
      { Literal: { nullable: true, enum: [null] } },
      { version: '3.0.0' }
    );
  });

  it('supports a null literal in 3.1.0', () => {
    expectSchema(
      [z.literal(null).openapi('Literal')],
      { Literal: { enum: [null] } },
      { version: '3.1.0' }
    );
  });

  it('generates OpenAPI schema for a bigint literal', () => {
    expectSchema([z.literal(BigInt(42)).openapi('Literal')], {
      Literal: { type: 'string', pattern: `^\\d+$` },
    });
  });
});
