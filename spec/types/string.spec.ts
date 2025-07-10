import { z, ZodString } from 'zod';
import { expectSchema } from '../lib/helpers';

describe('string', () => {
  it('generates OpenAPI schema for simple types', () => {
    expectSchema([z.string().openapi('SimpleString')], {
      SimpleString: { type: 'string' },
    });
  });

  it('supports exact length on string', () => {
    expectSchema([z.string().length(5).openapi('minMaxLengthString')], {
      minMaxLengthString: { type: 'string', minLength: 5, maxLength: 5 },
    });
  });

  it('supports minLength / maxLength on string', () => {
    expectSchema([z.string().min(5).max(10).openapi('minMaxLengthString')], {
      minMaxLengthString: { type: 'string', minLength: 5, maxLength: 10 },
    });
  });

  it('supports the combination of min/max + length on string', () => {
    expectSchema(
      [
        z.string().length(5).min(4).openapi('minAndLengthString'),
        z.string().max(10).length(5).openapi('maxAndLengthString'),
      ],
      {
        minAndLengthString: { type: 'string', minLength: 5, maxLength: 5 },
        maxAndLengthString: { type: 'string', minLength: 5, maxLength: 5 },
      }
    );
  });

  it('supports string literals', () => {
    expectSchema([z.literal('John Doe').openapi('Literal')], {
      Literal: { type: 'string', enum: ['John Doe'] },
    });
  });

  it('maps a ZodString regex to a pattern', () => {
    expectSchema(
      [
        z
          .string()
          .regex(/^hello world/)
          .openapi('RegexString'),
      ],
      {
        RegexString: { type: 'string', pattern: '^hello world' },
      }
    );
  });
});
