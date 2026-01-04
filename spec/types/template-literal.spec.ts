import { z } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('template literal', () => {
  it('generates OpenAPI schema for simple string template', () => {
    expectSchema([z.templateLiteral(['id-']).openapi('SimpleTemplate')], {
      SimpleTemplate: { type: 'string', pattern: '^id-$' },
    });
  });

  it('generates OpenAPI schema for template with string interpolation', () => {
    expectSchema(
      [
        z
          .templateLiteral(['id-', z.string(), '-suffix'])
          .openapi('InterpolatedTemplate'),
      ],
      {
        InterpolatedTemplate: { type: 'string', pattern: '^id-.*-suffix$' },
      }
    );
  });

  it('generates OpenAPI schema for template with number interpolation', () => {
    expectSchema(
      [z.templateLiteral(['count-', z.number()]).openapi('NumberTemplate')],
      {
        NumberTemplate: {
          type: 'string',
          pattern: '^count-[+-]?\\d+(\\.\\d+)?$',
        },
      }
    );
  });

  it('generates OpenAPI schema for template with literal interpolation', () => {
    expectSchema(
      [
        z
          .templateLiteral(['val-', z.literal('abc')])
          .openapi('LiteralTemplate'),
      ],
      {
        LiteralTemplate: { type: 'string', pattern: '^val-abc$' },
      }
    );
  });

  it('generates OpenAPI schema for template with enum interpolation', () => {
    expectSchema(
      [
        z
          .templateLiteral(['status-', z.enum(['active', 'inactive'])])
          .openapi('EnumTemplate'),
      ],
      {
        EnumTemplate: { type: 'string', pattern: '^status-(active|inactive)$' },
      }
    );
  });

  it('generates OpenAPI schema for template with boolean interpolation', () => {
    expectSchema(
      [z.templateLiteral(['is-', z.boolean()]).openapi('BooleanTemplate')],
      {
        BooleanTemplate: { type: 'string', pattern: '^is-(true|false)$' },
      }
    );
  });

  it('generates OpenAPI schema for complex template', () => {
    expectSchema(
      [
        z
          .templateLiteral(['id-', z.string(), '-', z.number(), '-end'])
          .openapi('ComplexTemplate'),
      ],
      {
        ComplexTemplate: {
          type: 'string',
          pattern: '^id-.*-[+-]?\\d+(\\.\\d+)?-end$',
        },
      }
    );
  });
});
